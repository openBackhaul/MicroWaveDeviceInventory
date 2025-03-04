
'use strict';

const { strict } = require('assert');
const { setTimeout, clearInterval } = require('timers');
const path = require("path");
const individualServicesService = require("../../IndividualServicesService");


module.exports.MetaDataTableSynchronization = async function MetaDataTableSynchronization() {


  let odlDeviceList;
  let elasticsearchList
  try {
    odlDeviceList = await individualServicesService.getLiveDeviceList();
  } catch (error) {
    console.log(error);
    return;
  }
  try {
    elasticsearchList = await individualServicesService.readMeataListFromElasticsearch();
  } catch (error) {
    console.log(error);
    return;
  }
  let commonEsElements = [];

  for (let i = 0; i < elasticsearchList.length; i++) {
    let found = false;
    for (let j = 0; j < odlDeviceList.length; j++) {
      if (elasticsearchList[i]['mountName'] == odlDeviceList[j]["node-id"]) {
        found = true;
        if (elasticsearchList[i]["connection-status"] !==
          odlDeviceList[j]["netconf-node-topology:connection-status"]) {
          if (elasticsearchList[i]["connection-status"] == "unable-to-connect" || 'connecting' && odlDeviceList[j]["netconf-node-topology:connection-status"] == "connected") {
            elasticsearchList[i]["connection-status"] = "connected"
            elasticsearchList[i]['changed-to-disconnected-time'] = null
            commonEsElements.push(elasticsearchList[i])
            break;

          } else if (elasticsearchList[i]["connection-status"] == "connected" && odlDeviceList[j]["netconf-node-topology:connection-status"] == "unable-to-connect" || 'connecting') {
            elasticsearchList[i]["connection-status"] = odlDeviceList[j]["netconf-node-topology:connection-status"]
            elasticsearchList[i]['timestamp'] = Date.now()
            elasticsearchList[i]["added-to-device-list-time"] = null
            elasticsearchList[i]["last-complete-control-construct-update-time"] = null
            elasticsearchList[i]["last-control-construct-notification-update-time"] = null
            elasticsearchList[i]["update-counter"] = 0
            commonEsElements.push(elasticsearchList[i])
            break;

          }

        } else {
          commonEsElements.push(elasticsearchList[i])
        }

      }
    }
    if (!found) {
      if (elasticsearchList[i]["connection-status"] == "connected") {
        elasticsearchList[i]["connection-status"] = ""
        elasticsearchList[i]["changed-to-disconnected-time"] = Date.now()
        elasticsearchList[i]["added-to-device-list-time"] = null
        elasticsearchList[i]["last-complete-control-construct-update-time"] = null
        elasticsearchList[i]["last-control-construct-notification-update-time"] = null
        elasticsearchList[i]["update-counter"] = 0
        commonEsElements.push(elasticsearchList[i])
      }
      else {
        let currentTime = Date.now()
        let dcTime = elasticsearchList[i]["changed-to-disconnected-time"]
        let diffTime = currentTime - dcTime
        let metadataTableRetentionPeriod=10;//get from profile
        if (!(diffTime > metadataTableRetentionPeriod)) {
          commonEsElements.push(elasticsearchList[i])
        }
      }

    }
  }

  let newOdlElements = [];
  let commonOdlElements = [];
  for (let i = 0; i < odlDeviceList.length; i++) {
    let found = false;
    let newobj = {}
    for (let j = 0; j < elasticsearchList.length; j++) {
      if (odlDeviceList[i]["node-id"] == elasticsearchList[j]['mount-name']) {
        commonOdlElements.push(odlDeviceList[i]);
        found = true;
        break;
      }
    }
    if (!found) {
      newobj["mount-name"] = odlDeviceList[i]["node-id"]
      newobj["connection-status"] = odlDeviceList[i]["netconf-node-topology:connection-status"]
      newobj["changed-to-disconnected-time"] = Date.now()
      newobj["added-to-device-list-time"] = null
      newobj["last-complete-control-construct-update-time"] = null
      newobj["last-control-construct-notification-update-time"] = null
      newobj["update-counter"] = 0
      newOdlElements.push(newobj)
    }
  }
  console.log(newOdlElements, "newodlelem")
  odlDeviceList = [].concat(newOdlElements, commonEsElements);
  console.log("llll", odlDeviceList, "odlele")


  let odlDeviceListString = JSON.stringify(odlDeviceList);
  try {
    await individualServicesService.writeDeviceListToElasticsearch(odlDeviceListString);
  } catch (error) {
    console.log(error);
  }


}

