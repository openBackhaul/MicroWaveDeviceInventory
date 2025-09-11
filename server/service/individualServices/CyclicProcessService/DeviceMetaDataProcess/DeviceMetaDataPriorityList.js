'use strict';
const level = require('level');

// Open or create a LevelDB database folder
const db = level('./deviceMetaDB', { valueEncoding: 'json' });

class DeviceMetaDataPriorityList {
    constructor() {
        // No in-memory array; storage is LevelDB
    }

    // Add or update a device
    async createOrUpdateDevice(deviceMetadataToBeUpdated) {
        try {
            if (!deviceMetadataToBeUpdated["mount-name"]) {
                throw new Error(`"mount-name" is required`);
            }

            // Get existing device if it exists
            let existingDevice;
            try {
                existingDevice = await db.get(deviceMetadataToBeUpdated["mount-name"]);
            } catch (err) {
                existingDevice = null; // not found
            }

            let deviceMetadata = {};

            // Merge defaults with existing values if any
            deviceMetadata["mount-name"] = deviceMetadataToBeUpdated["mount-name"];
            deviceMetadata["last-complete-control-construct-update-time-attempt"] =
                deviceMetadataToBeUpdated["last-complete-control-construct-update-time-attempt"] ||
                (existingDevice ? existingDevice["last-complete-control-construct-update-time-attempt"] : new Date("01-01-1997").toJSON());
            deviceMetadata["connection-status"] =
                deviceMetadataToBeUpdated["connection-status"] ||
                (existingDevice ? existingDevice["connection-status"] : "unknown");
            deviceMetadata["locked-status"] =
                deviceMetadataToBeUpdated["locked-status"] ?? (existingDevice ? existingDevice["locked-status"] : false);
            deviceMetadata["exclude-from-qm"] =
                deviceMetadataToBeUpdated["exclude-from-qm"] ?? (existingDevice ? existingDevice["exclude-from-qm"] : true);
            deviceMetadata["cc-synced"] =
                deviceMetadataToBeUpdated["cc-synced"] ?? (existingDevice ? existingDevice["cc-synced"] : false);

            await db.put(deviceMetadata["mount-name"], deviceMetadata);

        } catch (error) {
            throw error;
        }
    }

    // Fetch all devices and sort: connected first, then oldest timestamp
    async getAllDeviceMetaData() {
        const devices = [];
        for await (const [key, value] of db.iterator()) {
            devices.push(value);
        }
        // Apply sorting logic
        return devices.sort((a, b) => {
            if (a["connection-status"] !== b["connection-status"]) {
                return a["connection-status"] === "connected" ? -1 : 1;
            }
            let at = new Date(a["last-complete-control-construct-update-time-attempt"]).getTime() || 0;
            let bt = new Date(b["last-complete-control-construct-update-time-attempt"]).getTime() || 0;
            return at - bt;
        });
    }

    async sortDevices() {
        // Sorting is applied on fetch, so nothing required here
    }

    async getNextDeviceMetaData() {
        const devices = await this.getAllDeviceMetaData();
        return devices.find(d =>
            d["connection-status"] === "connected" &&
            d["locked-status"] === false &&
            d["cc-synced"] === false
        );
    }

    async getNextDeviceMetaDataForQm() {
        const devices = await this.getAllDeviceMetaData();
        return devices.find(d =>
            d["connection-status"] === "connected" &&
            d["locked-status"] === false &&
            d["exclude-from-qm"] === false
        );
    }

    async removeMetaDataOfDevice(mountName) {
        try {
            await db.del(mountName);
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    async resetCCSyncedOfAllDevices() {
        const devices = await this.getAllDeviceMetaData();
        for (let d of devices) {
            d["cc-synced"] = false;
            await db.put(d["mount-name"], d);
        }
    }

    async getCcSyncedOfDevice(mountName) {
        try {
            const device = await db.get(mountName);
            return device["cc-synced"];
        } catch (error) {
            throw `device-metadata for given node: ${mountName} not found`;
        }
    }

    async setCcSyncedOfDevice(mountName, value) {
        try {
            const device = await db.get(mountName);
            device["cc-synced"] = value;
            await db.put(mountName, device);
        } catch (error) {
            throw error;
        }
    }

    async getLockedStatusOfDevice(mountName) {
        try {
            const device = await db.get(mountName);
            return device["locked-status"];
        } catch (error) {
            throw `device-metadata for given node: ${mountName} not found`;
        }
    }

    async setLockedStatusOfDevice(mountName, value) {
        try {
            const device = await db.get(mountName);
            device["locked-status"] = value;
            await db.put(mountName, device);
        } catch (error) {
            throw error;
        }
    }

    async getExcludeFromQmOfDevice(mountName) {
        try {
            const device = await db.get(mountName);
            return device["exclude-from-qm"];
        } catch (error) {
            throw `device-metadata for given node: ${mountName} not found`;
        }
    }

    async setExcludeFromQmOfDevice(mountName, value) {
        try {
            const device = await db.get(mountName);
            device["exclude-from-qm"] = value;
            await db.put(mountName, device);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new DeviceMetaDataPriorityList();
