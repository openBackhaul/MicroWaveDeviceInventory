'use strict';

const { strict } = require('assert')

const ttlMax = 5;
const retriesMax = 1;
const slidingWindowSize = 4;
const DEVICE_NOT_PRESENT = -1;
let slidingWindow = [];
let deviceList = [];
let lastDeviceListIndex = -1;
let cycleLock = false;
let print_log = false;

/**
 * REST request simulator with random delay
 */
async function sendRequest(device) {
    try {
        await new Promise((resolve, reject) => {
            const delay = (Math.floor(Math.random() * 13) + 1);
            setTimeout(() => {
                printLog('Element ' + device['node-id'] + ' responded in ' + delay + 's');
                resolve();
            }, delay * 1000);
        })
        return device;
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
            "ttl"     : ttlMax,
            "retries" : retriesMax
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
function addNextDeviceListElementInWindow(endCyclePause) {
    try {
        let newDeviceListIndex = getNextDeviceListIndex();
        if (slidingWindow.length >= slidingWindowSize) {
            return false;
        }
        if (newDeviceListIndex == -1) {
            return false;
        }
        if (checkDeviceExistsInSlidingWindow(deviceList[newDeviceListIndex]['node-id']) != DEVICE_NOT_PRESENT) {
            return false;
        }
        slidingWindow.push(prepareObjectForWindow(newDeviceListIndex));
        if (newDeviceListIndex == deviceList.length - 1) {
            if (endCyclePause) {
                // .... azione da stabilire
            }
        } 
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
                if (lastDeviceListIndex > 0) {
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
 * Prints a consol log message only the print_log flag is enabled
 */
function printLog(text) {
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
        function upgradeTtl() {
            for (let index = 0; index < slidingWindow.length; index++) {
                slidingWindow[index].ttl -= 1;
                if (slidingWindow[index].ttl == 0) {
                    if (slidingWindow[index].retries == 0) {
                        printLog("Element " + slidingWindow[index]['node-id'] + " Timeout/Retries. -> Dropped from both Window and deviceList");
                        discardElementFromDeviceList(slidingWindow[index]['node-id']);
                        printLog(printList('Device List', deviceList));
                        slidingWindow.splice(index, 1);
                        if (!cycleLock) {
                            if (addNextDeviceListElementInWindow(false)) {
                                printLog('Added element ' + slidingWindow[slidingWindow.length - 1]['node-id'] + ' in window and sent request...');
                                printLog(printList('Sliding Window', slidingWindow));
                                requestMessage(slidingWindow.length-1);
                            }
                        }
                    } else {
                        slidingWindow[index].ttl = ttlMax;
                        slidingWindow[index].retries -= 1;
                        printLog("Element " + slidingWindow[index]['node-id'] + " Timeout. -> Resend the request...");
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
        
        sendRequest(slidingWindow[index]).then(device => {
            let elementIndex = checkDeviceExistsInSlidingWindow(device['node-id']);
            if (elementIndex != DEVICE_NOT_PRESENT) {
                printLog('Response from element ' + device['node-id'] + ' --> Dropped from Sliding Window. Timestamp: ' + Date.now());
                slidingWindow.splice(elementIndex, 1) ;
                setDeviceListElementTimeStamp(device['node-id']);
                if (!cycleLock) {
                    if (addNextDeviceListElementInWindow(false)) {
                        printLog('Add element ' + slidingWindow[slidingWindow.length - 1]['node-id'] + ' in Sliding Window and send request...');
                        printLog(printList('Sliding Window', slidingWindow));
                        requestMessage(slidingWindow.length-1);
                    }
                }
            } else {
                printLog('Response from element ' + device['node-id'] + ' not more present in Sliding Window. Ignore that.');
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
module.exports.deviceListSynchronization = async function deviceListSynchronization(newDeviceList) {
    try {
        printLog(printList('Device List', deviceList));
        printLog('***************************************************************************');
        printLog('*                       DEVICE LIST REALIGNMENT');
        printLog('***************************************************************************');
        cycleLock = true;       
        printLog(printList('New Device List', newDeviceList));

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

        // Creation of a tail device list with all the elements from
        // device list with defined time stamp then sort that ascending
        let tailDeviceList = []
        for (let i = 0; i < deviceList.length; i++) {
            if (deviceList[i]['timestamp']) {
                tailDeviceList.push(deviceList[i]);
            }
        }
        tailDeviceList.sort((a, b) => (a.timestamp - b.timestamp));
        
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
        printLog(printList('Device List', deviceList));

        // Fill the sliding window at the max allowed
        for (let i = slidingWindow.length; i < slidingWindowSize; i++) {
            for (let j = 0; j < deviceList.length; j++) {
                if (checkDeviceExistsInSlidingWindow(deviceList[j]['node-id']) == DEVICE_NOT_PRESENT) {
                    slidingWindow.push(prepareObjectForWindow(j));
                    lastDeviceListIndex = j;
                    printLog('Filled sliding window with ' + slidingWindow[slidingWindow.length - 1]['node-id'] + ' then send request...');
                    printLog(printList('Sliding Window', slidingWindow));
                    requestMessage(slidingWindow.length-1);
                    break;
                }
            }
        }
        
        cycleLock = false;

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
module.exports.startCyclicProcess = async function startCyclicProcess(logging, newDeviceList) {    
    try {
        print_log = logging;
        if (newDeviceList) {
            deviceList = newDeviceList;
            printLog(printList('Device List', deviceList));
            lastDeviceListIndex = -1;
            for (let i = 0; i < slidingWindowSize; i++) {
                addNextDeviceListElementInWindow(false);
                requestMessage(i);
                printLog('Element ' + slidingWindow[i]['node-id'] + ' send request...');
            }
        }
        printLog(printList('Sliding Window', slidingWindow));
        startTtlChecking(false);
    } catch(error) {
        console.log('Error in startCyclingProcess: ' + error);
        debugger;
    }    
}
