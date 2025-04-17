
const metaDataUtility = require('./metaDataUtility');
const individualServicesService = require('../../IndividualServicesService');
const utility = require('../utility');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');

var periodicConnectionStatusSynchTimerId = 0;

exports.MetaDataTableCyclicProcess = async function MetaDataTableCyclicProcess() {
  try {
    /**
     * Update metaDataTable once the application receives embed-yourself
     */
    await metaDataTableUpdateProcess();

    /**
     * Starts cyclic process for connectionStatusSyncPeriod
     */
    let profileInstanceForConnectionStatusSyncPeriod = await utility.getIntegerProfileForIntegerName("connectionStatusSyncPeriod");
    let integerValueForConnectionStatusSyncPeriod = profileInstanceForConnectionStatusSyncPeriod[onfAttributes.INTEGER_PROFILE.PAC][onfAttributes.INTEGER_PROFILE.CONFIGURATION][onfAttributes.INTEGER_PROFILE.INTEGER_VALUE];
    let unitForConnectionStatusSyncPeriod = profileInstanceForConnectionStatusSyncPeriod[onfAttributes.INTEGER_PROFILE.PAC][onfAttributes.INTEGER_PROFILE.CAPABILITY][onfAttributes.INTEGER_PROFILE.UNIT];

    let connectionStatusSyncPeriod;
    if (unitForConnectionStatusSyncPeriod == "days") connectionStatusSyncPeriod = parseInt(integerValueForConnectionStatusSyncPeriod) * 24 * 60 * 60 * 1000;
    else if (unitForConnectionStatusSyncPeriod == "hour") connectionStatusSyncPeriod = parseInt(integerValueForConnectionStatusSyncPeriod) * 60 * 60 * 1000;
    periodicConnectionStatusSynchTimerId = setInterval(metaDataTableUpdateProcess, connectionStatusSyncPeriod);
    return;

  } catch (error) {
    console.log(error);
    return error;
  }
}

