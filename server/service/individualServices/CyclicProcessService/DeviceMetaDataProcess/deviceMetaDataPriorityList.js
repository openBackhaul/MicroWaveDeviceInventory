'use strict';
/**
 * This class includes functions that shall be accessed to process the DeviceMetadataPriorityList
 * This class handles following five parameters
 * 
 * @param {String} "mount-name" - node-id
 * @param {String} "last-complete-control-construct-update-time-attempt" - this contains timestamp of last attempt to CC retrival / doesnot matter if it is success/failure
 * @param {String} "connection-status" - connection-status of a device to controller
 * @param {Boolean} "locked-status" - true if it is processed in sliding window
 * @param {Boolean} "exclude-from-qm" - true if this does not have successful CC retrieved in history to compare
 * @property {Boolean} "cc-synced" - this attribute is set to true if CC has been updated in this cycle. 
 *                                      false if new cycle started and all devices in meta-data list shall be synced with cc
 */
class DeviceMetaDataPriorityList {
    constructor() {
        this.deviceMetadataPriorityList = [];
    }

    // Add or update a device
    createOrUpdateDevice(deviceMetadataToBeUpdated) {
        try {
            // Ensure required fields exist
            if (!deviceMetadataToBeUpdated["mount-name"]) {
                throw new Error(`"mount-name" is required `);
            }
            let deviceMetadata = {};
            // Default values
            deviceMetadata["mount-name"] = deviceMetadataToBeUpdated["mount-name"];

            const index = this.deviceMetadataPriorityList.findIndex(d => d["mount-name"] === deviceMetadata["mount-name"]);

            if (index > -1) {
                // update existing
                if (deviceMetadataToBeUpdated["last-complete-control-construct-update-time-attempt"]) {
                    deviceMetadata["last-complete-control-construct-update-time-attempt"] = deviceMetadataToBeUpdated["last-complete-control-construct-update-time-attempt"];
                } else {
                    (this.deviceMetadataPriorityList[index]["last-complete-control-construct-update-time-attempt"]) ? deviceMetadata["last-complete-control-construct-update-time-attempt"] = this.deviceMetadataPriorityList[index]["last-complete-control-construct-update-time-attempt"] : new Date("01-01-1997").toJSON();
                }

                if (deviceMetadataToBeUpdated["connection-status"]) {
                    deviceMetadata["connection-status"] = deviceMetadataToBeUpdated["connection-status"];
                } else {
                    (this.deviceMetadataPriorityList[index]["connection-status"]) ? (deviceMetadata["connection-status"] = this.deviceMetadataPriorityList[index]["connection-status"]) : "unknown";
                }

                if (deviceMetadataToBeUpdated["locked-status"]) deviceMetadata["locked-status"] = deviceMetadataToBeUpdated["locked-status"];
                if (deviceMetadataToBeUpdated["exclude-from-qm"]) deviceMetadata["exclude-from-qm"] = deviceMetadataToBeUpdated["exclude-from-qm"];
                if (deviceMetadataToBeUpdated["cc-synced"]) deviceMetadata["cc-synced"] = deviceMetadataToBeUpdated["cc-synced"]
                this.deviceMetadataPriorityList[index] = { ...this.deviceMetadataPriorityList[index], ...deviceMetadata };
                //check conditions for three attributes
            } else {
                // insert new
                deviceMetadata["last-complete-control-construct-update-time-attempt"] = deviceMetadataToBeUpdated["last-complete-control-construct-update-time-attempt"] || new Date("01-01-1997").toJSON();
                deviceMetadata["connection-status"] = deviceMetadataToBeUpdated["connection-status"] || "unknown";
                deviceMetadata["locked-status"] = deviceMetadataToBeUpdated["locked-status"] || false;
                deviceMetadata["exclude-from-qm"] = deviceMetadataToBeUpdated["exclude-from-qm"] || true;
                deviceMetadata["cc-synced"] = deviceMetadataToBeUpdated["cc-synced"] || false;
                this.deviceMetadataPriorityList.push(deviceMetadata);
            }
            this.sortDevices();
            return;
        }
        catch (error) {
            throw error;
        }
    }

