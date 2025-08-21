'use strict';

const utility = require('../../utility');
const integerProfile = require('onf-core-model-ap/applicationPattern/onfModel/models/profile/IntegerProfile');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const deviceControlConstructUtility = require('./deviceControlConstructUtility');
const deviceMetaDataPriorityList = require('./DeviceMetaDataPriorityList');
const deviceMetadataCacheUpdate = require('./DeviceMetaDataCacheUpdate');

let slidingWindowSize = 0;
let responseTimeOut = 0;
let maximumNumberOfRetries = 0;
let slidingWindowRunner = undefined;

/**
 * This class holds the logic of sliding window style of CC sync from live to cache
 */
class SlidingWindow {
    constructor(getNextDevice) {
        this.getNextDevice = getNextDevice;
        this.slidingWindowSize = slidingWindowSize;

        this.active = 0;
        this.stopped = false;

        // starts the sliding window
        this.startDeviceSyncProcess();
    }

    async startDeviceSyncProcess() {
        try {
            /**
             * active - number of devices currently under process
             * 
             */
            while (this.active < this.slidingWindowSize && !this.stopped) {
                const device = await this.getNextDevice();
                if (!device) {
                    // queue empty → retry later
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    break;
                }

                this.active++;
                // locking the device for syncing live CC to ES
                await deviceMetaDataPriorityList.setLockedStatusOfDevice(device["mount-name"], true);
                // start syncing live CC to ES
                deviceControlConstructUtility.syncControllerCcToEs(device["mount-name"], responseTimeOut, maximumNumberOfRetries)
                    .then(async (response) => {
                        if (response) {
                            let currentTime = new Date().toJSON();
                            device["last-complete-control-construct-update-time-attempt"] = currentTime;
                            device["locked-status"] = false;
                            device["exclude-from-qm"] = false;
                            device["cc-synced"] = true;
                            await deviceMetaDataPriorityList.createOrUpdateDevice(device);
                            await deviceMetadataCacheUpdate.setLastCompleteControlConstructUpdateTimeAttempt(device["mount-name"], currentTime);
                            await deviceMetadataCacheUpdate.setLastSuccessfulCompleteControlConstructUpdateTime(device["mount-name"], currentTime);

                            // update Metadata in ES for last-cc-successful and attempt
                        } else {
                            device["last-complete-control-construct-update-time-attempt"] = new Date().toJSON();
                            device["locked-status"] = false;
                            device["cc-synced"] = false;
                            await deviceMetadataCacheUpdate.setLastCompleteControlConstructUpdateTimeAttempt(device["mount-name"], currentTime);
                            await deviceMetaDataPriorityList.createOrUpdateDevice(device);
                        }
                    })
                    .catch((err) => console.error(`Error processing ${device}`, err))
                    .finally(() => {
                        this.active--;
                        if (!this.stopped) {
                            this.startDeviceSyncProcess();
                        }
                    });
            }

            if (!this.stopped) setTimeout(() => this.startDeviceSyncProcess(), 2000);
        } catch (error) {
            console.log(error);
            this.stop();
        }
    }

    stop() {
        console.log('Stop requested...');
        this.stopped = true;
    }
}

/**
 * This function returns next eligible device for syncing CC from live to cache
 */
async function getNextDeviceMetaDataLocal() {
    try {
        let device = await deviceMetaDataPriorityList.getNextDeviceMetaData();
        return device;
    } catch(error) {
        console.log(error);
        return {};
    }
}

/**
 * This function shall be called in order to stop sliding window runner
 */
exports.stopSlidingWindowProcessForCCUpdate = async function () {
    try {
        if (slidingWindowRunner) {
            console.log("*********************** Terminating the existing sliding window process for starting new pocess *************************");
            await slidingWindowRunner.stop();
            slidingWindowRunner = undefined;
            //setting cc-syned of all devices to false - to enable fresh retrieval for this cycle.
            await deviceMetaDataPriorityList.resetCCSyncedOfAllDevices();
        }
    } catch (error) {
        console.log(error);
    }
    return true;
}

/**
 * This function shall be called in order to start sliding window style of retrieval
 */
exports.startSlidingWindowProcessForCCUpdate = async function () {
    try {
        console.log('*******************************************************************************************************');
        console.log('*                             ControlConstruct Update in SLIDING-WINDOW PROCESS PROCEDURE STARTED           *');
        console.log('*                                                                                                     *');
        console.log('*                                 ( ' + utility.getTime() + ' )                                             *');
        console.log('*                                                                                                     *');
        console.log('*******************************************************************************************************');
        if (slidingWindowRunner) {
            await exports.stopSlidingWindowProcessForCCUpdate();
        } else {
            await initializeDependentIntegerValues();
            slidingWindowRunner = new SlidingWindow(getNextDeviceMetaDataLocal);
        }
    } catch (error) {
        console.log(error);
    }
}

// calculates configures values for slidingWindowSize, responseTimeOut and maximumNumberOfRetries
async function initializeDependentIntegerValues() {
    try {
        slidingWindowSize = await integerProfile.getIntegerValueForTheIntegerProfileNameAsync("slidingWindowSize");
        let profileInstance = await utility.getIntegerProfileForIntegerName("responseTimeout");
        let integerValue = profileInstance[onfAttributes.INTEGER_PROFILE.PAC][onfAttributes.INTEGER_PROFILE.CONFIGURATION][onfAttributes.INTEGER_PROFILE.INTEGER_VALUE];
        let unit = profileInstance[onfAttributes.INTEGER_PROFILE.PAC][onfAttributes.INTEGER_PROFILE.CAPABILITY][onfAttributes.INTEGER_PROFILE.UNIT];
        responseTimeOut = await utility.calculateTimeInMilliSeconds(integerValue, unit);
        maximumNumberOfRetries = await integerProfile.getIntegerValueForTheIntegerProfileNameAsync("maximumNumberOfRetries");
    } catch (error) {
        console.log(error);
    }
}