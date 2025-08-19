'use strict';
const fileSystem = require('fs');
const utility = require('../../utility');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const deviceMetaDataUtility = require('./deviceMetaDataUtility');
let controlConstructUtility = require('./controlConstructUtility');
let periodicConnectionStatusSynchTimerId = 0;





exports.start = async function deviceMetaDataCyclicProcess() {
  try {
    /**
     * Update deviceMetaDataList once the application receives embed-yourself
     */
    await deviceMetaDataListUpdateProcess();

    /**
     * Starts cyclic process for deviceListSyncPeriod
     */
    let profileInstanceForDeviceListSyncPeriod = await utility.getIntegerProfileForIntegerName("deviceListSyncPeriod");
    let integerValueForDeviceListSyncPeriod = profileInstanceForDeviceListSyncPeriod[onfAttributes.INTEGER_PROFILE.PAC][onfAttributes.INTEGER_PROFILE.CONFIGURATION][onfAttributes.INTEGER_PROFILE.INTEGER_VALUE];
    let unitForDeviceListSyncPeriod = profileInstanceForDeviceListSyncPeriod[onfAttributes.INTEGER_PROFILE.PAC][onfAttributes.INTEGER_PROFILE.CAPABILITY][onfAttributes.INTEGER_PROFILE.UNIT];

    let deviceListSyncPeriod;
    if (unitForDeviceListSyncPeriod == "days") deviceListSyncPeriod = parseInt(integerValueForDeviceListSyncPeriod) * 24 * 60 * 60 * 1000;
    else if (unitForDeviceListSyncPeriod == "hour") deviceListSyncPeriod = parseInt(integerValueForDeviceListSyncPeriod) * 60 * 60 * 1000;
    periodicConnectionStatusSynchTimerId = setInterval(deviceMetaDataListUpdateProcess, deviceListSyncPeriod);
    return;

  } catch (error) {
    console.log(error);
    return error;
  }
}