module.exports.newDeviceAddedToDeviceList = async function newDeviceAddedToDeviceList(newodlDeviceList) {

  let elasticsearchList = await individualServicesService.readMeataListFromElasticsearch()

  for (let i = 0; i < newodlDeviceList.length; i++) {
    let found = false;
    let newObj = {}
    for (let j = 0; j < elasticsearchList.length; j++) {

      if (newodlDeviceList[i]['node-id'] == elasticsearchList[j]['mount-name']) {
        found = true
        elasticsearchList[j]["connection-status"] = "connected"
        elasticsearchList[j]["changed-to-disconnected-time"] = null
        elasticsearchList[j]["added-to-device-list-time"] = Date.now()
        elasticsearchList[j]["update-counter"] = 0
        break;
      }
    }
    if (!found) {
      console.log(found, newodlDeviceList[i])
      newObj["mount-name"] = newodlDeviceList[i]["node-id"]
      newObj["connection-status"] = 'connected'
      newObj["changed-to-disconnected-time"] = null
      newObj["added-to-device-list-time"] = Date.now()
      newObj["last-complete-control-construct-update-time"] = null
      newObj["last-control-construct-notification-update-time"] = null
      newObj["update-counter"] = 0
      elasticsearchList.push(newObj)
    }
  }

  let newElasticsearchList = JSON.stringify(elasticsearchList)
  await individualServicesService.writeMetaDataListToElasticsearch(newElasticsearchList)
}

module.exports.deviceIsDeletedduetoPeroidicUpdate = async function deviceIsDeletedduetoPeroidicUpdate(NodeidList, timestamp) {

  let esListFromMetaDataTable = await individualServicesService.readMeataListFromElasticsearch()

  for (let i = 0; i < NodeidList.length; i++) {
    let controlerStatusOfNodeid = odlDeviceList.filter(ele => ele["node-id"] == NodeidList[i]['node-id'])

    let found = false;
    let newObj = {}
    for (let j = 0; j < esListFromMetaDataTable.length; j++) {
      if (NodeidList[i]['node-id'] == esListFromMetaDataTable[j]['mount-name']) {
        found = true
        esListFromMetaDataTable[i]["connection-status"] = controlerStatusOfNodeid[0]["netconf-node-topology:connection-status"]
        esListFromMetaDataTable[i]["changed-to-disconnected-time"] = timestamp
        esListFromMetaDataTable[i]["added-to-device-list-time"] = null
        esListFromMetaDataTable[i]["last-complete-control-construct-update-time"] = null
        esListFromMetaDataTable[i]["last-control-construct-notification-update-time"] = null
        esListFromMetaDataTable[i]["update-counter"] = 0
        break;
      }
    }
    if (!found) {
      newObj["connection-status"] = controlerStatusOfNodeid[0]["netconf-node-topology:connection-status"]
      newObj["changed-to-disconnected-time"] = timestamp
      newObj["added-to-device-list-time"] = null
      newObj["last-complete-control-construct-update-time"] = null
      newObj["last-control-construct-notification-update-time"] = null
      newObj["update-counter"] = 0
      newObj["schema-cache-directory"] = null
      esListFromMetaDataTable.push(newObj)

    }
  }


  let newListFromMetaDataTable = JSON.stringify(esListFromMetaDataTable)
  await individualServicesService.writeMetaDataListToElasticsearch(newListFromMetaDataTable)
}

