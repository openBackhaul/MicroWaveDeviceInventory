'use strict';

const utility = require('../../utility');
const integerProfile = require('onf-core-model-ap/applicationPattern/onfModel/models/profile/IntegerProfile');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const deviceControlConstructUtility = require('./deviceControlConstructUtility');
const deviceMetaDataPriorityList = require('./DeviceMetaDataPriorityList');
const deviceMetadataCacheUpdate = require('./DeviceMetaDataCacheUpdate');
const logger = require('./../../../LoggingService.js').getLogger();
const { logSlidingWindowActivity } = require('./../../../../utils/alarmLogTracker.js');
//const pLimit = require("p-limit").default;

let slidingWindowSize = 0;
let responseTimeOut = 0;
let maximumNumberOfRetries = 0;
let slidingWindowRunner = undefined;

// Sliding window duration tracking
let startTime = null;
let endTime = null;

/**
 * Sliding window style CC sync runner (live → cache).
 * Concurrency is strictly limited by `slidingWindowSize`.
 */
class SlidingWindow {
    constructor(getNextDevice) {
        this.getNextDevice = getNextDevice;
        this.slidingWindowSize = slidingWindowSize;

        this.active = 0;
        this.stopped = false;
        
        logSlidingWindowActivity(`SlidingWindow: is stopped ? ${this.stopped}`);
        //logSlidingWindowActivity(`SlidingWindow: Active device count ${this.active} devices...`);
        logSlidingWindowActivity(`SlidingWindow: Response timeout set to ${responseTimeOut} ms.`);
        logSlidingWindowActivity(`SlidingWindow: Maximum retries ${maximumNumberOfRetries} for each device.`);

         /**
         * Declare + initialize queue limiter
         * Ensures at most `slidingWindowSize` parallel executions
         */
        //this.limit = pLimit(slidingWindowSize);
        this.enqueue = createConcurrencyQueue(slidingWindowSize);

        // starts the sliding window
        //this.startDeviceSyncProcess();
        this.startQueue();
    }



    async startQueue() {
        while (!this.stopped) {
            const device = await this.getNextDevice();
            if (!device) {
                logSlidingWindowActivity(`SlidingWindow: No more devices to process at the moment.`);
                endTime = Date.now();
                logSlidingWindowDuration();
                await sleep(2000);   // nothing to do → recheck later
                continue;
            }

            // lock device
            await deviceMetaDataPriorityList.setLockedStatusOfDevice(device["mount-name"], true);

            // submit job to concurrency queue
            this.enqueue(() => this.processDevice(device))
                .catch((err) => {
                            console.error("Error processing device:", device["mount-name"], err)
                            logSlidingWindowActivity(`SlidingWindow: Error processing device ${device["mount-name"]}: ${err.message}`);
                            logger.error(`SlidingWindow: Error processing device ${device["mount-name"]}: ${err.message}`);
                        }
                );
        }
    }

    async processDevice(device) {
        let nodeId = device["mount-name"];
        let result = false;

        try {
            /* deviceControlConstructUtility
                .syncControllerCcToEs(nodeId, responseTimeOut, maximumNumberOfRetries).then(async (response) => {
                        let currentTime = new Date().toJSON();

                        device["last-complete-control-construct-update-time-attempt"] = currentTime;
                        device["locked-status"] = false;
                        device["cc-synced"] = true;

                        await deviceMetadataCacheUpdate.setLastCompleteControlConstructUpdateTimeAttempt(nodeId, currentTime);

                        if (response) {
                            device['exclude-from-qm'] = false;
                            await deviceMetadataCacheUpdate.setLastSuccessfulCompleteControlConstructUpdateTime(nodeId, currentTime);
                        }

                        await deviceMetaDataPriorityList.createOrUpdateDevice(device);
                        
                    })
                    .catch((err) => {
                        console.error(`Error processing ${device}`, err)
                        logger.error(`Error processing ${device}: ${err.message}`);
                        logSlidingWindowActivity(`Error processing ${device}: ${err.message}`);
                    }); */
           // logSlidingWindowActivity(`SlidingWindow:Processing started for device ${nodeId}`);
            result = await deviceControlConstructUtility
                .syncControllerCcToEs(nodeId, responseTimeOut, maximumNumberOfRetries)
            let ts = new Date().toJSON();

            device["last-complete-control-construct-update-time-attempt"] = ts;
            device["locked-status"] = false;
            device["cc-synced"] = true;
            //device["exclude-from-qm"] = false;

            
            await deviceMetadataCacheUpdate.setLastCompleteControlConstructUpdateTimeAttempt(nodeId, ts);

            if (result === true) {
                device['exclude-from-qm'] = false;
                await deviceMetadataCacheUpdate.setLastSuccessfulCompleteControlConstructUpdateTime(nodeId, ts);
            }
            await deviceMetaDataPriorityList.createOrUpdateDevice(device);

        } catch (err) {
            console.error("processDevice failed:", nodeId, err);
            logger.error(`processDevice failed for ${nodeId}: ${err.message}`);
            logSlidingWindowActivity(`SlidingWindow: processDevice failed for ${nodeId}: ${err.message}`);
        }
    }

