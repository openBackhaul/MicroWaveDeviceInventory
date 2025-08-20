'use strict';


'use strict';

const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const RestClient = require('../../rest/client/dispacher');
const utility = require('../../utility');
const deviceControlConstructUtility = require('./deviceControlConstructUtility');
const individualServicesService = require('../../../IndividualServicesService');
const deviceMetadataPriorityList = require('./DeviceMetaDataPriorityList');

/**
 * This function gets netconf data of devices connected to given controller 
 * 
 * @returns {List} deviceList - list of devicelist responded from controller
 */
exports.getLiveDeviceMetaDataListFromController = async function () {
  return new Promise(async function (resolve, reject) {
    try {
      // controllerInternalPathToMountPoint
      let controllerInternalPathToMountPoint = await utility.getStringValueForStringProfileNameAsync("controllerInternalPathToMountPoint");
      let fieldsPathToDeviceStatus = await utility.getStringValueForStringProfileNameAsync("PromptForEmbeddingCausesCyclicLoadingOfDeviceStatusFromController.fieldsFilter");
      let urlToGetDeviceStatusFromController = controllerInternalPathToMountPoint + "?fields=" + fieldsPathToDeviceStatus;
      const finalUrl = common[0].tcpConn + '/' + urlToGetDeviceStatusFromController;
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

/**
 * This function retrieved device meta data list from Elasticsearch at configured index
 * 
 * @returns {List} esMetaDataList - list of deviceMetadatalist responded from ES
 */
exports.readDeviceMetaDataListFromElasticSearch = function () {
  return new Promise(async function (resolve, reject) {
    try {
      let esMetaDataList = [];
      let result = await utility.ReadRecords("DeviceMetaDataList");
      if (result != undefined) {
        esMetaDataList = result["DeviceMetaDataList"];
      }
      resolve(esMetaDataList);
    } catch (error) {
      reject(error);
    }
  })
}

/**
 * This function writes device meta data list to Elasticsearch at given index
 * 
 * @param {List} deviceList - list of deviceMetadatalist for writing/updating to ES at configured index
 */
exports.writeDeviceMetaDataListToElasticsearch = function (deviceList) {
  return new Promise(async function (resolve, reject) {
    try {
      let deviceListToWrite = '{"DeviceMetaDataList":' + deviceList + '}';
      let result = await utility.recordRequest(deviceListToWrite, "DeviceMetaDataList");
      if (result.took !== undefined) {
        resolve(true);
      } else {
        reject("Error in writing DeviceMetaDataList list to elasticsearch.")
      }
    } catch (error) {
      reject(error);
    }
  })
}

/**
 * This function validates whether a non-connected device crossed it's retention period in ES
 * 
 * @param {String} changedToDisconnectedTime - time at which the device has been changed from connected to dis-connected state
 * @returns {Boolean} isDeviceCrossedRetentionPeriod - true if the incoming timestamp crossed retention period - false otherwise
 */
exports.isDeviceCrossedRetentionPeriod = async function (changedToDisconnectedTime) {
  let isDeviceCrossedRetentionPeriod = false;
  try {
    let currentTime = Date.now();
    let diffTime = currentTime - new Date(changedToDisconnectedTime).getTime();
    let profileInstance = await utility.getIntegerProfileForIntegerName("metadataRetentionPeriod");
    let integerValue = profileInstance[onfAttributes.INTEGER_PROFILE.PAC][onfAttributes.INTEGER_PROFILE.CONFIGURATION][onfAttributes.INTEGER_PROFILE.INTEGER_VALUE];
    let unit = profileInstance[onfAttributes.INTEGER_PROFILE.PAC][onfAttributes.INTEGER_PROFILE.CAPABILITY][onfAttributes.INTEGER_PROFILE.UNIT];

    let metadataTableRetentionPeriod = await utility.calculateTimeInMilliSeconds(integerValue, unit);

    if (diffTime > metadataTableRetentionPeriod) {
      isDeviceCrossedRetentionPeriod = true;
    }
  } catch (error) {
    console.log(error);
  }
  return isDeviceCrossedRetentionPeriod;
}

/**
 * This function returns the device-type of given mount-name
 * 
 * @param {String} mountName - node-id for which the device-type shall be found
 * @returns {String} deviceType - device-type calculated from air-interface/type-of-equipment from cache CC
 *                     default - "unknown" - if device-type could not be found
 */
exports.getDeviceTypeOfMountName = async function (mountName) {
  let deviceType = "unknown";
  try {
    let urlToGetCCFromCache = await deviceControlConstructUtility.getControlConstructPathForCache(mountName);
    let fieldsPathToDeviceType = await utility.getStringValueForStringProfileNameAsync("PromptForEmbeddingCausesCyclicLoadingOfDeviceTypeInfo.fieldsFilter");
    let urlToGetDeviceType = urlToGetCCFromCache + "?fields=" + fieldsPathToDeviceType;
    const result = await individualServicesService.getCachedControlConstruct(urlToGetDeviceType);
    let ltpList = result["core-model-1-4:control-construct"]["logical-termination-point"];
    let airInterfaceLtpList = ltpList.filter(ltp => ltp["layer-protocol"][0].hasOwnProperty("air-interface-2-0:air-interface-pac"));
    deviceType = await exports.getMatchingDeviceType(airInterfaceLtpList);
    return deviceType;
  } catch (error) {
    console.log(error);
    return "unknown";
  }
}

/**
 * This function parses given airInterfaceLtpList to find the device-type
 * 
 * @param {List} airInterfaceLtpList - list of air-interfaces that a application contains
 * @returns {String} deviceType - device-type calculated from air-interface/type-of-equipment 
 *                     default - "unknown" - if device-type could not be found
 */
exports.getMatchingDeviceType = async function (airInterfaceLtpList) {
  try {
    let deviceType = "unknown";
    let mappingList = await utility.getMappingListForRegexProfile("deviceTypeMapping");
    for (let i = 0; i < airInterfaceLtpList.length; i++) {
      let typeOfEquipment = airInterfaceLtpList[i]["layer-protocol"][0]["air-interface-2-0:air-interface-pac"]["air-interface-capability"]["type-of-equipment"];
      let regexPattern;
      for (let j = 0; j < mappingList.length; j++) {
        regexPattern = mappingList[j][onfAttributes.REGEX_PATTERN_MAPPING_PROFILE.REGEX_STRING];
        regexPattern = regexPattern.replace(/\\\\s/g, '\\s');
        let regexParts = regexPattern.match(/^\/(.+)\/([a-z]*)$/i);
        let pattern = regexParts[1];
        let flag = regexParts[2];
        regexPattern = new RegExp(pattern, flag);
        if (regexPattern.test(typeOfEquipment)) {
          deviceType = mappingList[j][onfAttributes.REGEX_PATTERN_MAPPING_PROFILE.MAP_TO_STRING];
          break;
        }
      }
      if (deviceType != "unknown") {
        break;
      }
    }
    return deviceType;
  } catch (error) {
    console.log(error);
    return "unknown";
  }
}

/**
 * This function gives vendor name of given device-type
 * 
 * @param {String} deviceType - device-type calculated from air-interface/type-of-equipment 
 * @returns {String} vendor - matching vendor name of given deviceType by regex
 *                     default - "unknown" - if vendor-name or deviceType could not be found
 */
exports.getVendorNameForDeviceType = async function (deviceType) {
  try {
    let vendor = "unknown";
    let mappingList = await utility.getMappingListForRegexProfile("vendorFromDeviceTypeMapping");
    let regexPattern;
    for (let i = 0; i < mappingList.length; i++) {
      regexPattern = mappingList[i][onfAttributes.REGEX_PATTERN_MAPPING_PROFILE.REGEX_STRING];
      regexPattern = new RegExp(regexPattern);
      if (regexPattern.test(deviceType)) {
        vendor = mappingList[i][onfAttributes.REGEX_PATTERN_MAPPING_PROFILE.MAP_TO_STRING];
        break;
      }
    }
    return vendor;
  } catch (error) {
    console.log(error);
    return "unknown";
  }
}

/**
 * This function updates DeviceMetadataPriorityList in cache
 * 
 * @param {Object} deviceMetaData - meta-data of device
 * @returns {Boolean} true if successfully updated
 */
exports.updateDeviceMetadataPriorityList = async function(deviceMetaData) {
  try {
    let keys = ["mount-name", "connection-status", "last-complete-control-construct-update-time-attempt"];
    let deviceData = keys.reduce((acc, key)=>{
      if(key in deviceMetaData) acc[key] = deviceMetaData[key];
      return acc;
    }, {});
    await deviceMetadataPriorityList.createOrUpdateDevice(deviceData);
    return true;
  } catch(error) {
    console.log(error);
    return false;
  }
}

/**
 * This function removes entry from DeviceMetadataPriorityList in cache
 * 
 * @param {Object} mountName - node-id
 * @returns {Boolean} true if successfully updated
 */
exports.removeDeviceDataFromCache = async function(mountName) {
  try {
    await deviceMetadataPriorityList.removeMetaDataOfDevice(mountName);
    console.log(`************************* attempting to CC of ${mountName} from ES **************************`);
    let indexAlias = common[1].indexAlias;
    let ret = await individualServicesService.deleteRecordFromElasticsearch(indexAlias, '_doc', mountName);
    console.log('*************************' + ret.result , '**************************');
    return true;
  } catch(error) {
    console.log(error);
    return false;
  }
}

//-----------------------------------these functions are part of notifications. This shall be updated. 

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