/**
* Starts the complete metaData table in ES update
*/
async function metaDataTableUpdateProcess() {
  try {
    let odlDeviceList = [];
    let metaDataListFromElasticSearch = [];
    let deviceListMetaData = [];
    //get device list from live controller
    odlDeviceList = await metaDataUtility.getLiveMetaDataListFromController()
      .catch(error => {
        throw error;
      });
    // get existing meta data from elastic search
    metaDataListFromElasticSearch = await metaDataUtility.readMetaDataListFromElasticsearch()
      .catch(error => {
        throw error;
      });

    console.log('*******************************************************************************************************');
    console.log('*                             MetaData Table PROCESS PROCEDURE STARTED                                        *');
    console.log('*                                                                                                     *');
    console.log('*                                 ( ' + utility.getTime() + ' )                                             *');
    console.log('*                                                                                                     *');
    console.log('*******************************************************************************************************');
    let currentTime = new Date().toJSON();
    if (metaDataListFromElasticSearch.length == 0) {
      /**
        CREATING NEW METADATALIST IN ES 
      */
      for (let i = 0; i < odlDeviceList.length; i++) {
        //defining meta data for each device
        let mountName = odlDeviceList[i]["node-id"];
        let connectionStatus = odlDeviceList[i]["netconf-node-topology:connection-status"];
        let schemaCacheDirectory = odlDeviceList[i]["netconf-node-topology:schema-cache-directory"];
        if (connectionStatus) {
          let deviceMetaData = {
            "mount-name": mountName,
            "connection-status": connectionStatus,
            "changed-to-disconnected-time": null,
            "added-to-device-list-time": null,
            "last-complete-control-construct-update-time": null,
            "last-control-construct-notification-update-time": null,
            "number-of-partial-updates-since-last-complete-update": 0,
            "schema-cache-directory": schemaCacheDirectory
          };
          if (connectionStatus == "connected") {
            deviceMetaData["added-to-device-list-time"] = currentTime;
          } else {
            deviceMetaData["changed-to-disconnected-time"] = currentTime;
          }
          deviceListMetaData.push(deviceMetaData);
        }
      }
      let stringifiedMetaDataList = JSON.stringify(deviceListMetaData);
      //Writing the metaData list into Elasticsearch
      try {
        await metaDataUtility.writeMetaDataListToElasticsearch(stringifiedMetaDataList);
      } catch (error) {
        console.log(error);
      }
    } else {
      /**
       * UPDATING THE EXISTING METADATA IN ES ACCORDING TO NEW DATA FROM CONTROLLER
       */
      let commonEsElements = [];
      for (let i = 0; i < metaDataListFromElasticSearch.length; i++) {
        let found = false;
        for (let j = 0; j < odlDeviceList.length; j++) {
          if (metaDataListFromElasticSearch[i]['mount-name'] == odlDeviceList[j]["node-id"]) {
            found = true;
            if (metaDataListFromElasticSearch[i]["connection-status"] !==
              odlDeviceList[j]["netconf-node-topology:connection-status"]) {
              if (metaDataListFromElasticSearch[i]["connection-status"] == "unable-to-connect" || metaDataListFromElasticSearch[i]["connection-status"] == 'connecting' && odlDeviceList[j]["netconf-node-topology:connection-status"] == "connected") {
                metaDataListFromElasticSearch[i]["connection-status"] = "connected";
                metaDataListFromElasticSearch[i]['changed-to-disconnected-time'] = null;
                metaDataListFromElasticSearch[i]["added-to-device-list-time"] = currentTime;
                metaDataListFromElasticSearch[i]["number-of-partial-updates-since-last-complete-update"] = 0;
                commonEsElements.push(metaDataListFromElasticSearch[i]);
                break;
              } else if (metaDataListFromElasticSearch[i]["connection-status"] == "connected" && odlDeviceList[j]["netconf-node-topology:connection-status"] == "unable-to-connect" || metaDataListFromElasticSearch[i]["connection-status"] == 'connecting') {
                metaDataListFromElasticSearch[i]["connection-status"] = odlDeviceList[j]["netconf-node-topology:connection-status"];
                metaDataListFromElasticSearch[i]['changed-to-disconnected-time'] = currentTime;
                metaDataListFromElasticSearch[i]["added-to-device-list-time"] = null;
                metaDataListFromElasticSearch[i]["last-complete-control-construct-update-time"] = null;
                metaDataListFromElasticSearch[i]["last-control-construct-notification-update-time"] = null;
                metaDataListFromElasticSearch[i]["number-of-partial-updates-since-last-complete-update"] = 0;
                commonEsElements.push(metaDataListFromElasticSearch[i]);
                break;
              }
            } else {
              if (metaDataListFromElasticSearch[i]["connection-status"] == "connected") {
                commonEsElements.push(metaDataListFromElasticSearch[i]);
              } else {
                // check for meta data retention period. If the "changed-to-disconnected-time" is > "metadataTableRetentionPeriod", the data shall be removed.
                let isDeviceCrossedRetentionPeriod = await metaDataUtility.isDeviceCrossedRetentionPeriod(metaDataListFromElasticSearch[i]["changed-to-disconnected-time"]);
                if (!isDeviceCrossedRetentionPeriod) commonEsElements.push(metaDataListFromElasticSearch[i]);
              }
            }
            break;
          }
        }
        if (!found) {
          if (metaDataListFromElasticSearch[i]["connection-status"] == "connected") {
            metaDataListFromElasticSearch[i]["connection-status"] = "unknown";
            metaDataListFromElasticSearch[i]["changed-to-disconnected-time"] = currentTime;
            metaDataListFromElasticSearch[i]["added-to-device-list-time"] = null
            metaDataListFromElasticSearch[i]["last-complete-control-construct-update-time"] = null
            metaDataListFromElasticSearch[i]["last-control-construct-notification-update-time"] = null
            commonEsElements.push(metaDataListFromElasticSearch[i])
          } else {
            // check for meta data retention period. If the "changed-to-disconnected-time" is > "metadataTableRetentionPeriod", the data shall be removed.
            let isDeviceCrossedRetentionPeriod = await metaDataUtility.isDeviceCrossedRetentionPeriod(metaDataListFromElasticSearch[i]["changed-to-disconnected-time"]);
            if (!isDeviceCrossedRetentionPeriod) commonEsElements.push(metaDataListFromElasticSearch[i]);
          }
        }
      }
      // update new odl elements into meta data table
      let newOdlElements = [];
      for (let i = 0; i < odlDeviceList.length; i++) {
        let found = false;
        for (let j = 0; j < metaDataListFromElasticSearch.length; j++) {
          if (odlDeviceList[i]["node-id"] == metaDataListFromElasticSearch[j]['mount-name']) {
            found = true;
            break;
          }
        }
        if (!found) {
          let mountName = odlDeviceList[i]["node-id"];
          let connectionStatus = odlDeviceList[i]["netconf-node-topology:connection-status"];
          let schemaCacheDirectory = odlDeviceList[i]["netconf-node-topology:schema-cache-directory"];
          if (connectionStatus) {
            let deviceMetaData = {
              "mount-name": mountName,
              "connection-status": connectionStatus,
              "changed-to-disconnected-time": null,
              "added-to-device-list-time": null,
              "last-complete-control-construct-update-time": null,
              "last-control-construct-notification-update-time": null,
              "number-of-partial-updates-since-last-complete-update": 0,
              "schema-cache-directory": schemaCacheDirectory
            };
            if (connectionStatus == "connected") {
              deviceMetaData["added-to-device-list-time"] = currentTime;
            } else {
              deviceMetaData["changed-to-disconnected-time"] = currentTime;
            }
            newOdlElements.push(deviceMetaData);
          }
        }
      }
      let deviceListMetaData = [].concat(newOdlElements, commonEsElements);
      let stringifiedMetaDataList = JSON.stringify(deviceListMetaData);
      await metaDataUtility.writeMetaDataListToElasticsearch(stringifiedMetaDataList)
        .catch((error) => {
          throw error;
        })
    }
    console.log('*******************************************************************************************************');
    console.log('*                             MetaData Table PROCESS PROCEDURE COMPLETED                                        *');
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