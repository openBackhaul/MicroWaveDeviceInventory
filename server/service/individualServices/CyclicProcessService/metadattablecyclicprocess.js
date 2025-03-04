
const { MetaDataTableSynchronization } = require('./metadatafunction.js');

let metaDatTableListSyncPeriod = 10;
//get it from profile instance(as of now it is not preesnt in profile list so already raised issue in github)
module.exports.MetadataTableprocess = async function MetadataTableprocess() {
    
    let odlDeviceList;
     try {
        odlDeviceList = await individualServicesService.getLiveDeviceList();
     } catch (error) {
         console.log(error);
         return;
     }
  
   let deviceListMetaData = [];
   try {
   elasticsearchList = await individualServicesService.readMeataListFromElasticsearch();
   }catch (error) {
    console.log(error);
    return;
}
 
    console.log('*******************************************************************************************************');
    console.log('*                             MetaData Table PROCESS PROCEDURE STARTED                                        *');
    console.log('*                                                                                                     *');
    console.log('*                                 ( ' + getTime() + ' )                                             *');
    console.log('*                                                                                                     *');
    console.log('*******************************************************************************************************');

   if(elasticsearchList.length !== 0){
   for (let i = 0; i < odlDeviceList.length; i++) {
     deviceListMetaData.push({ "mount-name": odlDeviceList[i]["node-id"],
         "connection-status":odlDeviceList[i]["netconf-node-topology:connection-status"],
         "timestamp":Date.now(),
         "update-counter":0,
         "schema-cache-directory":null
      });
   }
   let odlDeviceListMetaData = deviceListMetaData;
  
      let odlDeviceListString = JSON.stringify(odlDeviceListMetaData);
     try {
        await individualServicesService.writeMetaDataListToElasticsearch(odlDeviceListString);
     } catch (error) {
         console.log(error);
     }
   }
  else{

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
   
    odlDeviceList = [].concat(newOdlElements, commonEsElements);
    console.log("llll", odlDeviceList, "odlele")
  
  
    let odlDeviceListString = JSON.stringify(odlDeviceList);
    try {
      await individualServicesService.writeDeviceListToElasticsearch(odlDeviceListString);
    } catch (error) {
      console.log(error);
    }
  
  }  
    
     //
    // Periodic Synchronization
    //
    const periodicSynchTime = metaDatTableListSyncPeriod * 3600 * 1000;
    periodicSynchTimerId = setInterval(MetaDataTableSynchronization, periodicSynchTime);
    //
 }
