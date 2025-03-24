'use strict';

const fs = require('node:fs');
const path = require('path');
const { strict } = require('assert');
const { setTimeout, clearInterval } = require('timers');
// const shuffleArray = require('shuffle-array'); // No more required
const notificationManagement = require('../../individualServices/NotificationManagement');
const individualServicesService = require("../../IndividualServicesService.js");

const executionAndTraceService = require('onf-core-model-ap/applicationPattern/services/ExecutionAndTraceService');
const forwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const profileCollection = require('onf-core-model-ap/applicationPattern/onfModel/models/ProfileCollection');

// SIMULATION
const startModule = require('../../../temporarySupportFiles/StartModule.js');
// const { inherits } = require('util'); // No more used
let simulationProgress = false;
// SIMULATION

// Constants
const NODE_ID = 'node-id';

const DEVICE_NOT_PRESENT = -1;
const TTL_CHECKING_TIMER = 1000;
let deviceListSyncPeriod = 24;
let maximumNumberOfRetries = 1;
let responseTimeout = 600;
let slidingWindowSizeDb = 500;
let slidingWindow = [];
let deviceList = [];
let lastDeviceListIndex = -1;
let print_log_level = 2;
let synchInProgress = false;
let coreModelPrefix = '';
var procedureIsRunning = false;
var periodicSynchTimerId = 0;
var ttlCheckingTimerId = 0;

/**
 * REST request simulator with random delay
 */
async function sendRequest(device) {
  try {
    let requestHeader = notificationManagement.createRequestHeader();
    let fields = "";
    let mountName = "";
    let user = requestHeader.user;
    let originator = requestHeader.originator;
    let xCorrelator = requestHeader.xCorrelator;
    let traceIndicator = requestHeader.traceIndicator;
    let customerJourney = requestHeader.customerJourney;
    let req = {
      'url': '/' + coreModelPrefix + ':network-control-domain=live/control-construct=' + device[NODE_ID],
      'body': {}
    }

    let responseCode = "";
    let responseBodyToDocument = {};
    let ret = await individualServicesService.getLiveControlConstructFromSW(
      req.url,
      requestHeader.user,
      requestHeader.originator,
      requestHeader.xCorrelator,
      requestHeader.traceIndicator,
      requestHeader.customerJourney,
      mountName,
      fields
    );

    if (procedureIsRunning == false) {
      return;
    }

    if (ret.code == undefined) {
      responseCode = 200;
    } else {
      responseCode = ret.code;
      responseBodyToDocument = ret;
    }

    executionAndTraceService.recordServiceRequest(
      requestHeader.xCorrelator,
      requestHeader.traceIndicator,
      requestHeader.user,
      requestHeader.originator,
      req.url,
      responseCode,
      req.body,
      responseBodyToDocument
    );

    return {
      'ret': ret,
      'node-id': device[NODE_ID]
    };
  } catch (error) {
    console.error(`Error in REST call for ${device.node_id}:`, error.message);
  }
}

/**
 * Returns a device object for the sliding window adding timeout informations
 */
function prepareObjectForWindow(deviceListIndex) {
  try {
    let windowObject = {
      "index": deviceListIndex,
      "node-id": deviceList[deviceListIndex][NODE_ID],
      "ttl": responseTimeout,
      "retries": maximumNumberOfRetries
    };
    return windowObject;
  } catch (error) {
    console.error("Error in prepareObjectForWindow (" + error + ")");
  }
}

/**
 * Check a device inside the sliding window
 *
 * Returns the position inside the Sliding Window
 * If doesn't exist returns DEVICE_NOT_PRESENT
 */
function checkDeviceExistsInSlidingWindow(deviceNodeId) {
  try {
    for (let i = 0; i < slidingWindow.length; i++) {
      if (slidingWindow[i]['node-id'] == deviceNodeId) {
        return i;
      }
    }
    return DEVICE_NOT_PRESENT;
  } catch (error) {
    console.log("Error in checkDeviceExistsInSlidingWindow (" + error + ")");
  }
}


/**
 * Returns the next element index of the device list ready to be inserted in sliding window
 */
