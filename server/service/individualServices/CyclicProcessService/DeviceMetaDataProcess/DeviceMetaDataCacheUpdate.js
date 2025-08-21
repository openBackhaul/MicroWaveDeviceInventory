'use strict';

const deviceMetaDataUtility = require('./deviceMetaDataUtility');
let deviceMetadataListSyncProcessId = 0;
/**
 * This class includes functions that shall be accessed to process the deviceMetaDataList in cache
 * This class handles following five parameters
 * 
 * @param {String} "mount-name" - node-id
 * @param {String} "connection-status" - connection-status of a device to controller
 * @param {String} "last-complete-control-construct-update-time-attempt" - this contains timestamp of last attempt to CC retrival / doesnot matter if it is success/failure
 * @param {String} "changed-to-disconnected-time" - time when the device goes to disconnected state
 * @param {String} "added-to-device-list-time" - the time when the device is added to device-metadata list for the first time
 * @param {String} "last-successful-complete-control-construct-update-time" - the time when a connected device's CC is updated successfully to ES
 * @param {String} "last-control-construct-notification-update-time" - the time when a CC in ES is partially updated by notification
 * @param {Number} "number-of-partial-updates-since-last-complete-update" - the total count of CC attributes changes after coming to connection status. This is triggered by notifications
 * @param {Object} "schema-cache-directory" - retrieved from netconf request
 * @param {Boolean} "locked-status" - true if it is processed in sliding window
 * @param {Boolean} "exclude-from-qm" - true if this does not have successful CC retrieved in history to compare
 * @property {Boolean} "cc-synced" - this attribute is set to true if CC has been updated in this cycle. 
 *                                      false if new cycle started and all devices in meta-data list shall be synced with cc
 */
class DeviceMetaDataList {
    constructor() {
        this.deviceMetaDataList = [];
    }

