'use strict';

const { strict } = require('assert');
const { setTimeout } = require('timers');
const path = require("path");
const individualServicesService = require( "../../IndividualServicesService.js");
const shuffleArray = require('shuffle-array');
const forwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
// SIMULATION
const startModule = require('../../../temporarySupportFiles/StartModule.js');
const { inherits } = require('util');
let simulationProgress = false;
// SIMULATION

const DEVICE_NOT_PRESENT = -1;
let deviceListSyncPeriod = 24;
let maximumNumberOfRetries = 1;
let responseTimeout = 600;
let slidingWindowSizeDb = 500;
let slidingWindowSize = 3;      
let slidingWindow = [];
let deviceList = [];
let lastDeviceListIndex = -1;
let print_log_level = 2;    
let synchInProgress = false;
let coreModelPrefix = '';
var procedureIsRunning = false;

/**
 * REST request simulator with random delay
 */
async function sendRequest(device) {    
    try {
        let req = {
            'url': '/' + coreModelPrefix + ':network-control-domain=live/control-construct=' + device['node-id'],
            'body': {} 
        }
        let fields = "";
        let mountName = "";
        let user = "User Name";
        let originator = "MicroWaveDeviceInventory";
        let xCorrelator = "550e8400-e29b-11d4-a716-446655440000";
        let traceIndicator = "1.3.1";
        let customerJourney = "Unknown value";
        let ret = await individualServicesService.getLiveControlConstruct(req.url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields);
        
        let responseCode = 200;  // OK        
        let responseBodyToDocument = {};
        responseBodyToDocument = ret;
        var executionAndTraceService = require('onf-core-model-ap/applicationPattern/services/ExecutionAndTraceService');
        executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
        
        return {
            'ret': ret,
            'node-id': device['node-id']
        };
    } catch (error) {
        console.error(`Errore nella chiamata REST per il dispositivo ${device.node_id}:`, error.message);
        debugger;
    }
}

/**
 * Returns a device object for the sliding window adding timeout informations
 */
function prepareObjectForWindow(deviceListIndex) {
    try {
        let windowObject = {
            "index"   : deviceListIndex,
            "node-id" : deviceList[deviceListIndex]['node-id'],
            "ttl"     : responseTimeout,
            "retries" : maximumNumberOfRetries
        };
        return windowObject;
    } catch(error) {
        console.log("Error in prepareObjectForWindow (" + error + ")");
        debugger;
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
    } catch(error) {
        console.log("Error in checkDeviceExistsInSlidingWindow (" + error + ")");
        debugger;
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
    } catch(error) {
        console.log("Error in getNextDeviceListIndex (" + error + ")");
        debugger;
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
                printLog('+++++ Element ' + deviceList[newDeviceListIndex]['node-id'] + ' (indice: ' + newDeviceListIndex + ') already exists in Sliding Window +++++', print_log_level >= 3)
            } else {
                slidingWindow.push(prepareObjectForWindow(newDeviceListIndex));
                elementAdded = true;                
            }            
        } while (!elementAdded);
        return true;
    } catch(error) {
        console.log("Error in addNextDeviceListElementInWindow (" + error + ")")
        debugger
    }    
}

/**
 * Helper function: prints all the list node-id(s) in the form of array
 */
