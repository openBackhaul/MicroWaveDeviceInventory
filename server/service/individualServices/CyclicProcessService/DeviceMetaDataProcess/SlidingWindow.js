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

    logSlidingWindowActivity(`[SLIDING_WINDOW] - is stopped ? ${this.stopped}`);
    logSlidingWindowActivity(`[SLIDING_WINDOW] - Response timeout set to ${responseTimeOut} ms.`);
    logSlidingWindowActivity(`[SLIDING_WINDOW] - Maximum retries ${maximumNumberOfRetries} for each device.`);

    /**
     * Declare + initialize queue limiter
     * Ensures at most `slidingWindowSize` parallel executions
     */
    /*this.enqueue = createConcurrencyQueue(slidingWindowSize);*/
    this.tryRun = createConcurrencyLimiter(slidingWindowSize);

    // starts the sliding window
    this.startQueue();
  }

  async startQueue() {
    let timeWaiting = 0;
    while (!this.stopped) {
      const device = await this.getNextDevice();

      if (!device) {
        if (timeWaiting <= 8000) {
          timeWaiting = timeWaiting + 2000;
        }
        logger.warn(`[SLIDING_WINDOW] - No more devices to process at the moment. Sleeping for ${timeWaiting}`);
        logSlidingWindowActivity(`[SLIDING_WINDOW] - No more devices to process at the moment.`);
        endTime = Date.now();
        logSlidingWindowDuration();
        await sleep(timeWaiting);   // nothing to do --> recheck later
        // Reset start timer here
        startTime = Date.now();
        continue;
      } else {
        timeWaiting = 0;
      }

      if (this.tryRun.availableSlots() === 0) {
        await sleep(2000);
        continue;
      }

      const mountName = device["mount-name"];

      if (this.tryRun.isRunning(mountName)) {
        await sleep(2000);
        continue;
      }

      // Apply your existing eligibility checks here.
      // logger.warn(`[SLIDING_WINDOW] - Locking device ${device["mount-name"]} for processing.`);
      deviceMetaDataPriorityList.setLockedStatusOfDevice(device["mount-name"], true);

      //logger.info(`[SLIDING_WINDOW] - Submitting device ${device["mount-name"]} for processing.`);
      const task = this.tryRun(
        mountName,
        signal => this.processDevice(device, signal)
      );

      if (task !== null) {
        task.catch(error => {
          if (error.name !== "AbortError") {
            logger.error(error);
          }
        });
      }
      /*
      const { pendingCount, runningCount, totalCount } = this.getQueueStatus();

      if (totalCount >= slidingWindowSize) {
        logger.warn(`[SLIDING_WINDOW] - Queue is full. Waiting for a slot to process device ${device["mount-name"]}`);
        logSlidingWindowActivity(`[SLIDING_WINDOW] - Queue is full. Waiting for a slot to process device ${device["mount-name"]}`);
        await sleep(timeWaiting);
        continue;
      }

      // lock device
      logger.warn(`[SLIDING_WINDOW] - Locking device ${device["mount-name"]} for processing.`);
      deviceMetaDataPriorityList.setLockedStatusOfDevice(device["mount-name"], true);

      // submit job to concurrency queue
      logger.info(`[SLIDING_WINDOW] - Submitting device ${device["mount-name"]} for processing.`);
      this.enqueue(device["mount-name"], signal => this.processDevice(device, signal))
        .catch(error => {
          if (error.name === "AbortError") {
            return;
          }
          logger.error(error);
        });

      // this.enqueue(device["mount-name"], () => this.processDevice(device))
      //// this.enqueue(() => this.processDevice(device))
      //  .catch((err) => {
      //    // logger.error("Error processing device:", device["mount-name"], err)
      //    logSlidingWindowActivity(`SlidingWindow: Error processing device ${device["mount-name"]}: ${err.message}`);
      //    logger.error(`SlidingWindow: Error processing device ${device["mount-name"]}: ${err.message}`);
      //  });
      */
    }
  }

  async processDevice(device, signal) {
    const nodeId = device["mount-name"];
    let result = false;

    try {
      signal.throwIfAborted();

      logger.info(`[SLIDING_WINDOW] - Processing started for device ${nodeId}`);
      logSlidingWindowActivity(`[SLIDING_WINDOW] - Processing started for device ${nodeId}`);
      result = await deviceControlConstructUtility.syncControllerCcToEs(
        nodeId, responseTimeOut, maximumNumberOfRetries, signal);

      signal.throwIfAborted();

      if (result === true) {
        logger.info(`[SLIDING_WINDOW] - ${nodeId} written into ElasticSearch`);
      } else {
        logger.error(`[SLIDING_WINDOW] - ${nodeId} failed to write into ElasticSearch`);
      }

      const timeStamp = new Date().toJSON();

      device["last-complete-control-construct-update-time-attempt"] = timeStamp;
      device["locked-status"] = false;
      device["cc-synced"] = result === true;

      //send attempt time + (optional) success time in ONE call
      deviceMetadataCacheUpdate.updateCcSyncTimes(
        nodeId,
        timeStamp,
        result === true ? timeStamp : null
      );

      if (result === true) {
        device['exclude-from-qm'] = false;
      }
      signal.throwIfAborted();

      await deviceMetaDataPriorityList.createOrUpdateDevice(device);

      signal.throwIfAborted();
    } catch (err) {
      if (signal.aborted) {
        logger.info(`[SLIDING_WINDOW] - Processing cancelled for device ${nodeId}`);
        deviceMetaDataPriorityList.setLockedStatusOfDevice(device["mount-name"], false);
        throw signal.reason;
      }
      logger.error(`[SLIDING_WINDOW] - processDevice failed for ${nodeId}: ${err.message}`);
      logSlidingWindowActivity(`[SLIDING_WINDOW] - processDevice failed for ${nodeId}: ${err.message}`);
    }
  }

  stop() {
    // console.log('Stop requested...');
    logger.info('[SLIDING_WINDOW] - Stop requested');
    logSlidingWindowActivity('[SLIDING_WINDOW] - Stop requested');
    this.stopped = true;
  }

  unqueue(mountName) {
    // return this.enqueue.cancel(mountName);
    return this.tryRun.cancel(mountName);
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
    logSlidingWindowActivity(`[SLIDING_WINDOW] - getNextDeviceMetaDataLocal error: ${error.message}`);
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
      logger.info("[SLIDING_WINDOW] - Terminating the existing sliding window process for starting new pocess");
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

    logger.info(`[SLIDING_WINDOW] - Processing ${slidingWindowSize} devices...`);
    logSlidingWindowActivity(`[SLIDING_WINDOW] - Processing ${slidingWindowSize} devices...`);

    slidingWindowRunner = new SlidingWindow(getNextDeviceMetaDataLocal); // Add devices to sliding window process
  } catch (error) {
    logger.error(error);
    logSlidingWindowActivity(`[SLIDING_WINDOW] - startSlidingWindowProcessForCCUpdate error: ${error.message}`);
  }
}

