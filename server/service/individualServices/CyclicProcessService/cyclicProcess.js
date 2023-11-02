'use strict';

const { strict } = require('assert');
const { setTimeout } = require('timers');
const path = require("path");
const individualServices = require( "../../IndividualServicesService.js");

const DEVICE_NOT_PRESENT = -1;
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

/**
 * Realigns the current device list with the new one 
 * 
 * newDeviceList is the new device list that update the old one. It's mandatory.
 */
module.exports.deviceListSynchronization = async function deviceListSynchronization() {
    try {
        let newDeviceList = await individualServices.getLiveDeviceList();
        if (newDeviceList == false) {
            return false;
        }

        slidingWindowSize = (slidingWindowSizeDb > deviceList.length) ? deviceList.length : slidingWindowSizeDb;
        
        printLog(printList('Device List', deviceList), print_log_level >= 2);
        printLog('***************************************************************************', print_log_level >= 2);
        printLog('*                       DEVICE LIST REALIGNMENT', print_log_level >= 2);
        printLog('***************************************************************************', print_log_level >= 2);
        printLog(printList('New Device List', newDeviceList), print_log_level >= 2);

        // Drop all the sliding window elements not more present in new device list
        for (let i = 0; i < slidingWindow.length; ) {
            let found = false;
            for (let j = 0; j < newDeviceList.length; j++) {                
                if (slidingWindow[i]['node-id'] == newDeviceList[j]['node-id']) {
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

        // Drop all the device list elements not more present in new device list
        for (let i = 0; i < deviceList.length; ) {
            let found = false;
            for (let j = 0; j < newDeviceList.length; j++) {                
                if (deviceList[i]['node-id'] == newDeviceList[j]['node-id']) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                deviceList.splice(i, 1);
            } else {
                i++;
            }
        }

        // Drop all the device list and new device list elements present in sliding window
        for (let i = 0; i < deviceList.length; ) {
            let found = false;
            for (let j = 0; j < slidingWindow.length; j++) {                
                if (deviceList[i]['node-id'] == slidingWindow[j]['node-id']) {
                    found = true;
                    break;
                }
            }
            if (found) {
                deviceList.splice(i, 1);
            } else {
                i++;
            }
        }

        // Drop all the new device list elements present in sliding window
        for (let i = 0; i < newDeviceList.length; ) {
            let found = false;
            for (let j = 0; j < slidingWindow.length; j++) {                
                if (newDeviceList[i]['node-id'] == slidingWindow[j]['node-id']) {
                    found = true;
                    break;
                }
            }
            if (found) {
                newDeviceList.splice(i, 1);
            } else {
                i++;
            }
        }

        // Creation of a tail device list with all the elements from:
        // (1) all the sliding window elements (waiting a response)
        // (2) device list with defined time stamp not present in device list sorted ascending
        let tailDeviceList = []
        for (let i = 0; i < deviceList.length; i++) {
            if (deviceList[i]['timestamp']) {
                tailDeviceList.push(deviceList[i]);
            }
        }
        tailDeviceList.sort((a, b) => (a.timestamp - b.timestamp));
        tailDeviceList = [].concat(tailDeviceList, slidingWindow);

        // Creation of middle device list with all the new
        // device list elements not present in device list
        let middleDeviceList = [];
        for (let i = 0; i < newDeviceList.length; i++) {
            let found = false;
            for (let j = 0; j < deviceList.length; j++) {
                if (newDeviceList[i]['node-id'] == deviceList[j]['node-id']) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                middleDeviceList.push(newDeviceList[i]);
            }
        }

        // Creation of head device list with all the 
        // device list elements with timestamp not defined
        let headDeviceList = [];
        for (let i = 0; i < deviceList.length; i++) {
            if (deviceList[i]['timestamp'] == undefined) {
                headDeviceList.push(deviceList[i]);
            }
        }

        // Update the device list composing the three lists above
        deviceList = [].concat(headDeviceList, middleDeviceList, tailDeviceList);
        printLog(printList('Device List', deviceList), print_log_level >= 2);

        // Fill the sliding window at the max allowed
        let slidingWindowFilled = false
        for (let i = slidingWindow.length; i < slidingWindowSize; i++) {
            for (let j = 0; j < deviceList.length; j++) {
                if (checkDeviceExistsInSlidingWindow(deviceList[j]['node-id']) == DEVICE_NOT_PRESENT) {
                    slidingWindow.push(prepareObjectForWindow(j));
                    lastDeviceListIndex = j;
                    printLog('Filled sliding window with ' + slidingWindow[slidingWindow.length - 1]['node-id'] + ' then send request...', print_log_level >= 2);
                    printLog(printList('Sliding Window', slidingWindow), print_log_level >= 1);
                    requestMessage(slidingWindow.length-1);
                    slidingWindowFilled = true;
                    break;
                }
            }
        }
        if (!slidingWindowFilled) {
            lastDeviceListIndex = -1;
        }        
        return true;
    } catch(error) {
        console.log('Error in realignDeviceList: ' + error);
        debugger;
    }
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
    try {
        async function extractProfileConfiguration(uuid) {
            const profileCollection = require('onf-core-model-ap/applicationPattern/onfModel/models/ProfileCollection');
            const profile = await profileCollection.getProfileAsync(uuid)
            return profile["integer-profile-1-0:integer-profile-pac"]["integer-profile-configuration"]["integer-value"]
        }
        
        function filterConnectedDevices(deviceList){
            return deviceList.filter(device =>{
                return device['netconf-node-topology:connection-status'] === 'connected';
            })
        }

        slidingWindowSizeDb = await extractProfileConfiguration("mwdi-1-0-0-integer-p-000")
        responseTimeout = await extractProfileConfiguration("mwdi-1-0-0-integer-p-001")
        maximumNumberOfRetries = await extractProfileConfiguration("mwdi-1-0-0-integer-p-002")

        print_log_level = logging_level;
        let odlDeviceList = await individualServices.getLiveDeviceList();
        
        if (odlDeviceList == false) {
            return false;
        } else {
            odlDeviceList = filterConnectedDevices(odlDeviceList);

            let elasticsearchList = await individualServices.readDeviceListFromElasticsearch();
            if (elasticsearchList == undefined) {
                let odlDeviceListString = JSON.stringify(odlDeviceList);
                let result = await individualServices.writeDeviceListToElasticsearch(odlDeviceListString);
            } else {
                // Comparison logic (to do)

                // For this release overwrite 
                let odlDeviceListString = JSON.stringify(odlDeviceList);
                let result = await individualServices.writeDeviceListToElasticsearch(odlDeviceListString);
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
        }
        printLog(printList('Sliding Window', slidingWindow), print_log_level >= 1);
        startTtlChecking();
        return true;
    } catch(error) {
        console.log('Error in startCyclingProcess: ' + error);
        debugger;
    }    
}