function getNextDeviceListIndex() {
  try {
    if (deviceList.length == 0) {
      lastDeviceListIndex = -1;
    } else if (lastDeviceListIndex >= (deviceList.length - 1)) {
      lastDeviceListIndex = 0;
    } else {
      lastDeviceListIndex += 1;
    }
    return lastDeviceListIndex;
  } catch (error) {
    console.log("Error in getNextDeviceListIndex (" + error + ")");
  }
}


/**
 * Add the next element of Device List into the Sliding Window
 */
function addNextDeviceListElementInWindow() {
  try {
    let counter = 0
    let elementAdded = false
    do {
      if (counter >= deviceList.length) {
        return;
      }
      counter += 1
      let newDeviceListIndex = getNextDeviceListIndex();
      if (newDeviceListIndex == -1) {
        printLog('+++++ addNextDeviceListElementInWindow: newDeviceListIndex = -1 +++++', print_log_level >= 3)
        return false
      }
      if (checkDeviceExistsInSlidingWindow(deviceList[newDeviceListIndex]['node-id']) != DEVICE_NOT_PRESENT) {
        printLog('+++++ Element ' + deviceList[newDeviceListIndex][NODE_ID] + ' (index: ' + newDeviceListIndex + ') already exists in Sliding Window +++++', print_log_level >= 3)
      } else {
        slidingWindow.push(prepareObjectForWindow(newDeviceListIndex));
        elementAdded = true;
      }
    } while (!elementAdded);
    return true;
  } catch (error) {
    console.log("Error in addNextDeviceListElementInWindow (" + error + ")")
  }
}

/**
 * Helper function: prints all the list node-id(s) in the form of array
 */
function printList(listName, list) {
  let listGraph = listName + ': [';
  for (let i = 0; i < list.length; i++) {
    listGraph += (i < list.length - 1) ? (list[i][NODE_ID] + '|') : list[i][NODE_ID];
  }
  listGraph += "] (" + list.length + ")";
  return listGraph;
}

/**
 * Prints a console log message only the print_log flag is enabled
 */
function printLog(text, print_log) {
  if (print_log) {
    console.log(text);
  }
}

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Sets the timestamp to a deviceList element indexed by its node-id
 */
function setDeviceListElementTimeStamp(node_id) {
  try {
    for (let i = 0; i < deviceList.length; i++) {
      if (deviceList[i]['node-id'] == node_id) {
        deviceList[i]['timestamp'] = Date.now();
        return;
      }
    }
  } catch (error) {
    console.log("Error in setDeviceListElementTimeStamp (" + error + ")");
  }
}

/**
 * Timeout checking cycle
 *
 * When time-to-live achieves zero another request gets done and ttl reset to the original value.
 * When even all the retries achieve zero the sliding window element is discarded from both the lists.
 */
async function startTtlChecking() {
  try {
    async function upgradeTtl() {
      for (let index = 0; index < slidingWindow.length; index++) {
        slidingWindow[index].ttl -= 1;
        if (slidingWindow[index].ttl == 0) {
          let consoleMsg = '';
          if (slidingWindow[index].retries == 0) {
            consoleMsg = "Element " + slidingWindow[index][NODE_ID] + " Timeout/Retries. Dropped from S-W.";
            slidingWindow.splice(index, 1);
            if (addNextDeviceListElementInWindow()) {
              consoleMsg += (' Added element ' + slidingWindow[slidingWindow.length - 1][NODE_ID] + ' in S-W and sent request...');
              requestMessage(slidingWindow.length - 1);
            }
          } else {
            slidingWindow[index].ttl = responseTimeout;
            slidingWindow[index].retries -= 1;
            consoleMsg = "Element " + slidingWindow[index][NODE_ID] + " Timeout. -> Resend the request...";
            requestMessage(index);
          }
          console.log(consoleMsg);
        }
      }
    }
    if (procedureIsRunning) {
      ttlCheckingTimerId = setInterval(upgradeTtl, TTL_CHECKING_TIMER);
    }
  } catch (error) {
    console.log("Error in startTtlChecking (" + error + ")");
  }
}