    /**
   * Main scheduler loop.
   * - Never recurses; relies on a periodic timer to resume work.
   * - Spawns up to (slidingWindowSize - active) device tasks.
   */
    async startDeviceSyncProcess() {
        try {
            /**
             * active - number of devices currently under process
             * 
             */
            logSlidingWindowActivity(`SlidingWindow:startDeviceSyncProcess() started: Active slots: ${this.active}/${this.slidingWindowSize}`);
            while (this.active < this.slidingWindowSize && !this.stopped) {
                await sleep(100);

		        const device = await this.getNextDevice();                
                if (!device) {
                    // queue empty → retry later
                    // queue empty → break and let the outer timer re-trigger later
                    // await new Promise((resolve) => setTimeout(resolve, 2000));
                    logSlidingWindowActivity(`SlidingWindow: No more devices to process at the moment. Active slots: ${this.active}/${this.slidingWindowSize}`);
                    endTime = Date.now();
                    logSlidingWindowDuration();
                    break;
                }

                // mark one slot active
                this.active++;

                // locking the device for syncing live CC to ES
                //try {
                    await deviceMetaDataPriorityList.setLockedStatusOfDevice(device["mount-name"], true);
                    //logSlidingWindowActivity(`SlidingWindow: Locked device ${device['mount-name']} for processing. Active slots: ${this.active}/${this.slidingWindowSize}`);

                /* } catch (e) {
                    // If locking fails, free the slot and continue
                    console.error('Failed to lock device', device['mount-name'], e);
                    logger.error(`Failed to lock device ${device['mount-name']}: ${e.message}`);
                    logSlidingWindowActivity(`Failed to lock device ${device['mount-name']}: ${e.message}`);
                    this.active--;
                    continue;
                } */

                // Process device asynchronously but ensure active-- happens
                /* this.processDeviceTest(device).catch((err) => {
                    console.error(`SlidingWindow: unhandled error for ${device['mount-name']}`, err);
                    logger.error(`SlidingWindow: unhandled error for ${device['mount-name']}: ${err.message}`);
                    logSlidingWindowActivity(`SlidingWindow: unhandled error for ${device['mount-name']}: ${err.message}`);
                }); */
                // start syncing live CC to ES
                deviceControlConstructUtility.syncControllerCcToEs(device["mount-name"], responseTimeOut, maximumNumberOfRetries)
                    .then(async (response) => {
                        let currentTime = new Date().toJSON();
                        if (response) {
                            device["last-complete-control-construct-update-time-attempt"] = currentTime;
                            device["locked-status"] = false;
                            device["exclude-from-qm"] = false;
                            device["cc-synced"] = true;
                            await deviceMetaDataPriorityList.createOrUpdateDevice(device);
                            await deviceMetadataCacheUpdate.setLastCompleteControlConstructUpdateTimeAttempt(device["mount-name"], currentTime);
                            await deviceMetadataCacheUpdate.setLastSuccessfulCompleteControlConstructUpdateTime(device["mount-name"], currentTime);

                            // update Metadata in ES for last-cc-successful and attempt
                        } else {
                            device["last-complete-control-construct-update-time-attempt"] = new Date().toJSON();
                            device["locked-status"] = false;
                            device["cc-synced"] = true;
                            await deviceMetadataCacheUpdate.setLastCompleteControlConstructUpdateTimeAttempt(device["mount-name"], currentTime);
                            await deviceMetaDataPriorityList.createOrUpdateDevice(device);
                        }
                    })
                    .catch((err) => console.error(`Error processing ${device}`, err))
                    .finally(() => {
                        this.active--;
                        if (!this.stopped) {
                            this.startDeviceSyncProcess();
                        }
                    });
            }

            logSlidingWindowActivity(`SlidingWindow:startDeviceSyncProcess() ended: Active slots: ${this.active}/${this.slidingWindowSize}`);
            if (!this.stopped) {
                // lightweight periodic tick to keep the loop alive
                setTimeout(() => this.startDeviceSyncProcess(), 2000);
                logSlidingWindowActivity(`SlidingWindow: Scheduled next tick after delay of 2000ms. Active slots: ${this.active}/${this.slidingWindowSize}`);
            }
            // if (!this.stopped) setTimeout(() => this.startDeviceSyncProcess(), 2000);
        } catch (error) {
            console.log(error);
            logger.error(`SlidingWindow: startDeviceSyncProcess error: ${error.message}`);
            logSlidingWindowActivity(`SlidingWindow: startDeviceSyncProcess error: ${error.message}`);
            this.stop();
        }
    }