/**
* Starts the process for retrieving deviceMetaDataList from Controller and update in ES
*/
async function deviceMetaDataListUpdateProcess() {
  try {
    let odlDeviceMetaDataList = [];
    let deviceMetaDataListFromElasticSearch = [];
    let deviceMetaDataList = [];
    /**
     * to be reverted to original code. Temporarily get input data from file instead of controller. 
     * Remove line 55 and 56
     * 
    //get device meta data list from live controller
    odlDeviceMetaDataList = await deviceMetaDataUtility.getLiveDeviceMetaDataListFromController()
      .catch(error => {
        throw error;
      });
     */

    odlDeviceMetaDataList = await fileSystem.promises.readFile("service/individualServices/CyclicProcessService/DeviceMetaDataProcess/testBedTempDevicesFile.json", 'utf-8');
    odlDeviceMetaDataList = JSON.parse(odlDeviceMetaDataList);
    // get existing device meta data from elastic search
    deviceMetaDataListFromElasticSearch = await deviceMetaDataUtility.readDeviceMetaDataListFromElasticSearch()
      .catch(error => {
        throw error;
      });

    console.log('*******************************************************************************************************');
    console.log('*                             DeviceMetaData Table PROCESS PROCEDURE STARTED                                        *');
    console.log('*                                                                                                     *');
    console.log('*                                 ( ' + utility.getTime() + ' )                                             *');
    console.log('*                                                                                                     *');
    console.log('*******************************************************************************************************');
    //get string-value of historicalControlConstructPolicy
    let historicalControlConstructPolicy = await utility.getStringValueForStringProfileNameAsync("historicalControlConstructPolicy");
    let currentTime = new Date().toJSON();
    let defaultDisconnectionTime = new Date("01-01-1997").toJSON();

    if (deviceMetaDataListFromElasticSearch.length == 0) {
      /**
        CREATING NEW DEVICEMETADATALIST IN ES 
      */
      for (let i = 0; i < odlDeviceMetaDataList.length; i++) {
        let mountName = odlDeviceMetaDataList[i]["node-id"];
        let connectionStatus = odlDeviceMetaDataList[i]["netconf-node-topology:connection-status"];
        let schemaCacheDirectory = odlDeviceMetaDataList[i]["netconf-node-topology:schema-cache-directory"];
        if (connectionStatus) {
          let deviceMetaData = {
            "mount-name": mountName,
            "connection-status": connectionStatus,
            "changed-to-disconnected-time": null,
            "added-to-device-list-time": currentTime,
            "last-complete-control-construct-update-time-attempt": defaultDisconnectionTime,
            "last-successful-complete-control-construct-update-time": null,
            "last-control-construct-notification-update-time": null,
            "number-of-partial-updates-since-last-complete-update": 0,
            "schema-cache-directory": schemaCacheDirectory,
            "device-type": "unknown",
            "vendor": "unknown",
            "locked-status": false,
            "exclude-from-qm": true
          };
          if (connectionStatus != "connected") {
            if (historicalControlConstructPolicy == "keep-on-disconnect") {
              deviceMetaData["changed-to-disconnected-time"] = currentTime;
              await deviceMetaDataUtility.updateDeviceMetadataPriorityList(deviceMetaData);
              deviceMetaDataList.push(deviceMetaData);
            }
          } else {
            /** 
             * by default vendor-name and device-type will be "unknown" 
             * as ES will not contain CC of any device during initialisation
            */
            await deviceMetaDataUtility.updateDeviceMetadataPriorityList(deviceMetaData);
            deviceMetaDataList.push(deviceMetaData);
          }
        }
      }
      let stringifiedMetaDataList = JSON.stringify(deviceMetaDataList);
      //Writing the metaData list into Elasticsearch
      try {
        await deviceMetaDataUtility.writeDeviceMetaDataListToElasticsearch(stringifiedMetaDataList);
      } catch (error) {
        console.log(error);
      }
    } else {
      /**
       * UPDATING THE EXISTING METADATA IN ES ACCORDING TO NEW DATA FROM CONTROLLER
       */
      let commonEsElements = [];
      for (let i = 0; i < deviceMetaDataListFromElasticSearch.length; i++) {
        let found = false;
        for (let j = 0; j < odlDeviceMetaDataList.length; j++) {
          if (deviceMetaDataListFromElasticSearch[i]['mount-name'] == odlDeviceMetaDataList[j]["node-id"]) {
            found = true;
            if (deviceMetaDataListFromElasticSearch[i]["connection-status"] !==
              odlDeviceMetaDataList[j]["netconf-node-topology:connection-status"]) {
                // if device status changes from non-connected to connected
              if (deviceMetaDataListFromElasticSearch[i]["connection-status"] == "unable-to-connect" || deviceMetaDataListFromElasticSearch[i]["connection-status"] == 'connecting' && odlDeviceMetaDataList[j]["netconf-node-topology:connection-status"] == "connected") {
                deviceMetaDataListFromElasticSearch[i]["connection-status"] = "connected";
                deviceMetaDataListFromElasticSearch[i]["changed-to-disconnected-time"] = null;
                deviceMetaDataListFromElasticSearch[i]["last-complete-control-construct-update-time-attempt"] = defaultDisconnectionTime;
                deviceMetaDataListFromElasticSearch[i]["added-to-device-list-time"] = currentTime;
                deviceMetaDataListFromElasticSearch[i]["number-of-partial-updates-since-last-complete-update"] = 0;
                if (deviceMetaDataListFromElasticSearch[i]["device-type"] == "unknown") {
                  let deviceType = await deviceMetaDataUtility.getDeviceTypeOfMountName(deviceMetaDataListFromElasticSearch[i]["mount-name"]);
                  if (deviceType != "unknown") {
                    deviceMetaDataListFromElasticSearch[i]["device-type"] = deviceType;
                    let vendorName = await deviceMetaDataUtility.getVendorNameForDeviceType(deviceType);
                    if (vendorName != "unknown") {
                      deviceMetaDataListFromElasticSearch[i]["vendor"] = vendorName;
                    }
                  }
                }
                await deviceMetaDataUtility.updateDeviceMetadataPriorityList(deviceMetaDataListFromElasticSearch[i]);
                commonEsElements.push(deviceMetaDataListFromElasticSearch[i]);
                break;
              } // if device status changes from connected to non-connected 
              else if (deviceMetaDataListFromElasticSearch[i]["connection-status"] == "connected" && (odlDeviceMetaDataList[j]["netconf-node-topology:connection-status"] == "unable-to-connect" || odlDeviceMetaDataList[j]["netconf-node-topology:connection-status"] == 'connecting')) {
                if (historicalControlConstructPolicy == "keep-on-disconnect") {
                  deviceMetaDataListFromElasticSearch[i]["connection-status"] = odlDeviceMetaDataList[j]["netconf-node-topology:connection-status"];
                  deviceMetaDataListFromElasticSearch[i]['changed-to-disconnected-time'] = currentTime;
                  deviceMetaDataListFromElasticSearch[i]["added-to-device-list-time"] = null;
                  deviceMetaDataListFromElasticSearch[i]["last-complete-control-construct-update-time-attempt"] = defaultDisconnectionTime;
                  deviceMetaDataListFromElasticSearch[i]["last-control-construct-notification-update-time"] = null;
                  deviceMetaDataListFromElasticSearch[i]["number-of-partial-updates-since-last-complete-update"] = 0;
                  await deviceMetaDataUtility.updateDeviceMetadataPriorityList(deviceMetaDataListFromElasticSearch[i]);
                  commonEsElements.push(deviceMetaDataListFromElasticSearch[i]);
                  break;
                } else {
                  await deviceMetaDataUtility.removeDeviceDataFromCache(deviceMetaDataListFromElasticSearch[i]["mount-name"]);
                }
              }
            } else {
              // no changes in device connection status
              if (deviceMetaDataListFromElasticSearch[i]["connection-status"] == "connected") {
                await deviceMetaDataUtility.updateDeviceMetadataPriorityList(deviceMetaDataListFromElasticSearch[i]);
                commonEsElements.push(deviceMetaDataListFromElasticSearch[i]);
              } else {
                if (historicalControlConstructPolicy == "keep-on-disconnect") {
                  let isDeviceCrossedRetentionPeriod = await deviceMetaDataUtility.isDeviceCrossedRetentionPeriod(deviceMetaDataListFromElasticSearch[i]["changed-to-disconnected-time"]);
                  if (!isDeviceCrossedRetentionPeriod) {
                    await deviceMetaDataUtility.updateDeviceMetadataPriorityList(deviceMetaDataListFromElasticSearch[i]);
                    commonEsElements.push(deviceMetaDataListFromElasticSearch[i]);
                  } else {
                    await deviceMetaDataUtility.removeDeviceDataFromCache(deviceMetaDataListFromElasticSearch[i]["mount-name"]);
                  }
                } else {
                  await deviceMetaDataUtility.removeDeviceDataFromCache(deviceMetaDataListFromElasticSearch[i]["mount-name"]);
                }
              }
            }
            break;
          }
        }
        if (!found) {
          // device not at all found in odl device list
          if (historicalControlConstructPolicy == "keep-on-disconnect") {
            let isDeviceCrossedRetentionPeriod;
            if (deviceMetaDataListFromElasticSearch[i]["connection-status"] != "connected") {
              isDeviceCrossedRetentionPeriod = await deviceMetaDataUtility.isDeviceCrossedRetentionPeriod(deviceMetaDataListFromElasticSearch[i]["changed-to-disconnected-time"]);
              if (isDeviceCrossedRetentionPeriod) {
                await deviceMetaDataUtility.removeDeviceDataFromCache(deviceMetaDataListFromElasticSearch[i]["mount-name"]);
              }
            }
            if (!isDeviceCrossedRetentionPeriod || deviceMetaDataListFromElasticSearch[i]["connection-status"] == "connected") {
              deviceMetaDataListFromElasticSearch[i]["connection-status"] = "unknown";
              if (deviceMetaDataListFromElasticSearch[i]["changed-to-disconnected-time"] == null) { deviceMetaDataListFromElasticSearch[i]["changed-to-disconnected-time"] = currentTime; }
              deviceMetaDataListFromElasticSearch[i]["added-to-device-list-time"] = null;
              deviceMetaDataListFromElasticSearch[i]["last-complete-control-construct-update-time-attempt"] = defaultDisconnectionTime;
              deviceMetaDataListFromElasticSearch[i]["last-successful-complete-control-construct-update-time"] = null;
              deviceMetaDataListFromElasticSearch[i]["last-control-construct-notification-update-time"] = null;
              deviceMetaDataListFromElasticSearch[i]["last-control-construct-notification-update-time"] = null;
              deviceMetaDataListFromElasticSearch[i]["number-of-partial-updates-since-last-complete-update"] = 0;
              await deviceMetaDataUtility.updateDeviceMetadataPriorityList(deviceMetaDataListFromElasticSearch[i]);
              commonEsElements.push(deviceMetaDataListFromElasticSearch[i]);
            }
          } else {
            await deviceMetaDataUtility.removeDeviceDataFromCache(deviceMetaDataListFromElasticSearch[i]["mount-name"]);
          }
        }
      }

      /**
       * ADDING ADDITIONAL ODL ELEMENTS INTO DEVICE-METADATA TABLE
       */
      let newOdlElements = [];
      for (let i = 0; i < odlDeviceMetaDataList.length; i++) {
        let found = false;
        for (let j = 0; j < deviceMetaDataListFromElasticSearch.length; j++) {
          if (odlDeviceMetaDataList[i]["node-id"] == deviceMetaDataListFromElasticSearch[j]['mount-name']) {
            found = true;
            break;
          }
        }
        if (!found) {
          let mountName = odlDeviceMetaDataList[i]["node-id"];
          let connectionStatus = odlDeviceMetaDataList[i]["netconf-node-topology:connection-status"];
          let schemaCacheDirectory = odlDeviceMetaDataList[i]["netconf-node-topology:schema-cache-directory"];
          if (connectionStatus) {
            let deviceMetaData = {
              "mount-name": mountName,
              "connection-status": connectionStatus,
              "changed-to-disconnected-time": null,
              "added-to-device-list-time": currentTime,
              "last-complete-control-construct-update-time-attempt": defaultDisconnectionTime,
              "last-successful-complete-control-construct-update-time": null,
              "last-control-construct-notification-update-time": null,
              "number-of-partial-updates-since-last-complete-update": 0,
              "schema-cache-directory": schemaCacheDirectory,
              "device-type": "unknown",
              "vendor": "unknown",
              "locked-status": false,
              "exclude-from-qm": true
            };
            if (connectionStatus != "connected") {
              if (historicalControlConstructPolicy == "keep-on-disconnect") {
                deviceMetaData["changed-to-disconnected-time"] = currentTime;
                await deviceMetaDataUtility.updateDeviceMetadataPriorityList(deviceMetaData);
                newOdlElements.push(deviceMetaData);
              } else {
                await deviceMetaDataUtility.removeDeviceDataFromCache(deviceMetaData["mount-name"]);
              }
            } else {
              let deviceType = await deviceMetaDataUtility.getDeviceTypeOfMountName(mountName);
              if (deviceType != "unknown") {
                deviceMetaData["device-type"] = deviceType;
                let vendorName = await deviceMetaDataUtility.getVendorNameForDeviceType(deviceType);
                if (vendorName != "unknown") {
                  deviceMetaData["vendor"] = vendorName;
                }
              }
              await deviceMetaDataUtility.updateDeviceMetadataPriorityList(deviceMetaData);
              newOdlElements.push(deviceMetaData);
            }
          }
        }
      }
      deviceMetaDataList = [].concat(newOdlElements, commonEsElements);
      let stringifiedMetaDataList = JSON.stringify(deviceMetaDataList);
      await deviceMetaDataUtility.writeDeviceMetaDataListToElasticsearch(stringifiedMetaDataList)
        .catch((error) => {
          throw error;
        });
        controlConstructUtility.processControlConstructRequest();
    }

    console.log('*******************************************************************************************************');
    console.log('*                             DeviceMetaData Update Cyclic PROCESS PROCEDURE COMPLETED                                        *');
    console.log('*                                                                                                     *');
    console.log('*                                 ( ' + utility.getTime() + ' )                                             *');
    console.log('*                                                                                                     *');
    console.log('*******************************************************************************************************');
    return;
  } catch (error) {
    console.log(error);
    return error;
  }
}


/**
 * Stops the cyclic process disabling the time to live check the meta-data list
 * 
 **/
module.exports.stopMetaDataCyclicProcess = async function stopMetaDataCyclicProcess() {

  console.log('*******************************************************************************************************');
  console.log('*                             METADATA UPDATING CYCLIC PROCESS PROCEDURE STOPPED                      *');
  console.log('*                                                                                                     *');
  console.log('*                                 ( ' + utility.getTime() + ' )                                               *');
  console.log('*                                                                                                     *');
  console.log('*******************************************************************************************************');

  clearInterval(periodicConnectionStatusSynchTimerId);
}