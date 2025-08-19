/**
 * This class includes functions that shall be accessed to process the DeviceMetadataPriorityList
 * This class handles following five parameters
 * 
 * @param {String} "mount-name" - node-id
 * @param {String} "last-complete-control-construct-update-time-attempt" - this contains timestamp of last attempt to CC retrival / doesnot matter if it is success/failure
 * @param {String} "connection-status" - connection-status of a device to controller
 * @param {String} "locked-status" - true if it is processed in sliding window
 * @param {String} "exclude-from-qm" - true if this does not have successful CC retrieved in history to compare
 */
class DeviceMetadataPriorityList {
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
            deviceMetadata["last-complete-control-construct-update-time-attempt"] = deviceMetadataToBeUpdated["last-complete-control-construct-update-time-attempt"] || new Date("01-01-1997").toJSON();
            deviceMetadata["connection-status"] = deviceMetadataToBeUpdated["connection-status"] || "unknown";
            deviceMetadata["locked-status"] = deviceMetadataToBeUpdated["locked-status"] || false;
            deviceMetadata["exclude-from-qm"] = deviceMetadataToBeUpdated["exclude-from-qm"] || true;

            const index = this.deviceMetadataPriorityList.findIndex(d => d["mount-name"] === deviceMetadata["mount-name"]);

            if (index > -1) {
                // update existing
                this.deviceMetadataPriorityList[index] = { ...this.deviceMetadataPriorityList[index], ...deviceMetadata };
            } else {
                // insert new
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
                return this.deviceMetadataPriorityList.find(d=> {
                    d["connection-status"] == "connected" && d["locked-status"] == false 
                })
            }
        } catch (error) {
            throw error;
        }
    }

    // Get next device to process for quality-measurement process
    getNextDeviceMetaDataForQm() {
        try {
            if (this.deviceMetadataPriorityList.length > 0) {
                return this.deviceMetadataPriorityList.find(d=> {
                    d["connection-status"] == "connected" && d["locked-status"] == false && d["exclude-from-qm"] == false 
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
        } catch (error) {
            throw error;
        }
    }

}

module.exports = new DeviceMetadataPriorityList();