  /**
   * Ensures active counter is decremented and device unlocked.
   */
  async processDeviceTest(device) {
    try {
      await this.syncDevice(device);
    } catch (err) {
      console.error(`SlidingWindow: processDevice error for ${device['mount-name']}`, err);
      logger.error(`SlidingWindow: processDevice error for ${device['mount-name']}: ${err.message}`);
      logSlidingWindowActivity(`SlidingWindow: processDevice error for ${device['mount-name']}: ${err.message}`);
    } finally {
      try {
        // always unlock the device
        await deviceMetaDataPriorityList.setLockedStatusOfDevice(device['mount-name'], false);
      } catch (e) {
        console.error('Failed to unlock device', device['mount-name'], e);
        logger.error(`Failed to unlock device ${device['mount-name']}: ${e.message}`);
        logSlidingWindowActivity(`Failed to unlock device ${device['mount-name']}: ${e.message}`);
      }
      // free the slot
      this.active = Math.max(0, this.active - 1);
    }
  }

  /**
   * Executes the CC sync and updates metadata/cache.
   */
  async syncDevice(device) {
    const mountName = device['mount-name'];

    let response = false;
    try {
      response = await deviceControlConstructUtility.syncControllerCcToEs(
        mountName,
        responseTimeOut,
        maximumNumberOfRetries
      );
    } catch (err) {
      console.error(`syncControllerCcToEs failed for ${mountName}`, err);
      logSlidingWindowActivity(`SlidingWindow: syncControllerCcToEs failed for ${mountName}: ${err.message}`);
    }

    const currentTime = new Date().toJSON();

    try {
      if (response) {
        //logSlidingWindowActivity(`SlidingWindow: CC sync successful for ${mountName}`);
        // success path
        device['last-complete-control-construct-update-time-attempt'] = currentTime;
        device['locked-status'] = false;
        device['exclude-from-qm'] = false;
        device['cc-synced'] = true;

        await deviceMetaDataPriorityList.createOrUpdateDevice(device);

        await deviceMetadataCacheUpdate.setLastCompleteControlConstructUpdateTimeAttempt(
          mountName,
          currentTime
        );
        await deviceMetadataCacheUpdate.setLastSuccessfulCompleteControlConstructUpdateTime(
          mountName,
          currentTime
        );
        //logSlidingWindowActivity(`SlidingWindow: Metadata/cache updated for ${mountName}`);
      } else {
        logSlidingWindowActivity(`SlidingWindow: CC sync failed for ${mountName}`);
        // failure path: mark attempt, keep cc-synced so the cycle progresses (as per original intent)
        device['last-complete-control-construct-update-time-attempt'] = currentTime;
        device['locked-status'] = false;
        device['cc-synced'] = true;

        await deviceMetadataCacheUpdate.setLastCompleteControlConstructUpdateTimeAttempt(
          mountName,
          currentTime
        );
        await deviceMetaDataPriorityList.createOrUpdateDevice(device);
        logSlidingWindowActivity(`SlidingWindow: Metadata/cache update (failure path) done for ${mountName}`);
      }
    } catch (e) {
      console.error(`Metadata/cache update failed for ${mountName}`, e);
      logger.error(`Metadata/cache update failed for ${mountName}: ${e.message}`);
      logSlidingWindowActivity(`Metadata/cache update failed for ${mountName}: ${e.message}`);
    }
  }

  stop() {
        console.log('Stop requested...');
        logger.info('SlidingWindow: Stop requested');
        logSlidingWindowActivity('SlidingWindow: Stop requested');
        this.stopped = true;
 }

}


/**
 * This function returns next eligible device for syncing CC from live to cache
 */
async function getNextDeviceMetaDataLocal() {
    try {
        let device = await deviceMetaDataPriorityList.getNextDeviceMetaData();
        return device;
    } catch (error) {
        console.log(error);
        logSlidingWindowActivity(`SlidingWindow: getNextDeviceMetaDataLocal error: ${error.message}`);
        return {};
    }
}

/**
 * This function shall be called in order to stop sliding window runner
 */