// calculates configures values for slidingWindowSize, responseTimeOut and maximumNumberOfRetries
async function initializeDependentIntegerValues() {
  try {
    //TODO @latta-techm check if the below values are being used anywhere else in the code. If not, remove them from here and use them directly in the SlidingWindow class.
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
    logger.warn(`[SLIDING_WINDOW] - cycle completed in ${durationMs} ms (WindowSize=${slidingWindowSize})`);
    logSlidingWindowActivity(
      `*******************************************************************************************************`
    );
    logSlidingWindowActivity(
      `* [SLIDING_WINDOW] - cycle completed in ${durationMs} ms (WindowSize=${slidingWindowSize})`
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
function createConcurrencyLimiter(limit) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError("Concurrency limit must be a positive integer");
  }

  const running = new Map();

  function tryRun(key, fn) {
    if (typeof fn !== "function") {
      throw new TypeError("Task must be a function");
    }

    // No waiting queue; duplicate devices are also skipped.
    if (running.size >= limit || running.has(key)) {
      return null;
    }

    const controller = new AbortController();
    running.set(key, controller);

    return Promise.resolve()
      .then(() => {
        controller.signal.throwIfAborted();
        return fn(controller.signal);
      })
      .then(
        result => {
          controller.signal.throwIfAborted();
          return result;
        },
        error => {
          if (controller.signal.aborted) {
            throw controller.signal.reason;
          }

          throw error;
        }
      )
      .finally(() => {
        running.delete(key);
      });
  }

  tryRun.cancel = function cancel(key) {
    const controller = running.get(key);

    if (!controller || controller.signal.aborted) {
      return false;
    }

    const error = new Error(`Request cancelled: ${key}`);
    error.name = "AbortError";

    controller.abort(error);
    running.delete(key);
    return true;
  };

  tryRun.isRunning = key => running.has(key);
  tryRun.availableSlots = () => limit - running.size;

  return tryRun;
}

function createConcurrencyQueue(limit) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError("Concurrency limit must be a positive integer");
  }

  const pending = new Map();
  const running = new Map();

  function cancellationError(key) {
    const error = new Error(`Request cancelled: ${key}`);
    error.name = "AbortError";
    return error;
  }

  function drain() {
    while (running.size < limit && pending.size > 0) {
      const [key, job] = pending.entries().next().value;

      pending.delete(key);
      running.set(key, job);

      Promise.resolve()
        .then(() => {
          job.controller.signal.throwIfAborted();
          return job.fn(job.controller.signal);
        })
        .then(
          result => finish(key, job, true, result),
          error => finish(key, job, false, error)
        );
    }
  }

  function finish(key, job, succeeded, value) {
    running.delete(key);

    if (job.controller.signal.aborted) {
      job.reject(job.controller.signal.reason);
    } else if (succeeded) {
      job.resolve(value);
    } else {
      job.reject(value);
    }

    drain();
  }

  function enqueue(key, fn) {
    if (typeof fn !== "function") {
      return Promise.reject(new TypeError("[SLIDING_WINDOW] - Task must be a function"));
    }

    if (pending.has(key) || running.has(key)) {
      return Promise.reject(
        new Error(`[SLIDING_WINDOW] - Request already queued or running: ${key}`)
      );
    }

    return new Promise((resolve, reject) => {
      pending.set(key, {
        fn,
        resolve,
        reject,
        controller: new AbortController()
      });

      drain();
    });
  }

  enqueue.cancel = function cancel(key) {
    const pendingJob = pending.get(key);

    if (pendingJob) {
      pending.delete(key);
      pendingJob.controller.abort(cancellationError(key));
      pendingJob.reject(pendingJob.controller.signal.reason);
      return true;
    }

    const runningJob = running.get(key);

    if (!runningJob || runningJob.controller.signal.aborted) {
      return false;
    }

    runningJob.controller.abort(cancellationError(key));
    return true;
  };

  return enqueue;
}
