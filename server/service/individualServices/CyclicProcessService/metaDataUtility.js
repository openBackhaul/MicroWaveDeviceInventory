
'use strict';

const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const RestClient = require('../rest/client/dispacher');
const utility = require('../utility');

exports.writeMetaDataListToElasticsearch = function (deviceList) {
  return new Promise(async function (resolve, reject) {
    try {
      let deviceListToWrite = '{"MetaDataList":' + deviceList + '}';
      let result = await utility.recordRequest(deviceListToWrite, "MetaDataList");
      if (result.took !== undefined) {
        resolve(true);
      } else {
        reject("Error in writing MetaDataList list to elasticsearch.")
      }
    } catch (error) {
      reject(error);
    }
  })
}

exports.readMetaDataListFromElasticsearch = function () {
  return new Promise(async function (resolve, reject) {
    try {
      let esMetaDataList = [];
      let result = await utility.ReadRecords("MetaDataList");
      if (result != undefined) {
        esMetaDataList = result["MetaDataList"];
      }
      resolve(esMetaDataList);
    } catch (error) {
      reject(error);
    }
  })
}

exports.getLiveMetaDataListFromController = function () {
  return new Promise(async function (resolve, reject) {
    try {
      // controllerInternalPathToMountPoint
      let controllerInternalPathToMountPoint = await utility.getStringValueForStringProfileNameAsync("controllerInternalPathToMountPoint");
      let fieldsPathToDeviceStatus = await utility.getStringValueForStringProfileNameAsync("PromptForEmbeddingCausesCyclicLoadingOfDeviceStatusFromController.fieldsFilter");
      let urlToGetDeviceStatusFromController = controllerInternalPathToMountPoint + "?fields=" + fieldsPathToDeviceStatus;
      const finalUrl = common[0].tcpConn + urlToGetDeviceStatusFromController;
      const Authorization = common[0].key;
      const result = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization);
      if (result.status == 200) {
        let deviceList = result["data"]["network-topology:topology"][0].node;
        resolve(deviceList);
      } else {
        reject("Error in retrieving device status list from ODL. (" + result.status + " - " + result.statusText + ")");
      }
    } catch (error) {
      reject(error);
    }
  });
}

exports.isDeviceCrossedRetentionPeriod = async function (changedToDisconnectedTime) {
  let isDeviceCrossedRetentionPeriod = false;
  try {
    let currentTime = Date.now();
    let diffTime = currentTime - new Date(changedToDisconnectedTime).getTime();
    let profileInstance = await utility.getIntegerProfileForIntegerName("metadataTableRetentionPeriod");
    let integerValue = profileInstance[onfAttributes.INTEGER_PROFILE.PAC][onfAttributes.INTEGER_PROFILE.CONFIGURATION][onfAttributes.INTEGER_PROFILE.INTEGER_VALUE];
    let unit = profileInstance[onfAttributes.INTEGER_PROFILE.PAC][onfAttributes.INTEGER_PROFILE.CAPABILITY][onfAttributes.INTEGER_PROFILE.UNIT];

    let metadataTableRetentionPeriod;
    if (unit == "days") metadataTableRetentionPeriod = parseInt(integerValue) * 24 * 60 * 60 * 1000;
    else if (unit == "hours") metadataTableRetentionPeriod = parseInt(integerValue) * 60 * 60 * 1000;

    if (diffTime > metadataTableRetentionPeriod) {
      isDeviceCrossedRetentionPeriod = true;
    }

  } catch (error) {
    console.log(error);
  }
  return isDeviceCrossedRetentionPeriod;

}

/**
 * This function 
 *   - updates the existing metadata of a device 
 *   - add new entry of non-existing meta-data
 *   - checks for maxRetentionPeriod and remove the meta-data of a device if value exceeds
 * 
 * @param {*} mountName node-id of the device for which the meta-data shall be updated
 * @param {*} connectionStatus new value of connection-status
 */
