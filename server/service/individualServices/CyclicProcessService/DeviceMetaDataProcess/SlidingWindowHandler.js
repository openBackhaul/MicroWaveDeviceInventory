'use strict';

const path = require('path');
const { Worker } = require('worker_threads');
const deviceMetadataCacheUpdate = require('./DeviceMetaDataCacheUpdate');
const logger = require('./../../../LoggingService.js').getLogger();
const { logSlidingWindowActivity } = require('./../../../../utils/alarmLogTracker.js');

let worker = null;
let nextRequestId = 1;
const pendingRequests = new Map();

// Restart control
let restartAttempts = 0;
let restartTimer = null;
let restarting = false;

// Desired state: should SlidingWindow run?
let shouldRunSlidingWindow = false;

/**
 * Creates the worker if not already created.
 */
function ensureWorker(forceRecreate = false) {
  if (worker && !forceRecreate) return worker;

  // If force recreate, terminate old worker safely
  if (worker && forceRecreate) {
    try { worker.terminate(); } catch (e) { /* ignore */ }
    worker = null;
  }

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
            // One message contains both attempt and sucess times
            if (msg.attemptTime !== undefined || msg.successTime !== undefined) {
              const { nodeId, attemptTime, successTime } = msg;

              //logSlidingWindowActivity(`[SlidingWindowHandler] Device Metadata Cache Update for nodeId: ${nodeId} with last-complete-control-construct-update-time-attempt: ${attemptTime}.`);
              //logSlidingWindowActivity(`[SlidingWindowHandler] Device Metadata Cache Update for nodeId: ${nodeId} with last-successful-complete-control-construct-update-time: ${successTime}.`);
              
              // Use the new combined method (main thread applies updates)
              deviceMetadataCacheUpdate.updateCcSyncTimes(
                nodeId,
                attemptTime,
                successTime
              );
              
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

    if (msg.type === 'remove-device-metadata-response') {
      const { requestId, result } = msg;
      const pending = pendingRequests.get(requestId);
      if (pending) {
        pending.resolve(!!result);
        pendingRequests.delete(requestId);
      }
      return;
    }
  });

  worker.on('error', (err) => {
    logger.error('[SlidingWindowHandler] Worker Error Event:', err);
    logSlidingWindowActivity(`[SlidingWindowHandler] Worker Error Event: ${err}`);

    // clear pending requests to avoid hangs
    failAllPendingRequests(`error:${err && err.message ? err.message : err}`);

    // ensure we recreate if it dies or becomes unhealthy
    worker = null;
    scheduleRestart('error-event');
  });

  worker.on('exit', (code) => {
    logger.warn('[SlidingWindowHandler] Worker exited with code:', code);
    logSlidingWindowActivity(`[SlidingWindowHandler] Worker exited with code: ${code}`);

    // clear pending requests to avoid hangs
    failAllPendingRequests(`exit:${code}`);

    worker = null;

    // Exit code 0 usually means normal termination (like terminate())
    if (code !== 0) {
      scheduleRestart(`exit:${code}`);
    } else {
      // normal exit: reset backoff
      restartAttempts = 0;
    }
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
  shouldRunSlidingWindow = true;
  const workerThread = ensureWorker();
  logger.info('[SlidingWindowHandler] Sending start-sliding-window to worker...');
  logSlidingWindowActivity('[SlidingWindowHandler] Sending start-sliding-window to worker...');
  workerThread.postMessage({ type: 'start-sliding-window' });
}

/**
 * Stop SlidingWindow inside worker
 */
function stopSlidingWindowProcessForCCUpdate() {
  shouldRunSlidingWindow = false;
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
  const requestId = nextRequestId++;

  return new Promise((resolve) => {
    pendingRequests.set(requestId, { resolve });

    workerThread.postMessage({
      type: 'remove-device-metadata',
      requestId,
      mountName
    });

    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        resolve(false);
      }
    }, 5000);
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
 * Reject/resolve any pending requests when worker dies,
 * otherwise Promises may hang + memory will leak.
 */
function failAllPendingRequests(reason) {
  for (const [requestId, pending] of pendingRequests.entries()) {
    try {
      // You can either resolve(null) or reject(). Resolve(null) is safer for callers.
      pending.resolve(null);
    } catch (e) { /* ignore */ }
    pendingRequests.delete(requestId);
  }
  logger.warn(`[SlidingWindowHandler] Cleared pending requests due to worker termination: ${reason}`);
  logSlidingWindowActivity(`[SlidingWindowHandler] Cleared pending requests due to worker termination: ${reason}`);
}

/**
 * Schedule worker restart with exponential backoff.
 * If SlidingWindow is supposed to run, it will auto-start after restart.
 */
function scheduleRestart(reason) {
  if (restarting) return;
  restarting = true;

  // 1s, 2s, 4s, 8s, ... max 30s
  const delay = Math.min(30000, 1000 * (2 ** restartAttempts));
  restartAttempts++;

  logger.warn(`[SlidingWindowHandler] Scheduling worker restart in ${delay} ms (reason=${reason}, attempt=${restartAttempts})`);
  logSlidingWindowActivity(`[SlidingWindowHandler] Scheduling worker restart in ${delay} ms (reason=${reason}, attempt=${restartAttempts})`);

  if (restartTimer) clearTimeout(restartTimer);

  restartTimer = setTimeout(() => {
    restartTimer = null;
    restarting = false;

    // Create fresh worker
    ensureWorker(true);

    // Auto-start SlidingWindow if main thread wants it running
    if (shouldRunSlidingWindow && worker) {
      logger.info('[SlidingWindowHandler] Auto-starting SlidingWindow after worker restart.');
      logSlidingWindowActivity('[SlidingWindowHandler] Auto-starting SlidingWindow after worker restart.');
      worker.postMessage({ type: 'start-sliding-window' });
    }
  }, delay);
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
