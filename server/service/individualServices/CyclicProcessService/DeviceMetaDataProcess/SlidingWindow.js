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
 * Sliding window style CC sync runner (live --> cache).
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
    let timeWaiting = 0;
    while (!this.stopped) {
      const device = await this.getNextDevice();
      if (!device) {
        if (timeWaiting <= 10000) {
          timeWaiting = timeWaiting + 2000;
        }
        logger.warn(`SlidingWindow: No more devices to process at the moment. Sleeping for ${timeWaiting}`);
        logSlidingWindowActivity(`SlidingWindow: No more devices to process at the moment.`);
        endTime = Date.now();
        logSlidingWindowDuration();
        await sleep(timeWaiting);   // nothing to do --> recheck later
        // Reset start timer here
        startTime = Date.now();
        continue;
      } else {
        timeWaiting = 0;
      }

      // lock device
      deviceMetaDataPriorityList.setLockedStatusOfDevice(device["mount-name"], true);

      // submit job to concurrency queue
      this.enqueue(device["mount-name"], () => this.processDevice(device))
      //this.enqueue(() => this.processDevice(device))
        .catch((err) => {
          // logger.error("Error processing device:", device["mount-name"], err)
          logSlidingWindowActivity(`SlidingWindow: Error processing device ${device["mount-name"]}: ${err.message}`);
          logger.error(`SlidingWindow: Error processing device ${device["mount-name"]}: ${err.message}`);
        });
    }
  }

  async processDevice(device) {
    let nodeId = device["mount-name"];
    let result = false;

    try {
      logger.info(`SlidingWindow: Processing started for device ${nodeId}`);
      logSlidingWindowActivity(`SlidingWindow:Processing started for device ${nodeId}`);
      result = await deviceControlConstructUtility
        .syncControllerCcToEs(nodeId, responseTimeOut, maximumNumberOfRetries);

      // @latta-techm check if result is ok or not. Log misleading message if result is false. Result is false if CC sync failed for given nodeId.
      if (result === true) {
        logger.info(`SlidingWindow: ${nodeId} written into ElasticSearch`);
      } else {
        logger.error(`SlidingWindow: ${nodeId} failed to write into ElasticSearch`);
      }

      let ts = new Date().toJSON();

      device["last-complete-control-construct-update-time-attempt"] = ts;
      device["locked-status"] = false;
      device["cc-synced"] = true;

      //send attempt time + (optional) success time in ONE call
      deviceMetadataCacheUpdate.updateCcSyncTimes(
        nodeId,
        ts,
        result === true ? ts : null
      );

      if (result === true) {
        device['exclude-from-qm'] = false;
      }

      await deviceMetaDataPriorityList.createOrUpdateDevice(device);
    } catch (err) {
      // console.error("processDevice failed:", nodeId, err);
      logger.error(`SlidingWindow: processDevice failed for ${nodeId}: ${err.message}`);
      logSlidingWindowActivity(`SlidingWindow: processDevice failed for ${nodeId}: ${err.message}`);
    }
  }

  stop() {
    // console.log('Stop requested...');
    logger.info('SlidingWindow: Stop requested');
    logSlidingWindowActivity('SlidingWindow: Stop requested');
    this.stopped = true;
  }

  unqueue(mountName) {
    return this.enqueue.cancel(mountName);
  }
}


/**
 * This function returns next eligible device for syncing CC from live to cache
 */
async function getNextDeviceMetaDataLocal() {
  try {
    // Fetch data from metadata
    let device = await deviceMetaDataPriorityList.getNextDeviceMetaData();
    return device;
  } catch (error) {
    logger.error(error);
    logSlidingWindowActivity(`SlidingWindow: getNextDeviceMetaDataLocal error: ${error.message}`);
    return {};
  }
}

exports.removeMountNameFromSlidingWindow = async function (mountName) {

 try {
    if (slidingWindowRunner) {
      await slidingWindowRunner.unqueue(mountName);
    }
  } catch (error) {
    logger.error(error);
    logSlidingWindowActivity(`SlidingWindow: remove Mountname error: ${error.message}`);
  }

  return true;
}


/**
 * This function shall be called in order to stop sliding window runner
 */