/**
 * Performs the request
 * 
 * If the element responds, it is discarded from sliding window and another
 * element from device list is added then its request is immediatly done.
 */
async function requestMessage(index) {
  try {
    if (index >= slidingWindow.length) {
      return;
    }

    let startTime = new Date();

    function manageResponse(retObj) {
      let endTime = new Date();
      let diffTime = endTime.getTime() - startTime.getTime();
      let consoleMsg = '';
      if (retObj.ret.code !== undefined) {
        let elementIndex = checkDeviceExistsInSlidingWindow(retObj[NODE_ID]);
        if (elementIndex == DEVICE_NOT_PRESENT) {
          consoleMsg = '[Resp. Time: ' + diffTime + 'ms] Response from element ' + retObj[NODE_ID] + ' not more present in S-W. Ignore that.';
        } else {
          if (retObj.ret.code == 503) {
            consoleMsg = '[Resp. Time: ' + diffTime + 'ms] Element ' + retObj[NODE_ID] + ' not available. Dropped from S-W.';
          } else {
            consoleMsg = '[Resp. Time: ' + diffTime + 'ms] Error (' + retObj.ret.code + ' - ' + retObj.ret.message + ') from element ' + retObj[NODE_ID] + '. Dropped from S-W.';
          }
          slidingWindow.splice(elementIndex, 1);
          if (addNextDeviceListElementInWindow()) {
            consoleMsg += (' Add element ' + slidingWindow[slidingWindow.length - 1][NODE_ID] + ' in S-W and send request...');
            requestMessage(slidingWindow.length - 1);
          }
        }
      } else {
        let elementIndex = checkDeviceExistsInSlidingWindow(retObj[NODE_ID]);
        if (elementIndex == DEVICE_NOT_PRESENT) {
          consoleMsg = '[Resp. Time: ' + diffTime + 'ms] Response from element ' + retObj[NODE_ID] + ' not more present in S-W. Ignore that.';
        } else {
          consoleMsg = '[Resp. Time: ' + diffTime + 'ms] Response from element ' + retObj[NODE_ID] + '. Dropped from S-W.';
          slidingWindow.splice(elementIndex, 1);
          setDeviceListElementTimeStamp(retObj[NODE_ID]);
          if (addNextDeviceListElementInWindow()) {
            consoleMsg += (' Add element ' + slidingWindow[slidingWindow.length - 1][NODE_ID] + ' in S-W and send request...');
            requestMessage(slidingWindow.length - 1);
          }
        }
      }
      console.log(consoleMsg);
    }

    sendRequest(slidingWindow[index]).then(async retObj => {
      let busy = true;
      let steps = 0;
      do {
        if (synchInProgress == true) {
          await sleep(50);
          steps += 1;
        } else {
          busy = false;
        }
      } while (busy == true);

      if (procedureIsRunning) {
        if (steps > 0) {
          console.log('SYNCH_IN_PROGRESS [from response] (steps: ' + steps + ')');
        }
        manageResponse(retObj);
      }
    })
  } catch (error) {
    console.log("Error in requestMessage (" + error + ")");
  }
}

/**
 * filterConnectedDevices()
 * 
 * Returns the device list filtered with equipments in connected status only
 */
function filterConnectedDevices(deviceList) {
  return deviceList.filter(device => {
    return device['netconf-node-topology:connection-status'] === 'connected';
  })
}

/**
 * getTime()
 * 
 * Returns formatted date/time information Ex: ( 25/11/2023 09:43.14 )
 */

