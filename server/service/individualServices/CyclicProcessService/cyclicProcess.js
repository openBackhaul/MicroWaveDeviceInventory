'use strict';

const { strict } = require('assert');
const { setTimeout } = require('timers');
const { CronJob } = require('cron');
const path = require("path");
const individualServices = require( "../../IndividualServicesService.js");
const shuffleArray = require('shuffle-array');

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


/**
 * REST request simulator with random delay
 */
async function sendRequest(device) {    
    try {        
        let ret = await individualServices.getLiveControlConstruct('/core-model-1-4:network-control-domain=live/control-construct=' + device['node-id'])
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
 * Pops the element identified by its node-id from the Device List
 */
function discardElementFromDeviceList(nodeId) {
    try {
        for (let i = 0; i < deviceList.length; i++) {
            if (deviceList[i]['node-id'] == nodeId) {
                deviceList.splice(i, 1);
                if (lastDeviceListIndex > i) {
                    lastDeviceListIndex -= 1;
                }
            }
        }        
    } catch(error) {
        console.log("Error in discardElementFromDeviceList (" + error + ")");
        debugger;
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
                        printLog("Element " + slidingWindow[index]['node-id'] + " Timeout/Retries. -> Dropped from Sliding Window", print_log_level >= 2);
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
        console.log("Error in startTtlChecking (" + error + ")");
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
        
        sendRequest(slidingWindow[index]).then(retObj => {
            if (retObj.ret.code !== undefined) {
                let elementIndex = checkDeviceExistsInSlidingWindow(retObj['node-id']);
                if (slidingWindow[elementIndex].retries == 0) {
                    printLog('Error (' + retObj.ret.code + ' - ' + retObj.ret.message + ') from element (II time) ' + retObj['node-id'] + ' --> Dropped from Sliding Window', print_log_level >= 2);                    
                    slidingWindow.splice(elementIndex, 1);
                    if (addNextDeviceListElementInWindow()) {
                        printLog('Add element ' + slidingWindow[slidingWindow.length - 1]['node-id'] + ' in Sliding Window and send request...', print_log_level >= 2);
                        requestMessage(slidingWindow.length-1);
                    }
                    printLog(printList('Sliding Window', slidingWindow), print_log_level >= 1);
                } else {
                    printLog('Error (' + retObj.ret.code + ' - ' + retObj.ret.message + ') from element (I time) ' + retObj['node-id'] + ' Resend the request....', print_log_level >= 2);
                    slidingWindow[elementIndex].ttl = responseTimeout;
                    slidingWindow[elementIndex].retries -= 1;
                    requestMessage(elementIndex);                
                }                
            } else {
                printLog('****************************************************************************************************', print_log_level >= 2);
                let elementIndex = checkDeviceExistsInSlidingWindow(retObj['node-id']);
                if (elementIndex == DEVICE_NOT_PRESENT) {                
                    printLog('Response from element ' + retObj['node-id'] + ' not more present in Sliding Window. Ignore that.', print_log_level >= 2);
                } else {
                    printLog('Response from element ' + retObj['node-id'] + ' --> Dropped from Sliding Window. Timestamp: ' + Date.now(), print_log_level >= 2);
                    slidingWindow.splice(elementIndex, 1);
                    setDeviceListElementTimeStamp(retObj['node-id']);
                    if (addNextDeviceListElementInWindow()) {
                        printLog('Add element ' + slidingWindow[slidingWindow.length - 1]['node-id'] + ' in Sliding Window and send request...', print_log_level >= 2);
                        printLog(printList('Device List', deviceList), print_log_level >= 2);
                        printLog(printList('Sliding Window', slidingWindow), print_log_level >= 1);
                        requestMessage(slidingWindow.length-1);
                    }
                }
                printLog('****************************************************************************************************', print_log_level >= 2);
            }            
        })
    } catch(error) {
        console.log("Error in requestMessage (" + error + ")");
        debugger;
    }      
}

function filterConnectedDevices(deviceList) {
    return deviceList.filter(device => {
        return device['netconf-node-topology:connection-status'] === 'connected';
    })
}


/**
 * Realigns the current device list with the new one 
 * 
 * newDeviceList is the new device list that update the old one. It's mandatory.
 */
module.exports.deviceListSynchronization = async function deviceListSynchronization() {
        
    let odlDeviceList;
    try {
        odlDeviceList = await individualServices.getLiveDeviceList();        
    } catch (error) {
        console.log(error);
        return;
    }
    odlDeviceList = filterConnectedDevices(odlDeviceList);

    printLog('***************************************************************************', print_log_level >= 2);
    printLog('*                       DEVICE LIST REALIGNMENT', print_log_level >= 2);
    printLog('***************************************************************************', print_log_level >= 2);

    let esDeviceList = await individualServices.readDeviceListFromElasticsearch();
    //
    // Get the next element common to both the esDeviceList and odlDeviceList. 
    // This element will provide the index needed to split the commonElements list.
    //
    let elementFound = false;
    let nextElement;
    do {
        nextElement = esDeviceList[getNextDeviceListIndex()];
        for (let i = 0; i < odlDeviceList.length; i++) {
            if (nextElement == odlDeviceList[i]['node-id']) {
                elementFound = true;
                break;
            }
        }
    } while (elementFound == false);
    
    //
    // Drop all the control constructs from elasticsearch referring elements not more present in new odl device list
    //
    let commonElements = [];
    for (let i = 0; i < esDeviceList.length; i++) {
        let found = false;
        for (let j = 0; j < odlDeviceList.length; j++) {
            if (esDeviceList[i]['node-id'] == odlDeviceList[j]['node-id']) {
                found = true;
                commonElements.push(esDeviceList[i]['node-id']);
                break;
            }
        }
        if (!found) {
            let cc_id = esDeviceList[i]['node-id'];
            let ret = await individualServices.deleteRecordFromElasticsearch(7, '_doc', cc_id);
            printLog(ret.result, print_log_level >= 2);
        }
    }

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
    // Create the array of new elements from ODL-DL (not found in ES-DL)
    //
    let newElements = [];
    for (let i = 0; i < odlDeviceList.length; i++) {
        let found = false;
        for (let j = 0; j < esDeviceList.length; j++) {
            if (odlDeviceList[i]['node-id'] == esDeviceList[j]['node-id']) {
                found = true;
                break;
            }
        }
        if (!found) {
            newElements.push(odlDeviceList[i]['node-id']);
        }
    }
    newElements = shuffleArray(newElements);

    //
    // Split esDeviceList to insert newElements array inside
    //
    let nextElementFound = false;
    let newDeviceListLeft = [];
    let newDeviceListRight = [];
    for (let i = 0; i < esDeviceList.length; i++) {
        if (nextElement == esDeviceList[i]['node-id']) {
            nextElementFound = true
            // Update the lastDeviceListIndex: it must be relocated to the last element of newDeviceListLeft
            lastDeviceListIndex = i - 1;
        }
        if (nextElementFound == false) {
            newDeviceListLeft.push(esDeviceList[i]);
        } else {
            newDeviceListRight.push(esDeviceList[i]);
        }
    }
    deviceList = [].concat(newDeviceListLeft, newElements, newDeviceListRight);

    printLog(printList('Device List', deviceList), print_log_level >= 2);
    try {
        await individualServices.writeDeviceListToElasticsearch(JSON.stringify(deviceList));
    } catch (error) {
        console.log(error);
    }        
    
    // Fill the sliding window at the max allowed
    slidingWindowSize = (slidingWindowSizeDb > deviceList.length) ? deviceList.length : slidingWindowSizeDb;
    for (let i = slidingWindow.length; i < slidingWindowSize; i++) {
        addNextDeviceListElementInWindow();
    }
    return true
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
    
    async function extractProfileConfiguration(uuid) {
        const profileCollection = require('onf-core-model-ap/applicationPattern/onfModel/models/ProfileCollection');
        const profile = await profileCollection.getProfileAsync(uuid)
        return profile["integer-profile-1-0:integer-profile-pac"]["integer-profile-configuration"]["integer-value"]
    }
    
    slidingWindowSizeDb = await extractProfileConfiguration("mwdi-1-0-0-integer-p-000")
    responseTimeout = await extractProfileConfiguration("mwdi-1-0-0-integer-p-001")
    maximumNumberOfRetries = await extractProfileConfiguration("mwdi-1-0-0-integer-p-002")
    deviceListSyncPeriod = await extractProfileConfiguration("mwdi-1-0-0-integer-p-003") 
    
    print_log_level = logging_level;
    
    let odlDeviceList;
    try {
        odlDeviceList = await individualServices.getLiveDeviceList();        
    } catch (error) {
        console.log(error);
        return;
    }
    odlDeviceList = filterConnectedDevices(odlDeviceList);

    try {
        let elasticsearchList = await individualServices.readDeviceListFromElasticsearch();
        printLog(printList('Device List (ES)', elasticsearchList), print_log_level >= 1);
        // Delete from ES all the CC not found in ODL-DL and prepare the array of common elements starting ES elements previous shuffled
        let commonElements = [];
        for (let i = 0; i < elasticsearchList.length; i++) {
            let found = false;
            for (let j = 0; j < odlDeviceList.length; j++) {
                if (elasticsearchList[i]['node-id'] == odlDeviceList[j]['node-id']) {
                    found = true;
                    commonElements.push(elasticsearchList[i]['node-id']);
                    break;
                }
            }
            if (!found) {
                let cc_id = elasticsearchList[i]['node-id'];
                let ret = await individualServices.deleteRecordFromElasticsearch(7, '_doc', cc_id);
                printLog(ret.result, print_log_level >= 2);
            }
        } 

        // Create the array of new elements from ODL-DL (not found in ES-DL)
        let newElements = []
        for (let i = 0; i < odlDeviceList.length; i++) {
            let found = false;
            for (let j = 0; j < elasticsearchList.length; j++) {
                if (odlDeviceList[i]['node-id'] == elasticsearchList[j]['node-id']) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                newElements.push(odlDeviceList[i]['node-id'])
            }
        }
        newElements = shuffleArray(newElements);
        odlDeviceList = [].concat(newElements, commonElements);
        printLog("Update device list to elasticsearch", print_log_level >= 2)
    } catch (error) {
        console.log(error);
        odlDeviceList = shuffleArray(odlDeviceList);
        printLog("Write ODL device list shuffled to Elasticsearch", print_log_level >= 2);        
    }
    let odlDeviceListString = JSON.stringify(odlDeviceList);
    try {
        await individualServices.writeDeviceListToElasticsearch(odlDeviceListString);
    } catch (error) {
        console.log(error);        
    }
         
    deviceList = odlDeviceList;            
    slidingWindowSize = (slidingWindowSizeDb > deviceList.length) ? deviceList.length : slidingWindowSizeDb;
    printLog(printList('Device List', deviceList), print_log_level >= 1);

    lastDeviceListIndex = -1;
    for (let i = 0; i < slidingWindowSize; i++) {
        addNextDeviceListElementInWindow();
        requestMessage(i);
        printLog('Element ' + slidingWindow[i]['node-id'] + ' send request...', print_log_level >= 2);
    }
    
    //
    // Periodic Synchronization
    //
    // const cronTimeInterval = '* */' + deviceListSyncPeriod + ' * * *';
    const { deviceListSynchronization } = module.exports;
    const cronTimeInterval = '*/5 * * * *'
    const job = new CronJob(cronTimeInterval, function () {
        printLog('Device list synchronization in progress...', print_log_level >= 2);
        deviceListSynchronization();
    });            
    job.start();
    
    printLog(printList('Sliding Window', slidingWindow), print_log_level >= 1);
    startTtlChecking();
    return true;
}
