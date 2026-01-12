'use strict';

const utility = require('../../utility');
const integerProfile = require('onf-core-model-ap/applicationPattern/onfModel/models/profile/IntegerProfile');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const deviceControlConstructUtility = require('./deviceControlConstructUtility');
const deviceMetaDataPriorityList = require('./DeviceMetaDataPriorityList');
const deviceMetadataCacheUpdate = require('./DeviceMetaDataCacheUpdate');
const logger = require('./../../../LoggingService.js').getLogger();
const { logSlidingWindowActivity } = require('./../../../../utils/alarmLogTracker.js');

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
        logSlidingWindowActivity(`SlidingWindow: Response timeout set to ${responseTimeOut} ms.`);
        logSlidingWindowActivity(`SlidingWindow: Maximum retries ${maximumNumberOfRetries} for each device.`);

        /**
         * Declare + initialize queue limiter
         * Ensures at most `slidingWindowSize` parallel executions
         */
        this.enqueue = createConcurrencyQueue(slidingWindowSize);

        // starts the sliding window
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
                // Reset start timer here
                startTime = Date.now();
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
            
            logSlidingWindowActivity(`SlidingWindow:Processing started for device ${nodeId}`);
            result = await deviceControlConstructUtility
                .syncControllerCcToEs(nodeId, responseTimeOut, maximumNumberOfRetries)
            let ts = new Date().toJSON();

            device["last-complete-control-construct-update-time-attempt"] = ts;
            device["locked-status"] = false;
            device["cc-synced"] = true;

            //send attempt time + (optional) success time in ONE call
            await deviceMetadataCacheUpdate.updateCcSyncTimes(
                nodeId,
                ts,
                result === true ? ts : null
            );

            if (result === true) {
                device['exclude-from-qm'] = false;
            }

            await deviceMetaDataPriorityList.createOrUpdateDevice(device);

        } catch (err) {
            console.error("processDevice failed:", nodeId, err);
            logger.error(`processDevice failed for ${nodeId}: ${err.message}`);
            logSlidingWindowActivity(`SlidingWindow: processDevice failed for ${nodeId}: ${err.message}`);
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