exports.stopSlidingWindowProcessForCCUpdate = async function () {
  try {
    if (slidingWindowRunner) {
      logger.info("Sliding Window: Terminating the existing sliding window process for starting new pocess");
      logSlidingWindowActivity("*********************** Terminating the existing sliding window process for starting new pocess *************************");
      await slidingWindowRunner.stop();
      slidingWindowRunner = undefined;
      //setting cc-syned of all devices to false - to enable fresh retrieval for this cycle.
      await deviceMetaDataPriorityList.resetCCSyncedOfAllDevices();
    }
  } catch (error) {
    logger.error(error);
    logSlidingWindowActivity(`SlidingWindow: stopSlidingWindowProcessForCCUpdate error: ${error.message}`);
  }

  return true;
}

/**
 * This function shall be called in order to start sliding window style of retrieval
 */
exports.startSlidingWindowProcessForCCUpdate = async function () {
  try {
    logger.info(`ControlConstruct Update in SLIDING-WINDOW PROCESS PROCEDURE STARTED AT: ${utility.getTime()}`);
    logSlidingWindowActivity('*******************************************************************************************************');
    logSlidingWindowActivity('*                             ControlConstruct Update in SLIDING-WINDOW PROCESS PROCEDURE STARTED           *');
    logSlidingWindowActivity('*                                                                                                     *');
    logSlidingWindowActivity('*                                 ( ' + utility.getTime() + ' )                                             *');
    logSlidingWindowActivity('*                                                                                                     *');
    logSlidingWindowActivity('*******************************************************************************************************');
    // Start timer here
    startTime = Date.now();

    if (slidingWindowRunner) { // if sliding window is already run
      await exports.stopSlidingWindowProcessForCCUpdate(); // Stop the process
    }
    await initializeDependentIntegerValues();

    logger.info(`SlidingWindow: Processing ${slidingWindowSize} devices...`);
    logSlidingWindowActivity(`SlidingWindow: Processing ${slidingWindowSize} devices...`);

    slidingWindowRunner = new SlidingWindow(getNextDeviceMetaDataLocal); // Add devices to sliding window process
  } catch (error) {
    logger.error(error);
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
    logger.error(error);
    // logSlidingWindowActivity(`SlidingWindow: initializeDependentIntegerValues error: ${error.message}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logSlidingWindowDuration() {
  if (startTime && endTime) {
    const durationMs = endTime - startTime;
    logger.warn(`SlidingWindow cycle completed in ${durationMs} ms (WindowSize=${slidingWindowSize})`);
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
function createConcurrencyQueueOld(limit) {
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


/**
 * Concurrency queue with cancellation of pending requests.
 *
 * Each key can have only one pending or running request.
 * Cancelling a running request returns false.
 */
function createConcurrencyQueue(limit) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError("Concurrency limit must be a positive integer");
  }

  const pending = new Map();
  const running = new Map();
//  const running = new Set();

  function drain() {
    while (running.size < limit && pending.size > 0) {
      // Map preserves insertion order: FIFO.
      const [key, job] = pending.entries().next().value;

      pending.delete(key);
      running.add(key);

      // Handles synchronous exceptions, values and Promises.
      Promise.resolve()
        .then(job.fn)
        .then(
          result => finish(key, job.resolve, result),
          error => finish(key, job.reject, error)
        );
    }
  }

  function finish(key, settle, value) {
    running.delete(key);
    settle(value);
    drain();
  }

  function enqueue(key, fn) {
    if (typeof fn !== "function") {
      return Promise.reject(new TypeError("Task must be a function"));
    }

    if (pending.has(key) || running.has(key)) {
      return Promise.reject(
        new Error(`Request already queued or running: ${key}`)
      );
    }

    return new Promise((resolve, reject) => {
      pending.set(key, { fn, resolve, reject });
      drain();
    });
  }

  enqueue.cancel = function cancel(key) {
    const jobPending = pending.get(key);
    const jobRunning = running.get(key);

    if (!jobPending && !jobRunning) {
      return false; // Already running, completed, or unknown.
    }

    let job;
    if (jobPending) {
      job = jobPending;
      pending.delete(key);
    } else {  // is the job running
      job = jobRunning;
      running.delete(key);
    }

    const error = new Error(`Queued request cancelled: ${key}`);
    error.name = "QueueCancellationError";

    job.reject(error);
    return true;
  };

  return enqueue;
}