function printList(listName, list) {
    let listGraph = listName + ': [';
    for (let i = 0; i < list.length; i++) {
        listGraph += (i < list.length - 1) ? (list[i]['node-id'] + '|') : list[i]['node-id'];
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
    } catch(error) {
        console.log("Error in setDeviceListElementTimeStamp (" + error + ")");
        debugger;
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
                    if (slidingWindow[index].retries == 0) {
                        console.log("%cElement " + slidingWindow[index]['node-id'] + " Timeout/Retries. -> Dropped from Sliding Window", "color:red");
                        slidingWindow.splice(index, 1);
                        if (addNextDeviceListElementInWindow()) {
                            printLog('Added element ' + slidingWindow[slidingWindow.length - 1]['node-id'] + ' in window and sent request...', print_log_level >= 2);
                            printLog(printList('Sliding Window', slidingWindow), print_log_level >= 1);
                            requestMessage(slidingWindow.length-1);
                        }
                    } else {
                        slidingWindow[index].ttl = responseTimeout;
                        slidingWindow[index].retries -= 1;
                        printLog("Element " + slidingWindow[index]['node-id'] + " Timeout. -> Resend the request...", print_log_level >= 2);
                        requestMessage(index);
                    }                
                }
            }
        }        
        setInterval(upgradeTtl, 1000);
    } catch(error) {
        console.log("%cError in startTtlChecking (" + error + ")", "color:red");
        debugger;
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
        
        function manageResponse(retObj) {
            if (retObj.ret.code !== undefined) {
                let elementIndex = checkDeviceExistsInSlidingWindow(retObj['node-id']);
                if (elementIndex == DEVICE_NOT_PRESENT) {                
                    printLog('Response from element ' + retObj['node-id'] + ' not more present in Sliding Window. Ignore that.', print_log_level >= 2);
                } else {
                    if (slidingWindow[elementIndex].retries == 0) {
                        if (retObj.ret.code == 503) {
                            console.log('%cElement ' + retObj['node-id'] + ' not available (II time). --> Dropped from Sliding Window', 'color:red');
                        } else {
                            console.log('%cError (' + retObj.ret.code + ' - ' + retObj.ret.message + ') from element (II time) ' + retObj['node-id'] + ' --> Dropped from Sliding Window', 'color:red');
                        }                    
                        slidingWindow.splice(elementIndex, 1);
                        if (addNextDeviceListElementInWindow()) {
                            printLog('Add element ' + slidingWindow[slidingWindow.length - 1]['node-id'] + ' in Sliding Window and send request...', print_log_level >= 2);
                            requestMessage(slidingWindow.length-1);
                        }
                        printLog(printList('Sliding Window', slidingWindow), print_log_level >= 1);
                    } else {
                        if (retObj.ret.code == 503) {
                            printLog('Element ' + retObj['node-id'] + ' not available (I time). Resend the request...', print_log_level >= 2);
                        } else {
                            printLog('Error (' + retObj.ret.code + ' - ' + retObj.ret.message + ') from element (I time) ' + retObj['node-id'] + ' Resend the request...', print_log_level >= 2);
                        }
                        slidingWindow[elementIndex].ttl = responseTimeout;
                        slidingWindow[elementIndex].retries -= 1;
                        requestMessage(elementIndex);                
                    }
                }
            } else {
                printLog('****************************************************************************************************', print_log_level >= 2);
                let elementIndex = checkDeviceExistsInSlidingWindow(retObj['node-id']);
                if (elementIndex == DEVICE_NOT_PRESENT) {                
                    printLog('Response from element ' + retObj['node-id'] + ' not more present in Sliding Window. Ignore that.', print_log_level >= 2);
                } else {
                    printLog('Response from element ' + retObj['node-id'] + ' --> Dropped from Sliding Window.', print_log_level >= 2);
                    slidingWindow.splice(elementIndex, 1);
                    setDeviceListElementTimeStamp(retObj['node-id']);
                    if (addNextDeviceListElementInWindow()) {
                        printLog('Add element ' + slidingWindow[slidingWindow.length - 1]['node-id'] + ' in Sliding Window and send request...', print_log_level >= 2);
                        printLog(printList('Device List', deviceList), simulationProgress);
                        printLog(printList('Sliding Window', slidingWindow), simulationProgress);
                        requestMessage(slidingWindow.length-1);
                    }
                }
                printLog('****************************************************************************************************', print_log_level >= 2);
            }            
        }
        function sleep(ms) {
            return new Promise((resolve) => {
              setTimeout(resolve, ms);
            });
        }
        sendRequest(slidingWindow[index]).then(async retObj => {
            let busy = true;
            do {
                if (synchInProgress == true) {
                    await sleep(50);
                } else {
                    busy = false;
                }
            } while (busy == true);
            manageResponse(retObj);            
        })
    } catch(error) {
        console.log("%cError in requestMessage (" + error + ")", "color:red");
        debugger;
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
 * Realigns the current device list with the new one 
 * 
 * newDeviceList is the new device list that update the old one. It's mandatory.
 */
module.exports.deviceListSynchronization = async function deviceListSynchronization() {
    
    synchInProgress = true;

    let odlDeviceList;
    try {
        if (simulationProgress == false) {
            odlDeviceList = await individualServicesService.getLiveDeviceList();
        } else if (simulationProgress == true) {
            odlDeviceList = await startModule.getNewDeviceListExp();
        }        
    } catch (error) {
        console.log(error);
        synchInProgress = false;
        return;
    }
    odlDeviceList = filterConnectedDevices(odlDeviceList);

    console.log('');
    console.log('*******************************************************************************************************');
    console.log('*                                        DEVICE LIST REALIGNMENT                                      *');
    console.log('*                                                                                                     *');
    console.log('*                                       ( ' + getTime() + ' )                                       *');
    console.log('*                                                                                                     *');
    console.log('* Colors Legend:    %cNew Elements (Priority)    %cCommon Elements    %cElements To Drop                    %c*','color:yellow','color:green','color:red', 'color:inherits');
    console.log('*                                                                                                     *');
    
    let esDeviceList = await individualServicesService.readDeviceListFromElasticsearch();
    
    //
    // Calculate common elements and drop elements of ES-DL and print ES-DL
    //
    let commonEsElements = [];
    let dropEsElements = [];
    let esRules = [];
    let esString = '* Device List (ES): [';
    for (let i = 0; i < esDeviceList.length; i++) {
        let found = false;
        for (let j = 0; j < odlDeviceList.length; j++) {
            if (esDeviceList[i]['node-id'] == odlDeviceList[j]['node-id']) {
                found = true;
                commonEsElements.push(esDeviceList[i]);
                esString += (((i == 0) ? '' : '|') + ('%c' + esDeviceList[i]['node-id'] + '%c'));
                esRules.push("color:green");
                esRules.push("color:inherit");
                break;
            }
        }
        if (!found) {
            dropEsElements.push(esDeviceList[i]);    
            esString += (((i == 0) ? '' : '|') + ('%c' + esDeviceList[i]['node-id'] + '%c'));
            esRules.push("color:red");
            esRules.push("color:inherit");        
        }
    }
    esString += (']  (' + esDeviceList.length + ')');
    console.log(esString, ...esRules);
    
    //
    // Drop all the sliding window elements not more present in new odl device list
    //
    for (let i = 0; i < slidingWindow.length; ) {
        let found = false;
        for (let j = 0; j < odlDeviceList.length; j++) {                
            if (slidingWindow[i]['node-id'] == odlDeviceList[j]['node-id']) {
                found = true;
                break;
            }
        }
        if (!found) {
            slidingWindow.splice(i, 1);
        } else {
            i++;
        }
    }
    //
    // Calculate new elements and common elements of ODL-DL and print ODL-DL
    //
    let newOdlElements = [];
    let commonOdlElements = [];
    let odlRules = [];
    let odlString = '* Device List (ODL): [';
    for (let i = 0; i < odlDeviceList.length; i++) {
        let found = false;
        for (let j = 0; j < esDeviceList.length; j++) {
            if (odlDeviceList[i]['node-id'] == esDeviceList[j]['node-id']) {
                found = true;
                commonOdlElements.push(odlDeviceList[i]);
                odlString += (((i == 0) ? '' : '|') + ('%c' + odlDeviceList[i]['node-id'] + '%c'));
                odlRules.push("color:green");
                odlRules.push("color:inherit");
                break;
            }
        }
        if (!found) {
            newOdlElements.push(odlDeviceList[i]);
            odlString += (((i == 0) ? '' : '|') + ('%c' + odlDeviceList[i]['node-id'] + '%c'));
            odlRules.push("color:yellow");
            odlRules.push("color:inherit");
        }
    }
    odlString += (']  (' + odlDeviceList.length + ')');
    console.log(odlString, ...odlRules);
    //
    // Shuffle new odl elements (commented issue 757)
    //
    //newOdlElements = shuffleArray(newOdlElements); 
    
    //
    // Get the next element common to both the esDeviceList and odlDeviceList. 
    // This element will provide the index needed to split the commonElements list.
    //
    let elementFound = false;
    let nextElement;
    if (commonEsElements.length > 0) {
        do {
            nextElement = esDeviceList[getNextDeviceListIndex()];
            for (let i = 0; i < odlDeviceList.length; i++) {
                if (nextElement['node-id'] == odlDeviceList[i]['node-id']) {
                    elementFound = true;
                    break;
                }
            }
        } while (elementFound == false);
        //printLog('* nextElement: ' + nextElement['node-id'], simulationProgress);
    } else if (commonEsElements.length == 0 || newOdlElements.length == 0) {
        lastDeviceListIndex = -1;
    }
    //
    // Split commonEsElements to insert newOdlElements array inside
    //
    let nextElementFound = false;
    let newDeviceListLeft = [];
    let newDeviceListRight = [];
    for (let i = 0; i < commonEsElements.length; i++) {
        if (nextElement['node-id'] == commonEsElements[i]['node-id']) {
            nextElementFound = true
            // Update the lastDeviceListIndex: it must be relocated to the last element of newDeviceListLeft
            lastDeviceListIndex = i - 1;
        }
        if (nextElementFound == false) {
            newDeviceListLeft.push(commonEsElements[i]);
        } else {
            newDeviceListRight.push(commonEsElements[i]);
        }
    }
    deviceList = [].concat(newDeviceListLeft, newOdlElements, newDeviceListRight);

    //
    // Print the new ODL-DL (Updated)
    //
    let newRules = [];
    let newString = '* Device List (Updated): [';
    let newPiped = false;
    for (let i = 0; i < newDeviceListLeft.length; i++) {
        newString += (((i == 0) ? '' : '|') + ('%c' + newDeviceListLeft[i]['node-id'] + '%c'));
        newRules.push("color:green");
        newRules.push("color:inherit");
        newPiped = true;
    }
    for (let i = 0; i < newOdlElements.length; i++) {
        newString += (((i == 0 && newPiped == false) ? '' : '|') + ('%c' + newOdlElements[i]['node-id'] + '%c'));
        newRules.push("color:yellow");
        newRules.push("color:inherit");
        newPiped = true;
    }
    for (let i = 0; i < newDeviceListRight.length; i++) {
        newString += (((i == 0 && newPiped == false) ? '' : '|') + ('%c' + newDeviceListRight[i]['node-id'] + '%c'));
        newRules.push("color:green");
        newRules.push("color:inherit");
        newPiped = true;
    }
    newString += (']  (' + odlDeviceList.length + ')');
    console.log(newString, ...newRules);

    //
    // Write new ODL-DL to Elasticsearch
    //
    try {
        await individualServicesService.writeDeviceListToElasticsearch(JSON.stringify(deviceList));
        printLog('* Update new device list to Elasticsearch', print_log_level >= 2);
    } catch (error) {
        console.log(error);
    }
    //printLog('* lastDeviceListIndex: ' + lastDeviceListIndex, simulationProgress);    
    
    //
    // Fill the sliding window at the max allowed
    //
    slidingWindowSize = (slidingWindowSizeDb > deviceList.length) ? deviceList.length : slidingWindowSizeDb;
    for (let i = slidingWindow.length; i < slidingWindowSize; i++) {
        addNextDeviceListElementInWindow();
        requestMessage(slidingWindow.length-1);
        printLog('* Send request for new element: ' + slidingWindow[slidingWindow.length-1]['node-id'], print_log_level >= 2);    
    }
    printLog(printList('* Sliding Window', slidingWindow), print_log_level >= 2);

    //
    // Erase all the control constructs from elasticsearch referring elements not more present in new odl device list
    //
    for (let i = 0; i < dropEsElements.length; i++) {
        let cc_id = dropEsElements[i]['node-id'];
        let ret = await individualServicesService.deleteRecordFromElasticsearch(7, '_doc', cc_id);
        printLog('* ' + ret.result, print_log_level >= 2);
    }
    console.log('*******************************************************************************************************');
    console.log('');

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
        const profileCollection = require('onf-core-model-ap/applicationPattern/onfModel/models/ProfileCollection');
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
    console.log('*  Colors Legend:    %cNew Elements (Priority)    %cCommon Elements    %cElements To Drop                   %c*','color:yellow','color:green','color:red','color:inherits');
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
    //printLog(printList('Device List (ODL)', odlDeviceList), print_log_level >= 1);

    try {
        let elasticsearchList = await individualServicesService.readDeviceListFromElasticsearch();
        //printLog(printList('Device List (ES)', elasticsearchList), print_log_level >= 1);
        //
        // Calculate common elements and drop elements of ES-DL and print the ES-DL
        //
        let commonEsElements = [];
        let dropEsElements = [];
        let esRules = [];
        let esString = 'Device List (ES): [';
        for (let i = 0; i < elasticsearchList.length; i++) {
            let found = false;
            for (let j = 0; j < odlDeviceList.length; j++) {
                if (elasticsearchList[i]['node-id'] == odlDeviceList[j]['node-id']) {
                    found = true;
                    commonEsElements.push(elasticsearchList[i]);                    
                    esString += (((i == 0) ? '' : '|') + ('%c' + elasticsearchList[i]['node-id'] + '%c'));
                    esRules.push("color:green");
                    esRules.push("color:inherit");
                    break;
                }
            }
            if (!found) {
                dropEsElements.push(elasticsearchList[i]);                
                esString += (((i == 0) ? '' : '|') + ('%c' + elasticsearchList[i]['node-id'] + '%c'));
                esRules.push("color:red");
                esRules.push("color:inherit");
            }
        }
        esString += (']  (' + elasticsearchList.length + ')');
        console.log(esString, ...esRules);

        //
        // Calculate new elements and common elements of ODL-DL and print the ODL-DL
        //
        let newOdlElements = [];
        let commonOdlElements = [];
        let odlRules = [];
        let odlString = 'Device List (ODL): [';
        for (let i = 0; i < odlDeviceList.length; i++) {
            let found = false;
            for (let j = 0; j < elasticsearchList.length; j++) {
                if (odlDeviceList[i]['node-id'] == elasticsearchList[j]['node-id']) {
                    commonOdlElements.push(odlDeviceList[i]);
                    odlString += (((i == 0) ? '' : '|') + ('%c' + odlDeviceList[i]['node-id'] + '%c'));
                    odlRules.push("color:green");
                    odlRules.push("color:inherit");
                    found = true;
                    break;
                }
            }
            if (!found) {
                newOdlElements.push(odlDeviceList[i])
                odlString += (((i == 0) ? '' : '|') + ('%c' + odlDeviceList[i]['node-id'] + '%c'));
                odlRules.push("color:yellow");
                odlRules.push("color:inherit");
            }
        }
        odlString += (']  (' + odlDeviceList.length + ')');
        console.log(odlString, ...odlRules);
        //
        // Shuffle the new elements (commented issue 757)
        //
        //newOdlElements = shuffleArray(newOdlElements);

        //
        // Calculate the new ODL-DL: [new odl elements shuffled] + [common es elements]
        //
        let newRules = [];
        let newString = 'Device List (Updated): [';
        let newPiped = false;
        for (let i = 0; i < newOdlElements.length; i++) {
            newString += (((i == 0) ? '' : '|') + ('%c' + newOdlElements[i]['node-id'] + '%c'));
            newRules.push("color:yellow");
            newRules.push("color:inherit");
            newPiped = true;
        }
        for (let i = 0; i < commonEsElements.length; i++) {
            newString += (((i == 0 && newPiped == false) ? '' : '|') + ('%c' + commonEsElements[i]['node-id'] + '%c'));
            newRules.push("color:green");
            newRules.push("color:inherit");
            newPiped = true;
        }
        newString += (']  (' + odlDeviceList.length + ')');
        console.log(newString, ...newRules);

        //
        // Drop from ES all the elements not more present in ES-DL
        //
        for (let i = 0; i < dropEsElements.length; i++) {
            let cc_id = dropEsElements[i]['node-id'];
            let ret = await individualServicesService.deleteRecordFromElasticsearch(7, '_doc', cc_id);
            printLog(ret.result, print_log_level >= 2);
        }

        odlDeviceList = [].concat(newOdlElements, commonEsElements);
        printLog("Update device list to elasticsearch", print_log_level >= 2)
    } catch (error) {
        console.log(error);
        // (commented issue 757)
        // odlDeviceList = shuffleArray(odlDeviceList);
        printLog(printList('Device List', odlDeviceList), print_log_level >= 1);
        // printLog("Write ODL device list shuffled to Elasticsearch", print_log_level >= 2);
        printLog("Write ODL device list to Elasticsearch", print_log_level >= 2);
    }
    
    let odlDeviceListString = JSON.stringify(odlDeviceList);
    try {
        await individualServicesService.writeDeviceListToElasticsearch(odlDeviceListString);
    } catch (error) {
        console.log(error);        
    }         
    deviceList = odlDeviceList;
    //
    // Sliding Window
    //
    slidingWindowSize = (slidingWindowSizeDb > deviceList.length) ? deviceList.length : slidingWindowSizeDb;
    lastDeviceListIndex = -1;
    for (let i = 0; i < slidingWindowSize; i++) {
        addNextDeviceListElementInWindow();        
    }
    printLog(printList('Sliding Window', slidingWindow), print_log_level >= 1);
    for (let i = 0; i < slidingWindowSize; i++) {
        requestMessage(i);
        printLog('Element ' + slidingWindow[i]['node-id'] + ' send request...', print_log_level >= 2);
    }
    //
    // Periodic Synchronization
    //
    const periodicSynchTime = deviceListSyncPeriod * 3600 * 1000;
    const { deviceListSynchronization } = module.exports;
    setInterval(deviceListSynchronization, periodicSynchTime);
    //
    // TTL checking
    //
    startTtlChecking();
    return true;
}