function getTime() {
  let d = new Date();
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

/**
 * Writes the realignment log file
 */
function writeRealigmentLogFile(curDeviceList, currSlidingWindow, newDeviceList, elemsAdded, elemsDropped, newSlidingWindow) {
  const folderName = '/realignment_logs'
  try {
    if (!fs.existsSync(folderName)) {
      return;
    }
  } catch (error) {
    console.error('fs.existsSync error: ' + error);
    return;
  }

  function getFileName() {
    const d = new Date();

    function dualDigits(value) {
      let strVal = String(value);
      return (strVal.length == 1) ? ('0' + strVal) : strVal;
    }

    return d.getFullYear() + '.' + dualDigits((d.getMonth() + 1)) + '.' + dualDigits(d.getDate()) + '_' +
      dualDigits(d.getHours()) + '.' + dualDigits(d.getMinutes()) + '.' + dualDigits(d.getSeconds()) +
      '.log';
  }

  function printArray(arr) {
    let elemsForLine = 0;
    content += '\n[';
    for (var i = 0; i < arr.length; i++) {
      content += (arr[i][NODE_ID] + '|');
      elemsForLine += 1;
      if (elemsForLine == 6) {
        content += '\n ';
        elemsForLine = 0;
      }
    }
    if (content.charAt(content.length - 1) == '|') {
      content = content.slice(0, content.length - 1);
    }
    content += ']';
  }

  var content = '****************************************************************';
  content += '\n\n                      Realignment LOG file';
  content += '\n\n                      (' + getTime() + ')';
  content += '\n\n****************************************************************';

  content += '\n\n                     BEFORE REALIGMENT EVENT';
  content += '\n                     -----------------------';

  content += '\n\nDevice List  (' + curDeviceList.length + ' elements)';
  content += '\n----------------------------------------------------------------';
  printArray(curDeviceList);

  content += '\n\nSliding Window  (' + currSlidingWindow.length + ' elements)';
  content += '\n----------------------------------------------------------------';
  printArray(currSlidingWindow);

  content += '\n\n\n\n                     AFTER REALIGMENT EVENT';
  content += '\n                     ----------------------';

  content += '\n\nDevice List  (' + newDeviceList.length + ' elements)';
  content += '\n----------------------------------------------------------------';
  printArray(newDeviceList);

  content += '\n\nSliding Window  (' + newSlidingWindow.length + ' elements)';
  content += '\n----------------------------------------------------------------';
  printArray(newSlidingWindow);

  content += '\n\nElements added  (' + elemsAdded.length + ' elements)';
  content += '\n----------------------------------------------------------------';
  printArray(elemsAdded);

  content += '\n\nElements dropped  (' + elemsDropped.length + ' elements)';
  content += '\n----------------------------------------------------------------';
  printArray(elemsDropped);

  content += '\n\n';

  try {
    //fs.writeFileSync(folderName + '/' + getFileName(), content);
    fs.writeFileSync(path.join(folderName, getFileName()), content);
  } catch (err) {
    console.error(err);
  }
}

module.exports.updateDeviceListFromNotification = async function updateDeviceListFromNotification(status, node_id) {
  function printDL(prefix) {
    let dlString = prefix + ': ['
    let i = 0;
    for (; i < deviceList.length; i++) {
      dlString += (deviceList[i][NODE_ID] + '|')
    }
    if (i > 0) {
      dlString = dlString.slice(0, -1);
    }
    dlString += ']';
    console.log(dlString);
  }
  console.log("<Notification>  node-id: " + node_id + "   status: " + ((status == 1) ? "connected" : "not connected"))
  let busy = true;
  let steps = 0;
  do {
    if (synchInProgress == true) {
      await sleep(50);
      steps += 1;
    } else {
      busy = false;
    }
  } while (busy == true);
  if (steps > 0) {
    console.log('SYNCH_IN_PROGRESS [from notification] (steps: ' + steps + ')');
  }
  if (status == 1) {  // Connected
    for (var i = 0; i < deviceList.length; i++) {
      if (deviceList[i][NODE_ID] == node_id) {
        console.log("Notification: element " + node_id + " already present in device list. Ignore that.")
        return; // Element already present
      }
    }
    let leftDL = deviceList.slice(0, lastDeviceListIndex + 1);
    let nodeObj = { 'node-id': node_id, 'netconf-node-topology:connection-status': 'connected' };
    let middleDL = [].concat(nodeObj);
    let rightDL = deviceList.slice(lastDeviceListIndex + 1);
    printDL('Device List before connected notification')
    deviceList = [].concat(leftDL, middleDL, rightDL);
    printDL('Device List after connected notification')
    if (slidingWindow.length < slidingWindowSizeDb) {
      addNextDeviceListElementInWindow();
      requestMessage(slidingWindow.length - 1);
      console.log(' Add element ' + slidingWindow[slidingWindow.length - 1][NODE_ID] + ' in S-W and send request...');
    }
  } else {            // Not connected
    let found = false;

    // const res = a.find((item) => item.id === 2);
    // const res = deviceList.find(())

    for (let i = 0; i < deviceList.length; i++) {
      if (deviceList[i][NODE_ID] == node_id) {
        found = true;
        printDL('Device List before not connected notification');
        deviceList.splice(i, 1);
        printDL('Device List after not connected notification');
        break;
      }
    }
    if (found == false) {
      console.log("Notification: element " + node_id + " not present in device list. Ignore that.");
      return;
    }
    for (let i = 0; i < slidingWindow.length; i++) {
      if (slidingWindow[i][NODE_ID] == node_id) {
        slidingWindow.splice(i, 1);
        if (addNextDeviceListElementInWindow()) {
          console.log(' Add element ' + slidingWindow[slidingWindow.length - 1][NODE_ID] + ' in S-W and send request...');
          requestMessage(slidingWindow.length - 1);
        }
      }
    }
  }
  // Updating device list in elasticsearch
  let deviceListString = JSON.stringify(deviceList);
  try {
    console.log("Updating device list into cache...")
    await individualServicesService.writeDeviceListToElasticsearch(deviceListString);
    console.log("Device list updated into cache.")
  } catch (error) {
    console.log(error);
  }
}

/**
 * Realigns the current device list with the new one
 * 
 * newDeviceList is the new device list that update the old one. It's mandatory.
 */
module.exports.deviceListSynchronization = async function deviceListSynchronization() {

  if (procedureIsRunning == false) {
    return;
  }

  synchInProgress = true;

  let currSlidingWindow = [...slidingWindow];
  let odlDeviceList;
  try {
    if (simulationProgress == false) {
      odlDeviceList = await individualServicesService.getLiveDeviceList();
    } else if (simulationProgress == true) {
      odlDeviceList = await startModule.getNewDeviceListExp();
    }
  } catch (error) {
    console.log(error);
    return;
  }
  odlDeviceList = filterConnectedDevices(odlDeviceList);

  console.log('');
  console.log('*******************************************************************************************************');
  console.log('*                                        DEVICE LIST REALIGNMENT                                      *');
  console.log('*                                                                                                     *');
  console.log('*                                  (Started at: ' + getTime() + ')                                  *');
  console.log('*                                                                                                     *');

  let esDeviceList = [];
  try {
    esDeviceList = await individualServicesService.readDeviceListFromElasticsearch();
  } catch (error) {
    console.log('* ' + error);
  }


  // Calculate common elements and drop elements of ES-DL
  let commonEsElements = [];
  let dropEsElements = [];
  for (let i = 0; i < esDeviceList.length; i++) {
    let found = false;
    for (let j = 0; j < odlDeviceList.length; j++) {
      if (esDeviceList[i]['node-id'] == odlDeviceList[j][NODE_ID]) {
        found = true;
        commonEsElements.push(esDeviceList[i]);
        break;
      }
    }
    if (!found) {
      dropEsElements.push(esDeviceList[i]);
    }
  }

  // Calculate new elements of ODL-DL and print ODL-DL
  let newOdlElements = [];
  for (let i = 0; i < odlDeviceList.length; i++) {
    let found = false;
    for (let j = 0; j < esDeviceList.length; j++) {
      if (odlDeviceList[i]['node-id'] == esDeviceList[j][NODE_ID]) {
        found = true;
        break;
      }
    }
    if (!found) {
      newOdlElements.push(odlDeviceList[i]);
    }
  }

  // Drop all the sliding window elements not more present in new odl device list
  let elementsDroppedFromSlidingWindow = 0
  for (let i = 0; i < slidingWindow.length;) {
    let found = false;
    for (let j = 0; j < odlDeviceList.length; j++) {
      if (slidingWindow[i]['node-id'] == odlDeviceList[j][NODE_ID]) {
        found = true;
        break;
      }
    }
    if (!found) {
      slidingWindow.splice(i, 1);
      elementsDroppedFromSlidingWindow++;
    } else {
      i++;
    }
  }

  // Shuffle new odl elements (commented issue 757)
  //newOdlElements = shuffleArray(newOdlElements);

  // If slidingWindow is empty
  if (slidingWindow.length == 0) {
    deviceList = [].concat(newOdlElements, commonEsElements);
    lastDeviceListIndex = -1;
  } else {
    // Get the last element of new sliding window
    let slidingWindowLastElement = slidingWindow[slidingWindow.length - 1];

    // Search the last element in commonEsElements to split commonEsElements
    let lastElementFound = false;
    for (let i = 0; i < commonEsElements.length; i++) {
      if (slidingWindowLastElement['node-id'] == commonEsElements[i][NODE_ID]) {
        lastElementFound = true;
        lastDeviceListIndex = i;
        break;
      }
    }
    if (lastElementFound == false) {
      deviceList = [].concat(newOdlElements, commonEsElements);
      lastDeviceListIndex = -1;
    } else {
      if (lastDeviceListIndex == commonEsElements.length - 1) {
        deviceList = [].concat(newOdlElements, commonEsElements);
        lastDeviceListIndex = -1;
      } else {
        let startIndex = 0
        let endIndex = lastDeviceListIndex + 1
        let commonEsElementsLeft = commonEsElements.slice(startIndex, endIndex);
        let commonEsElementsRight = commonEsElements.slice(endIndex);
        deviceList = [].concat(commonEsElementsLeft, newOdlElements, commonEsElementsRight);
      }
    }
  }

  //
  // Write new ODL-DL to Elasticsearch
  //
  let deviceListCleaned = [];
  for (let i = 0; i < deviceList.length; i++) {
    deviceListCleaned.push({ "node-id": deviceList[i][NODE_ID] });
  }
  deviceList = deviceListCleaned;
  var deviceListStringiflied = JSON.stringify(deviceList);
  try {
    await individualServicesService.writeDeviceListToElasticsearch(deviceListStringiflied);
    console.log('* New Device List updated to Elasticsearch                                                            *');
  } catch (error) {
    console.log(error);
  }


  // Fill the sliding window at the max allowed and get new the elements
  let slidingWindowSize = (slidingWindowSizeDb > deviceList.length) ? deviceList.length : slidingWindowSizeDb;
  for (let i = slidingWindow.length; i < slidingWindowSize; i++) {
    addNextDeviceListElementInWindow();
    requestMessage(slidingWindow.length - 1);
    printLog('* Send request for new element: ' + slidingWindow[slidingWindow.length - 1][NODE_ID], print_log_level >= 2);
  }


  // Erase all the control constructs from elasticsearch referring elements not more present in new odl device list
  for (let i = 0; i < dropEsElements.length; i++) {
    let cc_id = dropEsElements[i][NODE_ID];
    try {
      // Used a parameter instead a fixed value
      let indexAlias = common[1].indexAlias;  // Retrieve indexalias for ES
      let ret = await individualServicesService.deleteRecordFromElasticsearch(indexAlias, '_doc', cc_id);
      printLog('* ' + ret.result, print_log_level >= 2);
    } catch (error) {
      console.log('* An error has occurred deleting ' + cc_id + ' from elasticsearch. Element does not exist.)', print_log_level >= 2);
    }
  }
  console.log('* ES Device List size: ' + esDeviceList.length + '                                                                             *');
  console.log('* ODL Device List size: ' + odlDeviceList.length + '                                                                            *');
  console.log('* Common element(s): ' + commonEsElements.length + '                                                                               *');
  console.log('* New element(s): ' + newOdlElements.length + '                                                                                   *');
  console.log('* Dropped element(s): ' + dropEsElements.length + '                                                                               *');
  console.log('* Dropped elements from Sliding Window: ' + elementsDroppedFromSlidingWindow + '                                                             *');
  console.log('* New Sliding Window size: ' + slidingWindow.length + '                                                                          *');
  console.log('* New Device List size: ' + deviceList.length + '                                                                            *')
  console.log('*                                  (Stopped at: ' + getTime() + ')                                  *');
  console.log('*******************************************************************************************************');
  console.log('');

  writeRealigmentLogFile(esDeviceList, currSlidingWindow, deviceList, newOdlElements, dropEsElements, slidingWindow);
  synchInProgress = false;
  return true;
}

/**
 * Entry point function
 * 
 * It starts the cyclic process enabling the time to live check
 * 
 * deviceList: list of devices in connected state. It's optional. If
 *             deviceList is present the procedure will starts immediatly
 **/
module.exports.startCyclicProcess = async function startCyclicProcess(logging_level) {

  if (procedureIsRunning) {
    return;
  }
  procedureIsRunning = true;

  async function extractProfileConfiguration(uuid) {
    let profile = await profileCollection.getProfileAsync(uuid);
    let objectKey = Object.keys(profile)[2];
    profile = profile[objectKey];
    return profile["integer-profile-configuration"]["integer-value"];
  }

  const forwardingName = "RequestForLiveControlConstructCausesReadingFromDeviceAndWritingIntoCache";
  const forwardingConstruct = await forwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
  coreModelPrefix = forwardingConstruct.name[0].value.split(':')[0];
  let prefix = forwardingConstruct.uuid.split('op')[0];
  slidingWindowSizeDb = await extractProfileConfiguration(prefix + "integer-p-000");
  responseTimeout = await extractProfileConfiguration(prefix + "integer-p-001");
  maximumNumberOfRetries = await extractProfileConfiguration(prefix + "integer-p-002");
  deviceListSyncPeriod = await extractProfileConfiguration(prefix + "integer-p-003");

  print_log_level = logging_level;
  console.log('');
  console.log('*******************************************************************************************************');
  console.log('*                             CYCLIC PROCESS PROCEDURE STARTED                                        *');
  console.log('*                                                                                                     *');
  console.log('*                                 ( ' + getTime() + ' )                                             *');
  console.log('*                                                                                                     *');
  console.log('*******************************************************************************************************');

  let odlDeviceList;
  try {
    odlDeviceList = await individualServicesService.getLiveDeviceList();
  } catch (error) {
    console.log(error);
    return;
  }
  odlDeviceList = filterConnectedDevices(odlDeviceList);

  let elasticsearchList = [];
  try {
    elasticsearchList = await individualServicesService.readDeviceListFromElasticsearch();
  } catch (error) {
    console.log(error);
  }
  //printLog(printList('Device List (ES)', elasticsearchList), print_log_level >= 1);
  //
  // Calculate common elements and drop elements of ES-DL and print the ES-DL
  //
  let commonEsElements = [];
  let dropEsElements = [];
  let esString = 'Device List (ES): [';
  for (let i = 0; i < elasticsearchList.length; i++) {
    let found = false;
    for (let j = 0; j < odlDeviceList.length; j++) {
      if (elasticsearchList[i]['node-id'] == odlDeviceList[j][NODE_ID]) {
        found = true;
        commonEsElements.push(elasticsearchList[i]);
        esString += (((i == 0) ? '' : '|') + elasticsearchList[i][NODE_ID]);
        break;
      }
    }
    if (!found) {
      dropEsElements.push(elasticsearchList[i]);
      esString += (((i == 0) ? '' : '|') + elasticsearchList[i][NODE_ID]);
    }
  }
  esString += (']  (' + elasticsearchList.length + ')');
  try {
    console.log(esString);
  } catch (error) {
    console.log("Too many elastic search elements to print in console.");
  }
  //
  // Calculate new elements and common elements of ODL-DL and print the ODL-DL
  //
  let newOdlElements = [];
  let commonOdlElements = [];
  let odlString = 'Device List (ODL): [';
  for (let i = 0; i < odlDeviceList.length; i++) {
    let found = false;
    for (let j = 0; j < elasticsearchList.length; j++) {
      if (odlDeviceList[i]['node-id'] == elasticsearchList[j][NODE_ID]) {
        commonOdlElements.push(odlDeviceList[i]);
        odlString += (((i == 0) ? '' : '|') + odlDeviceList[i][NODE_ID]);
        found = true;
        break;
      }
    }
    if (!found) {
      newOdlElements.push(odlDeviceList[i])
      odlString += (((i == 0) ? '' : '|') + odlDeviceList[i][NODE_ID]);
    }
  }
  odlString += (']  (' + odlDeviceList.length + ')');
  try {
    console.log(odlString);
  } catch (error) {
    console.log("Too many ODL elements to print in console.")
  }

  // Shuffle the new elements (commented issue 757)
  //newOdlElements = shuffleArray(newOdlElements);

  // Calculate the new ODL-DL: [new odl elements shuffled] + [common es elements]
  let newString = 'Device List (Updated): [';
  let newPiped = false;
  for (let i = 0; i < newOdlElements.length; i++) {
    newString += (((i == 0) ? '' : '|') + newOdlElements[i][NODE_ID]);
    newPiped = true;
  }
  for (let i = 0; i < commonEsElements.length; i++) {
    newString += (((i == 0 && newPiped == false) ? '' : '|') + commonEsElements[i][NODE_ID]);
    newPiped = true;
  }
  newString += (']  (' + odlDeviceList.length + ')');
  try {
    console.log(newString);
  } catch (error) {
    console.log("Too many updated device list elements to print in console.");
  }

  // Drop from ES all the elements not more present in ES-DL
  for (let i = 0; i < dropEsElements.length; i++) {
    let cc_id = dropEsElements[i][NODE_ID];
    try {
      // Used a parameter instead a fixed value
      let indexAlias = common[1].indexAlias; // Retrieve indexalias for ES
      let ret = await individualServicesService.deleteRecordFromElasticsearch(indexAlias, '_doc', cc_id); 
      printLog(ret.result, print_log_level >= 2);
    } catch (error) {
      console.log('* An error has occurred deleting ' + cc_id + ' from elasticsearch. Element does not exist.)', print_log_level >= 2);
    }
  }

  odlDeviceList = [].concat(newOdlElements, commonEsElements);
  printLog("Update device list to elasticsearch", print_log_level >= 2)

  let deviceListCleaned = [];
  for (let i = 0; i < odlDeviceList.length; i++) {
    deviceListCleaned.push({ "node-id": odlDeviceList[i][NODE_ID] });
  }
  deviceList = deviceListCleaned;
  let odlDeviceListString = JSON.stringify(deviceList);
  try {
    await individualServicesService.writeDeviceListToElasticsearch(odlDeviceListString);
  } catch (error) {
    console.log(error);
  }

  // Sliding Window
  let slidingWindowSize = (slidingWindowSizeDb > deviceList.length) ? deviceList.length : slidingWindowSizeDb;
  lastDeviceListIndex = -1;
  for (let i = 0; i < slidingWindowSize; i++) {
    addNextDeviceListElementInWindow();
  }
  printLog(printList('Sliding Window', slidingWindow), print_log_level >= 1);
  for (let i = 0; i < slidingWindowSize; i++) {
    requestMessage(i);
    printLog('Element ' + slidingWindow[i][NODE_ID] + ' send request...', print_log_level >= 2);
  }
 
  // Periodic Synchronization
  const periodicSynchTime = deviceListSyncPeriod * 3600 * 1000;
  const { deviceListSynchronization } = module.exports;
  periodicSynchTimerId = setInterval(deviceListSynchronization, periodicSynchTime);
 
  // TTL checking
  startTtlChecking();
  return true;
}

/**
 * Stops the cyclic process disabling the time to live check
 * 
 **/
module.exports.stopCyclicProcess = async function stopCyclicProcess() {

  console.log('*******************************************************************************************************');
  console.log('*                             CYCLIC PROCESS PROCEDURE STOPPED                                        *');
  console.log('*                                                                                                     *');
  console.log('*                                 ( ' + getTime() + ' )                                             *');
  console.log('*                                                                                                     *');
  console.log('*******************************************************************************************************');

  procedureIsRunning = false;
  clearInterval(periodicSynchTimerId);
  clearInterval(ttlCheckingTimerId);
}

module.exports.getDeviceListInMemory = async function getDeviceListInMemory() {
  return deviceList;
}