module.exports.deviceIsDeletedduetoNotificationUpdate = async function deviceIsDeletedduetoNotificationUpdate(Nodeid, connectionStatus, notificationTimestamp) {
  let newObj = {}
  let newodlDeviceList = []
  let elasticsearchList = await individualServicesService.readMeataListFromElasticsearch()


  try {
    newodlDeviceList = await individualServicesService.getLiveDeviceList();
  } catch (error) {
    console.log(error);
    return;
  }

  const controlerStatusOfNodeid = newodlDeviceList.filter(ele => ele["node-id"] == Nodeid)
  console.log(controlerStatusOfNodeid)

  for (let i = 0; i < elasticsearchList.length; i++) {
    if (elasticsearchList[i]["mount-name"] == Nodeid) {
      if (connectionStatus == 'connected') {
        elasticsearchList[i]["connection-status"] = 'connected'
        elasticsearchList[i]["changed-to-disconnected-time"] = null
        break;
      } else {
        elasticsearchList[i]["connection-status"] = controlerStatusOfNodeid[0]["netconf-node-topology:connection-status"]
        elasticsearchList[i]["changed-to-disconnected-time"] = notificationTimestamp
        elasticsearchList[i]["added-to-device-list-time"] = null
        elasticsearchList[i]["update-counter"] = 0
        elasticsearchList[i]["last-complete-control-construct-update-time"] = null
        elasticsearchList[i]["last-control-construct-notification-update-time"] = null
        break;
      }
    } else {
      if (connectionStatus == 'connected') {
        newObj["mount-name"] = Nodeid
        newObj["connection-status"] = 'connected'
        newObj["changed-to-disconnected-time"] = null
        newObj["added-to-device-list-time"] = null
        newObj["update-counter"] = 0
        newObj["schema-cache-directory"] = null
        elasticsearchList.push(newObj)
        break;
      } else {
        newObj["mount-name"] = Nodeid
        newObj["connection-status"] = controlerStatusOfNodeid[0]["netconf-node-topology:connection-status"]
        newObj["changed-to-disconnected-time"] = notificationTimestamp
        newObj["added-to-device-list-time"] = null
        newObj["update-counter"] = 0
        newObj["schema-cache-directory"] = null
        newObj["last-complete-control-construct-update-time"] = null
        newObj["last-control-construct-notification-update-time"] = null

        elasticsearchList.push(newObj)
        break;
      }
    }
  }




  let newElasticsearchList = JSON.stringify(elasticsearchList)
  await individualServicesService.writeMetaDataListToElasticsearch(newElasticsearchList)
}

module.exports.MDTableUpdateDuetoCompleteControConstruct = async function MDTableUpdateDuetoCompleteControConstruct(nodeId, currentTimestamp) {

  let elasticsearchList

  try {
    elasticsearchList = await individualServicesService.readMeataListFromElasticsearch()
  } catch (error) {
    console.log(error);
    return;
  }

  for (let i = 0; i < elasticsearchList.length; i++) {
    if (elasticsearchList[i]["mount-name"] == nodeId) {
      elasticsearchList[i]["last-complete-control-construct-update-time"] = currentTimestamp
      elasticsearchList[i]["update-counter"] = 0
    }
  }
}

module.exports.MDTableUpdateDuetoPartialControConstruct = async function MDTableUpdateDuetoPartialControConstruct(nodeId, currentTimestamp) {

  let elasticsearchList

  try {
    elasticsearchList = await individualServicesService.readMeataListFromElasticsearch()
  } catch (error) {
    console.log(error);
    return;
  }

  for (let i = 0; i < elasticsearchList.length; i++) {
    if (elasticsearchList[i]["mount-name"] == nodeId) {
      elasticsearchList[i]["last-complete-control-construct-update-time"] = currentTimestamp
      elasticsearchList[i]["update-counter"] = elasticsearchList[i]["update-counter"] + 1
    }
  }
}