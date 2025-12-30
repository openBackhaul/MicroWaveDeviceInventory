'use strict';

const path = require('path');
const { Worker } = require('worker_threads');
const deviceMetadataCacheUpdate = require('./DeviceMetaDataCacheUpdate');
const logger = require('./../../../LoggingService.js').getLogger();
const { logSlidingWindowActivity } = require('./../../../../utils/alarmLogTracker.js');

let worker = null;
let nextRequestId = 1;
const pendingRequests = new Map();

/**
 * Creates the worker if not already created.
 */
function ensureWorker() {
  if (worker) return worker;

  const workerPath = path.join(
    __dirname,
    'SlidingWindowWorker.js'
  );

  worker = new Worker(workerPath);

  worker.on('message', (msg) => {
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'started') {
      logger.info('[SlidingWindowHandler] SlidingWindow worker started.');
      logSlidingWindowActivity('[SlidingWindowHandler] SlidingWindow worker started.');
    }

    if (msg.type === 'stopped') {
      logger.info('[SlidingWindowHandler] SlidingWindow worker stopped.');
      logSlidingWindowActivity('[SlidingWindowHandler] SlidingWindow worker stopped.');
    }

    if (msg.type === 'error') {
      logger.error('[SlidingWindowHandler] Worker error:', msg.error);
      logSlidingWindowActivity(`[SlidingWindowHandler] Worker error: ${msg.error}`);
    }

    // handle cache updates coming from sliding window worker
    if (msg.type === 'cache-update') {
        try {
            const { subType, nodeId, newTime } = msg;
            if (subType === 'last-complete-attempt') {
                deviceMetadataCacheUpdate.setLastCompleteControlConstructUpdateTimeAttempt(nodeId, newTime);
                //logSlidingWindowActivity(`[SlidingWindowHandler] Device Metadata Cache Update for nodeId: ${nodeId} with last-complete-control-construct-update-time-attempt: ${newTime}.`);
            } else if (subType === 'last-successful-complete') {
                deviceMetadataCacheUpdate.setLastSuccessfulCompleteControlConstructUpdateTime(nodeId, newTime);
                //logSlidingWindowActivity(`[SlidingWindowHandler] Device Metadata Cache Update for nodeId: ${nodeId} with last-successful-complete-control-construct-update-time: ${newTime}.`);
            }
        } catch (err) {
            logger.error('[SlidingWindowHandler] Error applying cache-update:', err);
            logSlidingWindowActivity(`[SlidingWindowHandler] Error applying cache-update: ${err}`);
        }
    }

    if (msg.type === 'qm-next-device-response') {
      const { requestId, payload } = msg;
      const pending = pendingRequests.get(requestId);
      if (pending) {
        pending.resolve(payload || null);
        pendingRequests.delete(requestId);
      }
    }

    if (msg.type === 'all-device-metadata-response') {
      const { requestId, payload } = msg;
      const pending = pendingRequests.get(requestId);
      if (pending) {
        pending.resolve(payload || null);
        pendingRequests.delete(requestId);
      }
    }
  });

  worker.on('error', (err) => {
    logger.error('[SlidingWindowHandler] Worker Error Event:', err);
    logSlidingWindowActivity(`[SlidingWindowHandler] Worker Error Event: ${err}`);
  });

  worker.on('exit', (code) => {
    logger.warn('[SlidingWindowHandler] Worker exited with code:', code);
    logSlidingWindowActivity(`[SlidingWindowHandler] Worker exited with code: ${code}`);
    worker = null;
  });

  return worker;
}

/** *********************************************************************
 *  PUBLIC METHODS CALLED BY MAIN THREAD
 ********************************************************************* */

/**
 * Start SlidingWindow inside worker
 */
function startSlidingWindowProcessForCCUpdate() {
  const workerThread = ensureWorker();
  logger.info('[SlidingWindowHandler] Sending start-sliding-window to worker...');
  logSlidingWindowActivity('[SlidingWindowHandler] Sending start-sliding-window to worker...');
  workerThread.postMessage({ type: 'start-sliding-window' });
}

/**
 * Stop SlidingWindow inside worker
 */
function stopSlidingWindowProcessForCCUpdate() {
  const workerThread = ensureWorker();
  logger.info('[SlidingWindowHandler] Sending stop-sliding-window to worker...');
  logSlidingWindowActivity('[SlidingWindowHandler] Sending stop-sliding-window to worker...');
  workerThread.postMessage({ type: 'stop-sliding-window' });
}

/**
 * 1. createOrUpdateDevice
 */
function createOrUpdateDevice(deviceMetadata) {
  const workerThread = ensureWorker();
  workerThread.postMessage({
    type: 'create-or-update-device',
    payload: deviceMetadata
  });
}

/**
 * 2. getNextDeviceMetaDataForQm (async)
 */
function getNextDeviceMetaDataForQm() {
  const workerThread = ensureWorker();
  const requestId = nextRequestId++;

  return new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject });

    workerThread.postMessage({
      type: 'get-next-device-qm',
      requestId
    });

    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        resolve(null);
      }
    }, 5000);
  });
}

/**
 * 3. setExcludeFromQmOfDevice
 */
function setExcludeFromQmOfDevice(mountName, value) {
  const workerThread = ensureWorker();
  workerThread.postMessage({
    type: 'set-exclude-from-qm',
    payload: { mountName, value }
  });
}

/**
 * 4. removeMetaDataOfDevice
 */
function removeMetaDataOfDevice(mountName) {
  const workerThread = ensureWorker();
  workerThread.postMessage({
    type: 'remove-device-metadata',
    mountName
  });
}

/**
 * 5. getAllDeviceMetaData (async)
 */
function getAllDeviceMetaData() {
  const workerThread = ensureWorker();
  const requestId = nextRequestId++;

  return new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject });

    workerThread.postMessage({
      type: 'get-all-device-metadata',
      requestId
    });

    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        resolve(null);
      }
    }, 5000);
  });
}

/**
 * Export all public API methods
 */
module.exports = {
  startSlidingWindowProcessForCCUpdate,
  stopSlidingWindowProcessForCCUpdate,
  createOrUpdateDevice,
  getNextDeviceMetaDataForQm,
  setExcludeFromQmOfDevice,
  removeMetaDataOfDevice,
  getAllDeviceMetaData
};