    // Sort devices: connected first, oldest timestamp first
    sortDevices() {
        try {
            this.deviceMetadataPriorityList.sort((a, b) => {
                if (a["connection-status"] !== b["connection-status"]) {
                    return a["connection-status"] === "connected" ? -1 : 1;
                }
                let atimestamp = new Date(a["last-complete-control-construct-update-time-attempt"]).getTime() || 0;
                let btimestamp = new Date(b["last-complete-control-construct-update-time-attempt"]).getTime() || 0;
                return atimestamp - btimestamp;
            });
        } catch (error) {
            throw error;
        }
    }

    // Get next device to process
    getNextDeviceMetaData() {
        try {
            if (this.deviceMetadataPriorityList.length > 0) {
                let nextDevice = this.deviceMetadataPriorityList.find(d => {
                    return (d["connection-status"] == "connected" && d["locked-status"] == false && d["cc-synced"] == false);
                })
                return nextDevice;
            }
        } catch (error) {
            throw error;
        }
    }

    // Get next device to process for quality-measurement process
    getNextDeviceMetaDataForQm() {
        try {
            if (this.deviceMetadataPriorityList.length > 0) {
                return this.deviceMetadataPriorityList.find(d => {
                    return d["connection-status"] == "connected" && d["locked-status"] == false && d["exclude-from-qm"] == false
                })
            }
        } catch (error) {
            throw error;
        }
    }

    // returns all device metadata stored in list
    getAllDeviceMetaData() {
        try {
            return [...this.deviceMetadataPriorityList];
        } catch (error) {
            throw error;
        }
    }

    // remove metadata for given node-id
    removeMetaDataOfDevice(mountName) {
        try {
            this.deviceMetadataPriorityList = this.deviceMetadataPriorityList.filter(d => d["mount-name"] !== mountName);
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    // reset cc-synced attribute of all device's metadata to false
    // this is expected to be called in start of all cycle
    resetCCSyncedOfAllDevices() {
        try {
            this.deviceMetadataPriorityList = this.deviceMetadataPriorityList.map(d => ({
                ...d,
                "cc-synced": false
            }));
        } catch (error) {
            throw error;
        }
    }

    // get cc-synced attribute of given mount-name
    getCcSyncedOfDevice(mountName) {
        try {
            let device = this.deviceMetadataPriorityList.find(d => d["mount-name"] === mountName);
            if (device) return device["cc-synced"];
            else { throw `device-metadata for given node: ${mountName} not found` };
        } catch (error) {
            throw error;
        }
    }

    // set cc-synced attribute of given mount-name
    setCcSyncedOfDevice(mountName, value) {
        try {
            let deviceMetaData = this.deviceMetadataPriorityList.find(d => d["mount-name"] === mountName);
            if (deviceMetaData) deviceMetaData["cc-synced"] = value;
            return;
        } catch (error) {
            throw error;
        }
    }

    // get locked-status attribute of given mount-name
    getLockedStatusOfDevice(mountName) {
        try {
            let device = this.deviceMetadataPriorityList.find(d => d["mount-name"] === mountName);
            if (device) return device["locked-status"];
            else { throw `device-metadata for given node: ${mountName} not found` };
        } catch (error) {
            throw error;
        }
    }

    // set locked-status attribute of given mount-name
    setLockedStatusOfDevice(mountName, value) {
        try {
            let deviceMetaData = this.deviceMetadataPriorityList.find(d => d["mount-name"] === mountName);
            if (deviceMetaData) deviceMetaData["locked-status"] = value;
            return;
        } catch (error) {
            throw error;
        }
    }

    // get exclude-from-qm attribute of given mount-name
    getExcludeFromQmOfDevice(mountName) {
        try {
            let device = this.deviceMetadataPriorityList.find(d => d["mount-name"] === mountName);
            if (device) return device["exclude-from-qm"];
            else { throw `device-metadata for given node: ${mountName} not found` };
        } catch (error) {
            throw error;
        }
    }

    // set exclude-from-qm attribute of given mount-name
    setExcludeFromQmOfDevice(mountName, value) {
        try {
            let deviceMetaData = this.deviceMetadataPriorityList.find(d => d["mount-name"] === mountName);
            if (deviceMetaData) deviceMetaData["exclude-from-qm"] = value;
            return;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new DeviceMetaDataPriorityList();