exports.updateMDTableForDeviceStatusChange = async function (mountName, connectionStatus, timestamp) {
  try {
    let metaDataListFromElasticSearch = await exports.readMetaDataListFromElasticsearch()
      .catch(error => {
        throw error;
      });
    let found = false;
    for (let i = 0; i < metaDataListFromElasticSearch.length; i++) {
      if (metaDataListFromElasticSearch[i]["mount-name"] == mountName) {
        found = true;
        let existingConnectionStatus = metaDataListFromElasticSearch[i]["connection-status"];
        if (existingConnectionStatus != connectionStatus) {
          if (metaDataListFromElasticSearch[i]["connection-status"] == "unable-to-connect" || "connecting" && connectionStatus == "connected") {
            metaDataListFromElasticSearch[i]["connection-status"] = "connected";
            metaDataListFromElasticSearch[i]["changed-to-disconnected-time"] = null;
            metaDataListFromElasticSearch[i]["added-to-device-list-time"] = currentTime;
            metaDataListFromElasticSearch[i]["number-of-partial-updates-since-last-complete-update"] = 0;
          } else if (metaDataListFromElasticSearch[i]["connection-status"] == "connected" && connectionStatus == "unable-to-connect" || "connecting") {
            metaDataListFromElasticSearch[i]["connection-status"] = connectionStatus;
            metaDataListFromElasticSearch[i]["changed-to-disconnected-time"] = timestamp;
            metaDataListFromElasticSearch[i]["added-to-device-list-time"] = null;
            metaDataListFromElasticSearch[i]["last-complete-control-construct-update-time"] = null;
            metaDataListFromElasticSearch[i]["last-control-construct-notification-update-time"] = null;
            metaDataListFromElasticSearch[i]["number-of-partial-updates-since-last-complete-update"] = 0;
          }
          await exports.writeDeviceListToElasticsearch(metaDataListFromElasticSearch);
        } else {
          if (connectionStatus != "connected") {
            let isDeviceCrossedRetentionPeriod = await exports.isDeviceCrossedRetentionPeriod(metaDataListFromElasticSearch[i]["changed-to-disconnected-time"]);
            if (isDeviceCrossedRetentionPeriod) {
              metaDataListFromElasticSearch.splice(i, 1);
              await exports.writeDeviceListToElasticsearch(metaDataListFromElasticSearch);
              console.log("removed device's meta data from list that crossed maximum retention period ", mountName);
            } else {
              console.log("skipped removing device's meta data from list since maximum retention period not crossed ", mountName)
            }
          }
        }
      }
    }
    if (!found) {
      let deviceMetaData = {
        "mount-name": mountName,
        "connection-status": connectionStatus,
        "changed-to-disconnected-time": null,
        "added-to-device-list-time": null,
        "last-complete-control-construct-update-time": null,
        "last-control-construct-notification-update-time": null,
        "number-of-partial-updates-since-last-complete-update": 0,
        "schema-cache-directory": null
      };
      if (connectionStatus == "connected") {
        deviceMetaData["added-to-device-list-time"] = timestamp;
      } else {
        deviceMetaData["changed-to-disconnected-time"] = timestamp;
      }
      metaDataListFromElasticSearch.push(deviceMetaData);
      await exports.writeMetaDataListToElasticsearch(metaDataListFromElasticSearch);
    }
  } catch (error) {
    console.log(error);
    return error;
  }
}

/**
 * This function 
 *   - updates the existing metadata of a device for partial control-construct update
 * 
 * @param {*} mountName node-id of the device for which the meta-data shall be updated
 * @param {*} timestamp time received in notification
 */
exports.updateMDTableForPartialCCUpdate = async function (mountName, timestamp = '') {
  try {
    let metaDataListFromElasticSearch = await exports.readMetaDataListFromElasticsearch()
      .catch(error => {
        throw error;
      });
    let found = false;
    for (let i = 0; i < metaDataListFromElasticSearch.length; i++) {
      if (metaDataListFromElasticSearch[i]["mount-name"] == mountName) {
        found = true;
        metaDataListFromElasticSearch[i]["last-control-construct-notification-update-time"] = timestamp;
        let updateCounter = metaDataListFromElasticSearch[i]["number-of-partial-updates-since-last-complete-update"];
        metaDataListFromElasticSearch[i]["number-of-partial-updates-since-last-complete-update"] = updateCounter + 1;

        await exports.writeDeviceListToElasticsearch(metaDataListFromElasticSearch);
      }
    }
      if (!found) {
        console.log("*******************meta data for requested resource is not present in meta-data table*********************");
      }
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  /**
 * This function 
 *   - updates the existing metadata of a device for complete control-construct update
 * 
 * @param {*} mountName node-id of the device for which the meta-data shall be updated
 * @param {*} timestamp time received in notification
 */
exports.updateMDTableForCompleteCCUpdate = async function (mountName, timestamp = '') {
  try {
    let metaDataListFromElasticSearch = await exports.readMetaDataListFromElasticsearch()
      .catch(error => {
        throw error;
      });
    let found = false;
    for (let i = 0; i < metaDataListFromElasticSearch.length; i++) {
      if (metaDataListFromElasticSearch[i]["mount-name"] == mountName) {
        found = true;
        metaDataListFromElasticSearch[i]["last-complete-control-construct-update-time"] = timestamp;
        metaDataListFromElasticSearch[i]["number-of-partial-updates-since-last-complete-update"] = 0;

        await exports.writeDeviceListToElasticsearch(metaDataListFromElasticSearch);
      }
    }
      if (!found) {
        console.log("*******************meta data for requested resource is not present in meta-data table*********************");
      }
    } catch (error) {
      console.log(error);
      return error;
    }
  }