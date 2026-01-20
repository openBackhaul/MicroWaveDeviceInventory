'use strict';

const { parentPort } = require('worker_threads');

const slidingWindow = require('./SlidingWindow');
const deviceMetaDataPriorityList = require('./DeviceMetaDataPriorityList');
const logger = require('./../../../LoggingService.js').getLogger();
const { logSlidingWindowActivity } = require('./../../../../utils/alarmLogTracker.js');
const individualServices = require("../../../IndividualServicesService");
const notificationManagement = require('../../NotificationManagement');
const prepareElasticsearch = require('../../ElasticsearchPreparation');

let slidingWindowStarted = false;

// workerData contains global info passed from main thread
(async () => {  
  try {    
      //Initialize globals for worker thread
      global.applicationDataPath = './application-data/';
      global.databasePath = './database/config.json';
      global.common = await individualServices.resolveApplicationNameAndHttpClientLtpUuidFromForwardingName();
      global.notify = await individualServices.NotifiedDeviceAlarmCausesUpdatingTheEntryInCurrentAlarmListOfCache();
      global.proxy = await notificationManagement.getAppInformation();
      await prepareElasticsearch(false);
  } catch (err) {
      console.log(err)
      parentPort.postMessage({ error: err.message });
  }
})();

// Handle messages from main thread
parentPort.on('message', (msg) => {
  if (!msg) return;

  
  // 0. Start SlidingWindow when requested by main thread
  if (msg === 'start-sliding-window' || msg.type === 'start-sliding-window') {
    if (slidingWindowStarted) {
      logger.info('[SlidingWindowWorker] start-sliding-window ignored (already started)');
      logSlidingWindowActivity('[SlidingWindowWorker] start-sliding-window ignored (already started)');
      return;
    }

    (async () => {
      try {
        await slidingWindow.startSlidingWindowProcessForCCUpdate();
        slidingWindowStarted = true;
        parentPort.postMessage({ type: 'started' });
        logger.info('[SlidingWindowWorker] Sliding window started by request');
        logSlidingWindowActivity('[SlidingWindowWorker] Sliding window started by request');
      } catch (err) {
        logger.error('[SlidingWindowWorker] Error starting sliding window:', err);
        logSlidingWindowActivity('[SlidingWindowWorker] Error starting sliding window:'+err);
        parentPort.postMessage({ type: 'error', error: err.message });
      }
    })();

    return;
  }

  // 1. Stop request
  if (msg === 'stop-sliding-window' || msg.type === 'stop-sliding-window') {
    (async () => {
      try {
        if (slidingWindowStarted) {
          await slidingWindow.stopSlidingWindowProcessForCCUpdate();
          slidingWindowStarted = false;
        }
      } catch (err) {
        logger.error('[SlidingWindowWorker] Error stopping sliding window:', err);
        logSlidingWindowActivity('[SlidingWindowWorker] Error stopping sliding window:'+err);
      }
      parentPort.postMessage({ type: 'stopped' });
      logger.info('[SlidingWindowWorker] Sliding window stopped by request');
      logSlidingWindowActivity('[SlidingWindowWorker] Sliding window stopped by request')
    })();
    return;
  }

  // 2. createOrUpdateDevice
  if (msg.type === 'create-or-update-device') {
    try {
      deviceMetaDataPriorityList.createOrUpdateDevice(msg.payload);
      const mountName = msg.payload && msg.payload['mount-name'];
      /* if (mountName) {
        logSlidingWindowActivity(`[SlidingWindowWorker] createOrUpdateDevice: ${mountName}`);
        logger.info(`[SlidingWindowWorker] createOrUpdateDevice: ${mountName}`);
      } */
    } catch (err) {
      logger.error('[SlidingWindowWorker] Error in createOrUpdateDevice:', err);
      logSlidingWindowActivity('[SlidingWindowWorker] Error in createOrUpdateDevice:'+err);
    }
    return;
  }

  // 3. getNextDeviceMetaDataForQm
  if (msg.type === 'get-next-device-qm') {
    try {
      const device = deviceMetaDataPriorityList.getNextDeviceMetaDataForQm();
      parentPort.postMessage({
        type: 'qm-next-device-response',
        requestId: msg.requestId,
        payload: device || null
      });
    } catch (err) {
      logger.error('[SlidingWindowWorker] Error in getNextDeviceMetaDataForQm:', err);
      logSlidingWindowActivity('[SlidingWindowWorker] Error in getNextDeviceMetaDataForQm:'+err);
      parentPort.postMessage({
        type: 'qm-next-device-response',
        requestId: msg.requestId,
        payload: null
      });
    }
    return;
  }

  // 4. setExcludeFromQmOfDevice
  if (msg.type === 'set-exclude-from-qm') {
    try {
      const { mountName, value } = msg.payload || {};
      if (mountName !== undefined) {
        deviceMetaDataPriorityList.setExcludeFromQmOfDevice(mountName, value);
        logSlidingWindowActivity(
          `[SlidingWindowWorker] setExcludeFromQmOfDevice: ${mountName} -> ${value}`
        );
        logger.info(`[SlidingWindowWorker] setExcludeFromQmOfDevice: ${mountName} -> ${value}`);
      }
    } catch (err) {
      logger.error('[SlidingWindowWorker] Error in setExcludeFromQmOfDevice:', err);
      logSlidingWindowActivity('[SlidingWindowWorker] Error in setExcludeFromQmOfDevice:'+err);
    }
    return;
  }

  // 5. removeMetaDataOfDevice
  if (msg.type === 'remove-device-metadata') {
    try {
      deviceMetaDataPriorityList.removeMetaDataOfDevice(msg.mountName);
      logSlidingWindowActivity(`[SlidingWindowWorker] removeMetaDataOfDevice: ${msg.mountName}`);
      logger.info(`[SlidingWindowWorker] removeMetaDataOfDevice: ${msg.mountName}`);
    } catch (err) {
      logger.error('[SlidingWindowWorker] Error in removeMetaDataOfDevice:', err);
      logSlidingWindowActivity('[SlidingWindowWorker] Error in removeMetaDataOfDevice:'+err);
    }
    return;
  }

  // 6. getAllDeviceMetaData
  if (msg.type === 'get-all-device-metadata') {
    try {
      const devices = deviceMetaDataPriorityList.getAllDeviceMetaData();
      parentPort.postMessage({
        type: 'all-device-metadata-response',
        requestId: msg.requestId,
        payload: devices || null
      });
    } catch (err) {
        logger.error('[SlidingWindowWorker] Error in getAllDeviceMetaData:', err);
        logSlidingWindowActivity('[SlidingWindowWorker] Error in getAllDeviceMetaData:'+err);
        parentPort.postMessage({
            type: 'all-device-metadata-response',
            requestId: msg.requestId,
            payload: null
      });
    }
    return;
  }
});