    // creates or updates metadata
    createOrUpdateDeviceMetaData(deviceMetaData) {
        try {
            if (Array.isArray(deviceMetaData)) {
                deviceMetaData.forEach(device => {
                    const index = this.deviceMetaDataList.findIndex(d => d["mount-name"] === device["mount-name"]);
                    if (index > -1) {
                        this.deviceMetaDataList[index] = { ...this.deviceMetaDataList[index], ...device };
                    } else {
                        this.deviceMetaDataList.push(device);
                    }
                });
            } else {
                const index = this.deviceMetaDataList.findIndex(d => d["mount-name"] === deviceMetaData["mount-name"]);
                if (index > -1) {
                    this.deviceMetaDataList[index] = { ...this.deviceMetaDataList[index], ...deviceMetaData };
                } else {
                    this.deviceMetaDataList.push(deviceMetaData);
                }
            }
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    //remove metadata from list
    removeDevicemetadata(mountName) {
        try {
            this.deviceMetaDataList = this.deviceMetaDataList.filter(d => d["mount-name"] !== mountName);
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    // returns the list of all metadata 
    getDeviceMetaDataList() {
        return [...this.deviceMetaDataList];
    }

    // returns metadata object for given node-id
    getDeviceMetaData(nodeId) {
        try {
            if (this.deviceMetaDataList.length > 0) {
                let device = this.deviceMetaDataList.find(d => d["mount-name"] == nodeId)
                return device;
            }
        } catch (error) {
            throw error;
        }
    }

    // updates "last-complete-control-construct-update-time-attempt" for given node-id
    setLastCompleteControlConstructUpdateTimeAttempt(nodeId, newTime) {
        try {
            let data = this.deviceMetaDataList.find(d => d["mount-name"] === nodeId);
            if (data) data["last-complete-control-construct-update-time-attempt"] = newTime;
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    // updates "last-successful-complete-control-construct-update-time" for given nodeId
    setLastSuccessfulCompleteControlConstructUpdateTime(nodeId, newTime) {
        try {
            let data = this.deviceMetaDataList.find(d => d["mount-name"] === nodeId);
            if (data) data["last-successful-complete-control-construct-update-time"] = newTime;
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    // updates "last-control-construct-notification-update-time" for given nodeId
    setLastControlConstructNotificationUpdateTime(nodeId, newTime) {
        try {
            let data = this.deviceMetaDataList.find(d => d["mount-name"] === nodeId);
            if (data) data["last-control-construct-notification-update-time"] = newTime;
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    // updates "number-of-partial-updates-since-last-complete-update" for given nodeId
    updateNumberOfPartialUpdatesSinceLastCompleteUpdate(nodeId) {
        try {
            let data = this.deviceMetaDataList.find(d => d["mount-name"] === nodeId);
            if (data) if (data["number-of-partial-updates-since-last-complete-update"] >= 0) {
                data["number-of-partial-updates-since-last-complete-update"] = data["number-of-partial-updates-since-last-complete-update"] + 1;
            } else {
                data["number-of-partial-updates-since-last-complete-update"] = 0;
            }
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
}

// creates object for the above class
const deviceMetaDataObj = new DeviceMetaDataList();

/** 
 * This function updates device-metadata for partial updates due to notification
 */
deviceMetaDataObj.updateMDForPartialCCUpdate = async function (mountName, timestamp) {
    let result = false;
    try {
        result = await deviceMetaDataObj.setLastControlConstructNotificationUpdateTime(mountName, timestamp);
        if (result) result = await deviceMetaDataObj.updateNumberOfPartialUpdatesSinceLastCompleteUpdate(mountName);
        if(result) result = await deviceMetaDataObj.deviceMetaDataListSync();
        if(result) console.log(`******************* partial update for ${mountName} success *************************`);
        return result;
    } catch (error) {
        console.log(error);
    }
}

/** starts the cyclic process to update deviceMetaList to ES
 * 
 * @param {List} deviceMetaDataList - list of device-metadata
 * 
 */
deviceMetaDataObj.startDeviceMetaDatacaching = async function (deviceMetaDataList) {
    try {
        await deviceMetaDataObj.createOrUpdateDeviceMetaData(deviceMetaDataList);
        let timeIntervalForSyncingDevicemetaDataInCache = 5 * 60 * 60 * 1000;
        deviceMetadataListSyncProcessId = setInterval(deviceMetaDataObj.deviceMetaDataListSync, timeIntervalForSyncingDevicemetaDataInCache);
    } catch (error) {
        console.log(error);
    }
}

/** 
 * This function writes deviceMetaList to ES
 */
deviceMetaDataObj.deviceMetaDataListSync = async function () {
    try {
        let deviceMetadatalist = await deviceMetaDataObj.getDeviceMetaDataList();
        let result = await deviceMetaDataUtility.writeDeviceMetaDataListToElasticsearch(JSON.stringify(deviceMetadatalist));
        if (result) {
            console.log("*************************************** WRITE DEVICE-METADATA TO ES SUCCESS **************************************************");
        } else {
            console.log("*************************************** WRITE DEVICE-METADATA TO ES FAIL **************************************************");
        }
        return result;
    } catch (error) {
        console.log(error);
    }
}

/**
 * Stops the cyclic process disabling the time to live check the meta-data list
 **/
deviceMetaDataObj.stopMetaDataCachingCyclicProcess = async function stopMetaDataCachingCyclicProcess() {

    console.log('*******************************************************************************************************');
    console.log('*                             METADATA UPDATING CYCLIC PROCESS PROCEDURE IN CACHE STOPPED                      *');
    console.log('*                                                                                                     *');
    console.log('*                                 ( ' + utility.getTime() + ' )                                               *');
    console.log('*                                                                                                     *');
    console.log('*******************************************************************************************************');

    clearInterval(deviceMetadataListSyncProcessId);
}

module.exports = deviceMetaDataObj;