exports.stopSlidingWindowProcessForCCUpdate = async function () {
    try {
        if (slidingWindowRunner) {
            console.log("*********************** Terminating the existing sliding window process for starting new pocess *************************");
            logSlidingWindowActivity("*********************** Terminating the existing sliding window process for starting new pocess *************************");
            await slidingWindowRunner.stop();
            slidingWindowRunner = undefined;
            //setting cc-syned of all devices to false - to enable fresh retrieval for this cycle.
            await deviceMetaDataPriorityList.resetCCSyncedOfAllDevices();
        }
    } catch (error) {
        console.log(error);
        logSlidingWindowActivity(`SlidingWindow: stopSlidingWindowProcessForCCUpdate error: ${error.message}`);
    }
    return true;
}

/**
 * This function shall be called in order to start sliding window style of retrieval
 */
exports.startSlidingWindowProcessForCCUpdate = async function () {
    try {
        console.log('*******************************************************************************************************');
        console.log('*                             ControlConstruct Update in SLIDING-WINDOW PROCESS PROCEDURE STARTED           *');
        console.log('*                                                                                                     *');
        console.log('*                                 ( ' + utility.getTime() + ' )                                             *');
        console.log('*                                                                                                     *');
        console.log('*******************************************************************************************************');
        logSlidingWindowActivity('*******************************************************************************************************');
        logSlidingWindowActivity('*                             ControlConstruct Update in SLIDING-WINDOW PROCESS PROCEDURE STARTED           *');
        logSlidingWindowActivity('*                                                                                                     *');
        logSlidingWindowActivity('*                                 ( ' + utility.getTime() + ' )                                             *');
        logSlidingWindowActivity('*                                                                                                     *');
        logSlidingWindowActivity('*******************************************************************************************************');
        // Start timer here
        startTime = Date.now();
        
        if (slidingWindowRunner) {
            await exports.stopSlidingWindowProcessForCCUpdate();
        }
        await initializeDependentIntegerValues();

        console.log(`SlidingWindow: Processing ${slidingWindowSize} devices...`);
        logSlidingWindowActivity(`SlidingWindow: Processing ${slidingWindowSize} devices...`);
        

        slidingWindowRunner = new SlidingWindow(getNextDeviceMetaDataLocal);
    } catch (error) {
        console.log(error);
        logSlidingWindowActivity(`SlidingWindow: startSlidingWindowProcessForCCUpdate error: ${error.message}`);
    }
}

// calculates configures values for slidingWindowSize, responseTimeOut and maximumNumberOfRetries
async function initializeDependentIntegerValues() {
    try {
        slidingWindowSize = await integerProfile.getIntegerValueForTheIntegerProfileNameAsync("slidingWindowSize");
        let profileInstance = await utility.getIntegerProfileForIntegerName("responseTimeout");
        let integerValue = profileInstance[onfAttributes.INTEGER_PROFILE.PAC][onfAttributes.INTEGER_PROFILE.CONFIGURATION][onfAttributes.INTEGER_PROFILE.INTEGER_VALUE];
        let unit = profileInstance[onfAttributes.INTEGER_PROFILE.PAC][onfAttributes.INTEGER_PROFILE.CAPABILITY][onfAttributes.INTEGER_PROFILE.UNIT];
        responseTimeOut = await utility.calculateTimeInMilliSeconds(integerValue, unit);
        maximumNumberOfRetries = await integerProfile.getIntegerValueForTheIntegerProfileNameAsync("maximumNumberOfRetries");
    } catch (error) {
        console.log(error);
        logSlidingWindowActivity(`SlidingWindow: initializeDependentIntegerValues error: ${error.message}`);
    }
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function logSlidingWindowDuration() {
    if (startTime && endTime) {
        const durationMs = endTime - startTime;
        logSlidingWindowActivity(
            `*******************************************************************************************************`
        );
        logSlidingWindowActivity(
            `* SlidingWindow cycle completed in ${durationMs} ms (WindowSize=${slidingWindowSize})`
        );
        logSlidingWindowActivity(
            `*******************************************************************************************************`
        );
    }
}

/**
 * Minimal concurrency limiter
 */
function createConcurrencyQueue(limit) {
    let activeCount = 0;
    const queue = [];

    const next = () => {
        if (queue.length > 0 && activeCount < limit) {
            const { fn, resolve, reject } = queue.shift();
            run(fn, resolve, reject);
        }
    };

    const run = (fn, resolve, reject) => {
        activeCount++;
        fn()
            .then(resolve)
            .catch(reject)
            .finally(() => {
                activeCount--;
                next();
            });
    };

    return function enqueue(fn) {
        return new Promise((resolve, reject) => {
            queue.push({ fn, resolve, reject });
            next();
        });
    };
}


