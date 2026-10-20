'use strict';

// ONF Libs
const tcpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpServerInterface');
const onfAttributeFormatter = require('onf-core-model-ap/applicationPattern/onfModel/utility/OnfAttributeFormatter');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const logicalTerminationPoint = require('onf-core-model-ap/applicationPattern/onfModel/models/LogicalTerminationPoint');
const tcpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpClientInterface');
const ForwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const FcPort = require('onf-core-model-ap/applicationPattern/onfModel/models/FcPort');
const LogicalTerminationPoint = require('onf-core-model-ap/applicationPattern/onfModel/models/LogicalTerminationPoint');
const OperationClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationClientInterface');
const profileCollection = require('onf-core-model-ap/applicationPattern/onfModel/models/ProfileCollection');
const fileProfileOperation = require('onf-core-model-ap/applicationPattern/onfModel/models/profile/FileProfile')
const HttpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpServerInterface');
const RequestBuilder = require('onf-core-model-ap/applicationPattern/rest/client/RequestBuilder');
const executionAndTraceService = require('onf-core-model-ap/applicationPattern/services/ExecutionAndTraceService');
const responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
const RequestHeader = require('onf-core-model-ap/applicationPattern/rest/client/RequestHeader');
const { getIndexAliasAsync, createResultArray, elasticsearchService } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');

// Extra Libs
const urlf = require('url');
const fs = require('fs');
const crypto = require("crypto");
const axios = require('axios');
const createHttpError = require('http-errors');
const metaDataUtility = require('./individualServices/CyclicProcessService/metaDataUtility');
const deviceMetadataUtility = require('./individualServices/CyclicProcessService/DeviceMetaDataProcess/deviceMetaDataUtility');
const elkUtility = require('./individualServices/elasticSearchUtility');
const utility = require('./individualServices/utility');
const deviceMetadataCacheUpdate = require('./individualServices/CyclicProcessService/DeviceMetaDataProcess/DeviceMetaDataCacheUpdate')
const RestClient = require('./individualServices/rest/client/dispacher');
const cacheResponse = require('./individualServices/cacheResponseBuilder');
const cacheUpdate = require('./individualServices/cacheUpdateBuilder');
const fieldsManager = require('./individualServices/fieldsManagement');
const subscriberManagement = require('./individualServices/SubscriberManagement');
const inputValidation = require('./individualServices/InputValidation');
const notificationManagement = require('./individualServices/NotificationManagement');
const bequeathHandler = require('./individualServices/BequeathYourDataAndDieHandler');
const alarmHandler = require('./individualServices/alarmUpdater')
const { updateDeviceListFromNotification } = require('./individualServices/CyclicProcessService/cyclicProcess');
const { getDeviceListInMemory } = require('./individualServices/CyclicProcessService/cyclicProcess');

const slidingWindowHandler = require('./individualServices/CyclicProcessService/DeviceMetaDataProcess/SlidingWindowHandler');

const logger = require('./LoggingService.js').getLogger();
const { Mutex } = require("async-mutex");
const lock = new Mutex();

const v8 = require("v8");
// ---------------------------------------------------------

let lastSentMessages = [];
const SUBSCRIBER_NOTIFICATION_TIMEOUT_MS = Number(process.env.SUBSCRIBER_NOTIFICATION_TIMEOUT_MS) || 30000;

// ------ Constants definition
// -- Application
const OPENDAYLIGHT_STR = "OpenDayLight";
const ELASTICSEARCH_STR = "ElasticSearch";

// -- Control-construct
const NODE_ID = "node-id";
const CTR_CONST = "control-construct";
const CORE_MODEL = "core-model-1-4:link";
const END_POINT_LIST = "end-point-list";

const USE_FAST_ROUTINES = process.env.FAST_ROUTINES?.toLowerCase() === 'true';
const USE_ELK_PIPELINE = process.env.ELK_PIPELINE?.toLowerCase() === 'true';


/**
 * Initiates process of embedding a new release
 *
 * body V1_bequeathyourdataanddie_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.bequeathYourDataAndDie = function (url, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {

      await bequeathHandler.handleRequest(body, url);
      resolve();
    } catch (error) {
      logger.error(error);
    }
  });
}

/**
 * Deletes Link from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * no response value expected for this operation
 **/
exports.deleteCachedLink = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      url = decodeURIComponent(url);
      let correctLink = null;
      let link = decodeLinkUuid(url, true);
      if (typeof link === 'object') {
        logger.error("deleteCachedLink - Link: " + link);
        throw new createHttpError(link[0].code, link[0].message);
        return;
      } else {
        correctLink = link;
      }

      logger.info("deleteCachedLink - Read from ELK: " + correctLink);
      let result = await elkUtility.readRecords(correctLink);
      if (result != undefined) {
        let ret = await elkUtility.deleteRequest(correctLink);
        let listLink = await elkUtility.readRecords("linkList");
        if (listLink.LinkList.includes(correctLink)) {
          let indexToRemove = listLink.LinkList.indexOf(correctLink);
          listLink.LinkList.splice(indexToRemove, 1);
          let elapsedTime = await elkUtility.recordRequest(listLink, "linkList");
        }
        resolve();
      } else {
        let listLink = await elkUtility.readRecords("linkList");
        if (listLink != undefined) {
          if (listLink.LinkList.includes(correctLink)) {
            let indexToRemove = listLink.LinkList.indexOf(correctLink);
            listLink.LinkList.splice(indexToRemove, 1);
            let elapsedTime = await elkUtility.recordRequest(listLink, "linkList");
          }
        } else {
          throw new createHttpError(461, "Not available. The topology (parent) object is currently not found in the cache.");
        }
      }
    } catch (error) {
      reject(error);
    }
  });
}


/**
 * Deletes LinkPort from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * uuid String Instance identifier that is unique within the device
 * localId String Instance identifier that is unique within its list
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * no response value expected for this operation
 **/
exports.deleteCachedLinkPort = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      url = decodeURIComponent(url);
      let correctLink = null;
      let link = uuid;//decodeLinkUuid(url, true);
      let id = localId;
      const format = /[ `!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?~]/;
      const matchLink = format.test(link);
      const matchId = format.test(id);
      if (typeof link === 'object') {
        throw new createHttpError(link[0].code, link[0].message);
      } else {
        correctLink = link;
      }
      if (matchLink || matchId) {
        throw new createHttpError("400", "Fields must not contain special chars");
      }

      let result = await elkUtility.readRecords(correctLink);
      if (result != undefined) {
        let objectKey = Object.keys(result)[0];
        if (result[objectKey][0] && Array.isArray(result[objectKey][0]["link-port"])) {
          const index = result[objectKey][0]["link-port"].findIndex(port => port["local-id"] === id);
          if (index !== -1) {
            result[objectKey][0]["link-port"] = result[objectKey][0]["link-port"].filter(port => port["local-id"] !== id)
            let elapsedTime = await elkUtility.recordRequest(result, correctLink);
          } else {
            throw new createHttpError(471, "(Child) topology object not existing. Cache informs about addressed resource unknown.");
          }
        } else {
          throw new createHttpError(471, "(Child) topology object not existing. Cache informs about addressed resource unknown.");
        }
      } else {
        throw new createHttpError(461, "Not available. The topology (parent) object is currently not found in the cache.");
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// -----------------------------------------------------------------------
async function getQualityMeasurementSampleNumber() {
  let profileInstance = await utility.getIntegerProfileForIntegerName("qualityMeasurementSampleNumber");
  let qualityMeasurementSampleNumber = profileInstance[onfAttributes.INTEGER_PROFILE.PAC][onfAttributes.INTEGER_PROFILE.CONFIGURATION][onfAttributes.INTEGER_PROFILE.INTEGER_VALUE];
  return qualityMeasurementSampleNumber;
}


/**
 * Provides quality statistics for the cache
 *
 * body Body_12 If no requestBody is provided, the service returns a single aggregated record (optional)
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]'
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200_9
 **/
exports.provideCacheQualityStatistics = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      let aggregatedResponse = [];
      let cacheQualityStatistics = await elkUtility.readRecords("cache-quality-statistics");
      if (cacheQualityStatistics != undefined) {
        let qualityMeasurementSampleNumber = await getQualityMeasurementSampleNumber();
        //if (cacheQualityStatistics["cache-quality-statistics"].length < qualityMeasurementSampleNumber) {
        if (cacheQualityStatistics["cache-quality-statistics"].length < 1) {
          throw new createHttpError(530, 'Data invalid. Response data not available, incomplete or corrupted');
        }
        if (body) {
          if (body["group-by"]) {
            aggregatedResponse = aggregateData(cacheQualityStatistics["cache-quality-statistics"], true)
          } else {
            aggregatedResponse = [aggregateData(cacheQualityStatistics["cache-quality-statistics"])]
          }
          resolve({ "cache-quality-statistics": aggregatedResponse });
        } else {
          throw new createHttpError(500, "Error in Elasticsearch communication or no cacheQualityStatistics available");
        }
      } else {
        throw new createHttpError(530, 'Data invalid. Response data not available, incomplete or corrupted');
      }
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
}

function aggregateData(data, summarizeByDevice = false) {
  if (!summarizeByDevice) {
    // Case 1: No input --> aggregate everything
    let deviceCount = 1;
    return data.reduce((device, item) => {
      device["device-type"] = "all";
      device["attribute-mismatches"] += item["attribute-mismatches"] || 0;
      device["attribute-class-mismatches"] += item["attribute-class-mismatches"] || 0;
      device["weighted-score"] += item["weighted-score"] || 0;
      device["device-count"] = deviceCount++;
      return device;
    }, {
      "device-type": "all",
      "attribute-mismatches": 0,
      "attribute-class-mismatches": 0,
      "weighted-score": 0,
      "device-count": 0
    });
  }
  else {
    // Case 2: Input given → group by device-type
    let summary = [];
    let result = {};
    data.forEach(item => {
      console.log(item["mount-name"]);
      const deviceType = item["device-type"];

      if (!result[deviceType]) {
        result[deviceType] = {
          "device-type": deviceType,
          "attribute-mismatches": 0,
          "attribute-class-mismatches": 0,
          "weighted-score": 0,
          "device-count": 0
        };
      }
      result[deviceType]["attribute-mismatches"] += item["attribute-mismatches"] || 0;
      result[deviceType]["attribute-class-mismatches"] += item["attribute-class-mismatches"] || 0;
      result[deviceType]["weighted-score"] += item["weighted-score"] || 0;
      result[deviceType]["device-count"] = result[deviceType]["device-count"] + 1;
    });

    for (const [key, value] of Object.entries(result)) {
      summary.push(value);
      console.log(`${key}: ${value}`);
    }
    return Object.values(summary);
  }
}

/**
 * Provides data of linkports in cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200_7
 **/
exports.provideDataOfLinkPorts = function (user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      const responseLinkList = [];
      const linkListRecord = await elkUtility.readRecords("linkList");
      if (linkListRecord != undefined) {
        const linkUuidList = linkListRecord.LinkList;
        for (let i = 0; i < linkUuidList.length; i++) {
          let linkUuid = linkUuidList[i];
          const linkRecordForLinkUuid = await elkUtility.readRecords(linkUuid);
          if (linkRecordForLinkUuid != undefined) {
            const link = linkRecordForLinkUuid["core-model-1-4:link"][0];
            if (link.hasOwnProperty("forwarding-domain")) {
              const linkRecord = {
                "uuid": link["uuid"],
                "link-port": link["link-port"]
              }
              responseLinkList.push(linkRecord);
            }
          }
        }

        resolve({
          "core-model-1-4:link-ports": responseLinkList
        });
      } else {
        throw new createHttpError(500, "Error in Elasticsearch communication or no linkList available");
      }
    } catch (error) {
      logger.error(error);
      reject(error);
    }
  });
}

//to add
/**
 * Provides data of (filtered) links in cache
 *
 * body V1_providedataofalllinks_body  (optional)
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200_6
 **/
exports.provideDataOfLinks = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      const requestedLinkType = body["link-type"];

      const responseLinkList = [];
      const linkListRecord = await elkUtility.readRecords("linkList");
      if (linkListRecord != undefined) {
        const linkUuidList = linkListRecord.LinkList;
        let linkType = "";
        for (let i = 0; i < linkUuidList.length; i++) {
          let linkUuid = linkUuidList[i];
          let linkRecordForLinkUuid = await elkUtility.readRecords(linkUuid);
          if (linkRecordForLinkUuid != undefined) {
            let link = linkRecordForLinkUuid["core-model-1-4:link"][0];

            if (link.hasOwnProperty("forwarding-domain")) {
              linkType = "generic";
            } else {
              linkType = "minimumForRest";
            }

            if (linkType == requestedLinkType) {
              responseLinkList.push(link);
            }
          }
        }

        resolve({
          "core-model-1-4:link": responseLinkList
        });
      } else {
        throw new createHttpError(500, "Error in Elasticsearch communication or no linkList available");
      }

    } catch (error) {
      logger.error(error);
      reject(error);
    }
  });
}

//to add
/**
 * Provides metadata status table of devices
 *
 * body V1_providedevicestatusmetadata_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200_8
 **/
exports.provideDeviceStatusMetadata = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      let responseMetaDataList = [];
      let mountNameListFromRequestBody = body["mount-name-list"];
      if (mountNameListFromRequestBody) {
        if (mountNameListFromRequestBody.length > 0) {
          await deviceMetadataCacheUpdate.deviceMetaDataListSync();
          let metaDataListFromElasticSearch = await deviceMetadataCacheUpdate.getDeviceMetaDataList();
          for (let i = 0; i < mountNameListFromRequestBody.length; i++) {
            let mountName = mountNameListFromRequestBody[i];
            for (let j = 0; j < metaDataListFromElasticSearch.length; j++) {
              let metaDataMountName = metaDataListFromElasticSearch[j]["mount-name"];
              if (metaDataMountName == mountName) {
                responseMetaDataList.push(metaDataListFromElasticSearch[j]);
                break;
              }
            }
          }
          responseMetaDataList = responseMetaDataList.map(metadata => {
            let stringifiedData = JSON.stringify(metadata);
            let convertedData = stringifiedData.replace(/:null/g, ':"null"');
            return JSON.parse(convertedData);
          });
        }
      }
      resolve({
        "device-status-metadata": responseMetaDataList
      });
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
}

/**
 * Provides list of actual equipment UUIDs inside a device
 *
 * body V1_providelistofactualdeviceequipment_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200_2
 **/
exports.provideListOfActualDeviceEquipment = function (url, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      let urlParts = url.split("?fields=");
      let mountName = body['mount-name'];
      let equipmentType;
      if (mountName == "") {
        throw new createHttpError.BadRequest("mount-name must not be empty");
      }
      const appNameAndUuidFromForwarding = await RequestForListOfActualDeviceEquipmentCausesReadingFromCache(mountName)
      const finalUrl = formatUrlForOdl(decodeURIComponent(appNameAndUuidFromForwarding[0].url), urlParts[1]);
      let returnObject = {};
      let parts = finalUrl.split("?fields=");
      let myFields = parts[1];
      let result = await elkUtility.readRecords(mountName);
      if (result != undefined) {
        let finalJson = cacheResponse.cacheResponseBuilder(parts[0], result);
        if (finalJson != undefined) {
          modifyReturnJson(finalJson);
          let objectKey = Object.keys(finalJson)[0];
          finalJson = finalJson[objectKey];
          if (myFields != undefined) {
            var objList = [];
            var rootObj = { value: "root", children: [] }
            var ret = fieldsManager.decodeFieldsSubstringExt(myFields, 0, rootObj)
            objList.push(rootObj)
            fieldsManager.getFilteredJsonExt(finalJson, objList[0].children);
          }
          const transformedData = {
            "top-level-equipment": finalJson[0]["top-level-equipment"],
            "actual-equipment-list": finalJson[0]["equipment"].map((item) => {
              equipmentType = item["actual-equipment"]?.["manufactured-thing"]?.["equipment-type"]?.["type-name"]
              if (equipmentType) {
                return {
                  uuid: item.uuid,
                  "equipment-type-name": equipmentType,
                }
              }
            }).filter((item) => { return item !== undefined })
          };
          returnObject = transformedData;
        } else {
          throw new createHttpError(404, `unable to fetch records for mount-name ${mountName}`);
        }
      } else {
        throw new createHttpError(460, `Requested device is currently not in connected state at the controller`);

      }
      resolve(returnObject);
    } catch (error) {
      reject(error);
    }
  });
}

async function RequestForListOfActualDeviceEquipmentCausesReadingFromCache(mountName) {
  try {
    const forwardingName = "RequestForListOfActualDeviceEquipmentCausesReadingFromCache";
    const forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);

    let fcPortOutputDirectionLogicalTerminationPointList = [];
    const fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
    for (const fcPort of fcPortList) {
      const portDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
      if (FcPort.portDirectionEnum.OUTPUT === portDirection) {
        fcPortOutputDirectionLogicalTerminationPointList.push(fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
      }
    }

    let applicationNameList = [];
    let urlForEs = "/control-construct={mountName}?fields=top-level-equipment;equipment(uuid;actual-equipment(manufactured-thing(equipment-type(type-name))))"
    let correctUrl = urlForEs.replace("{mountName}", mountName);

    for (const opLtpUuid of fcPortOutputDirectionLogicalTerminationPointList) {
      const httpLtpUuidList = await LogicalTerminationPoint.getServerLtpListAsync(opLtpUuid);
      const httpClientLtpUuid = httpLtpUuidList[0];
      let applicationName = 'api';
      const path = await OperationClientInterface.getOperationNameAsync(opLtpUuid);
      const key = await OperationClientInterface.getOperationKeyAsync(opLtpUuid)
      let url = "";
      let tcpConn = "";

      applicationName = ELASTICSEARCH_STR; // "ElasticSearch";
      tcpConn = await getTcpClientConnectionInfoAsync(opLtpUuid);
      url = tcpConn + correctUrl;

      const applicationNameData = applicationName === undefined ? {
        applicationName: null,
        httpClientLtpUuid,
        url: null, key: null
      } : {
        applicationName,
        httpClientLtpUuid,
        url, key
      };
      applicationNameList.push(applicationNameData);
    }
    return applicationNameList;
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Provides list of devices for which MWDI has a ControlConstruct in its cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customerâ€™s journey to which the execution applies
 * returns inline_response_200_10
 **/
exports.provideListOfCachedDevices = function (user, originator, xCorrelator, traceIndicator, customerJourney) {
  /* return new Promise(async function (resolve, reject) {
    try {
      const excludeMountNames = ["DeviceMetaDataList", "DeviceList", "MetaDataList", "cache-quality-statistics"].map(s => s.toLowerCase());

      let result = await elkUtility.readIdsFromEs();
      result = result.filter(d => !excludeMountNames.includes(String(d).toLowerCase())).map(d => ({ "mount-name": d }));
      if (result != undefined) {
        const outputJson = {
          "mount-name-list": result
        };
        resolve(outputJson);
      } else {
        throw new createHttpError.NotFound("Device list not found");
      }
    } catch (error) {
      reject(error);
    }
  }); */
  return new Promise(async function (resolve, reject) {
    try {
      const excludeMountNames = new Set(
        ["DeviceMetaDataList", "DeviceList", "MetaDataList", "cache-quality-statistics"]
          .map(s => s.toLowerCase())
      );

      const ids = await elkUtility.readIdsFromEs();

      const mountList = [];
      for (const id of ids) {
        const lower = String(id).toLowerCase();
        if (!excludeMountNames.has(lower)) {
          mountList.push(id);
        }
      }

      if (mountList.length > 0) {
        resolve({ "mount-name-list": mountList });
      } else {
        throw new createHttpError.NotFound("Device list not found");
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Provides list of devices that are connected to the controller
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200
 **/
exports.provideListOfConnectedDevices = function (url, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      // await deviceMetadataCacheUpdate.deviceMetaDataListSync(); // Doesn't exists
      // let metaDataListFromElasticSearch = await deviceMetadataCacheUpdate.getDeviceMetaDataList();
      let metaDataListFromElasticSearch = await elkUtility.readRecords("DeviceMetaDataList");
      if (metaDataListFromElasticSearch["DeviceMetaDataList"] == undefined) {
        throw new createHttpError.NotFound("Device list not found");
      } else {
        metaDataListFromElasticSearch = metaDataListFromElasticSearch["DeviceMetaDataList"];
      }
      const result = metaDataListFromElasticSearch.filter(d => d["connection-status"] == "connected").map(d => d["mount-name"]);
      if (result != undefined) {
        const outputJson = {
          "mount-name-list": result
        };
        resolve(outputJson);
      } else {
        throw new createHttpError.NotFound("Device list not found");
      }
    } catch (error) {
      reject(error);
    }
  });
}


/**
 * Provides list of LTP UUIDs at a device
 *
 * body V1_providelistofdeviceinterfaces_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200_1
 **/
exports.provideListOfDeviceInterfaces = function (url, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      let urlParts = url.split("?fields=");
      let mountName = body['mount-name'];
      if (mountName == "") {
        throw new createHttpError.BadRequest("mount-name must not be empty");
      }
      const appNameAndUuidFromForwarding = await RequestForListOfDeviceInterfacesCausesReadingFromCache(mountName)
      const finalUrl = formatUrlForOdl(decodeURIComponent(appNameAndUuidFromForwarding[0].url), urlParts[1]);
      let returnObject = {};
      let toChangeObject = {};
      let parts = finalUrl.split("?fields=");
      let myFields = parts[1];
      let result = await elkUtility.readRecords(mountName);
      if (result != undefined) {
        let finalJson = cacheResponse.cacheResponseBuilder(parts[0], result);
        if (finalJson != undefined) {
          modifyReturnJson(finalJson);
          let objectKey = Object.keys(finalJson)[0];
          finalJson = finalJson[objectKey];
          if (myFields != undefined) {
            myFields = decodeURIComponent(myFields);
            var objList = [];
            var rootObj = { value: "root", children: [] }
            var ret = fieldsManager.decodeFieldsSubstringExt(myFields, 0, rootObj)
            objList.push(rootObj)
            fieldsManager.getFilteredJsonExt(finalJson, objList[0].children);
          }
          toChangeObject["logical-termination-point-list"] = finalJson[0][Object.keys(finalJson[0])];
          const transformedData = {
            "logical-termination-point-list": toChangeObject["logical-termination-point-list"].map((item) => {
              return {
                "uuid": item.uuid || "",
                "local-id": item["layer-protocol"][0]["local-id"] || "",
                "layer-protocol-name": item["layer-protocol"][0]["layer-protocol-name"] || "",
              };
            }),
          };
          returnObject = transformedData;
        } else {
          throw new createHttpError(404, `unable to fetch records for mount-name ${mountName}`);
        }
      } else {
        throw new createHttpError(460, `Requested device is currently not in connected state at the controller`);
      }
      resolve(returnObject);
    } catch (error) {
      reject(error);
    }
  });
}

//to add
/**
 * Provides list of link ports in cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200_5
 **/
exports.provideListOfLinkPorts = function (user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      let responseLinkList = [];
      let linkListRecord = await elkUtility.readRecords("linkList");
      if (linkListRecord != undefined) {
        let linkUuidList = linkListRecord.LinkList;
        for (let i = 0; i < linkUuidList.length; i++) {
          let linkUuid = linkUuidList[i];
          let linkRecordForLinkUuid = await elkUtility.readRecords(linkUuid);
          if (linkRecordForLinkUuid != undefined) {
            let link = linkRecordForLinkUuid["core-model-1-4:link"][0];
            let linkRecord = {};
            if (link.hasOwnProperty("forwarding-domain")) {
              let linkPortList = link["link-port"].map(linkPort => linkPort["local-id"]);
              let responseObject = {
                "link-uuid": linkUuid,
                "link-port": linkPortList
              }
              responseLinkList.push(responseObject);
            }
          }
        }
        resolve({ "link-port-list": responseLinkList });
      } else {
        throw new createHttpError(500, "Error in Elasticsearch communication or no linkList available");
      }

    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
}

//to add
/**
 * Provides list of links in cache
 *
 * body V1_providelistoflinks_body  (optional)
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200_4
 **/
exports.provideListOfLinks = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      let requestedLinkType = body["link-type"];

      let responseLinkList = [];
      let linkListRecord = await elkUtility.readRecords("linkList");
      if (linkListRecord != undefined) {
        let linkUuidList = linkListRecord.LinkList;
        let linkType = "";
        for (let i = 0; i < linkUuidList.length; i++) {
          let linkUuid = linkUuidList[i];
          let linkRecordForLinkUuid = await elkUtility.readRecords(linkUuid);
          if (linkRecordForLinkUuid != undefined) {
            let link = linkRecordForLinkUuid["core-model-1-4:link"][0];

            if (link.hasOwnProperty("forwarding-domain")) {
              linkType = "generic";
            } else {
              linkType = "minimumForRest";
            }

            if (linkType == requestedLinkType) {
              responseLinkList.push(linkUuid);
            }
          }
        }
        resolve({
          "link-list": responseLinkList
        });
      } else {
        throw new createHttpError(500, "Error in Elasticsearch communication or no linkList available");
      }

    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
}


/**
 * Provides list of Links between the same ControlConstructs
 *
 * body V1_providelistofparallellinks_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200_3
 **/
exports.provideListOfParallelLinks = function (url, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      let index = 0;
      let index1 = 0;
      let linkId = body['link-id'];
      if (linkId == "") {
        throw new createHttpError.BadRequest("Link-id must not be empty");
      }
      let parallelLink = [linkId];
      let linkToCompare = await elkUtility.readRecords(linkId);
      if (linkToCompare == undefined) {
        throw new createHttpError(461, `Not available. The topology (parent) object is currently not found in the cache.`);
      }
      if (!linkToCompare[CORE_MODEL][0][END_POINT_LIST]) {
        index = 1;
      }
      const controlConstructList = linkToCompare[CORE_MODEL][index][END_POINT_LIST].map(endpoint => endpoint[CTR_CONST]);
      let result = await elkUtility.readRecords("linkList");
      for (var link of result.LinkList) {
        if (link != linkId) {
          let resLink = await elkUtility.readRecords(link);
          try {
            if (!resLink[CORE_MODEL][0][END_POINT_LIST]) {
              index1 = 1;
            }
            const ccList = resLink[CORE_MODEL][index1][END_POINT_LIST].map(endpoint => endpoint[CTR_CONST]);
            if (arraysHaveSameElements(controlConstructList, ccList)) {
              parallelLink.push(link);
            }
          } catch (error) {
            throw new createHttpError(error);
          }
        }
      }
      const outputJson = { "parallel-link-list": parallelLink };
      resolve(outputJson);
    } catch (error) {
      reject(error);
    }
  });
}


/**
 * Writes LinkPort to cache
 *
 * body Linkuuid_linkportlocalId_body 
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * uuid String Instance identifier that is unique within the device
 * localId String Instance identifier that is unique within its list
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.putLinkPortToCache = function (url, body, fields, uuid, localId, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      const startsWithCoreLink = (obj) => {
        return Object.keys(obj)[0].includes("link");
      };
      if (!startsWithCoreLink(body)) {
        throw new createHttpError[400]("Bad Request");
      }
      url = decodeURIComponent(url);
      let correctLink = null;
      let link = uuid; //decodeLinkUuid(url, true);
      const format = /[ `!@#$%^&*()+\=\[\]{};':"\\|,.<>\/?~]/;
      const matchLink = format.test(link);
      if (typeof link === 'object') {
        logger.error("putLinkPortToCache - link is an object" + link);
        throw new createHttpError(link[0].code, link[0].message);
        return;
      } else {
        correctLink = link;
      }
      if (matchLink) {
        throw new createHttpError("400", "Fields must not contain special chars");
      }

      let value = await elkUtility.readRecords(correctLink);
      let result = await elkUtility.readRecords("linkList");
      if (value != undefined) {
        let objectKey = Object.keys(body)[0];
        let valueObjKey = Object.keys(value)[0];
        let bodyCore = body[objectKey];
        if (value[valueObjKey][0] && Array.isArray(value[valueObjKey][0]["link-port"])) {
          for (let i = 0; i < bodyCore.length; i++) {
            const linkPortArray = value[valueObjKey][0]["link-port"].push(
              bodyCore[i]
            );
          }
        } else {
          value[valueObjKey].forEach(link => {
            link["link-port"] = bodyCore;
          });
          //value[valueObjKey][0].push("link-port"[bodyCore]);
        }
        let elapsedTime = await elkUtility.recordRequest(value, correctLink);
      } else {
        throw new createHttpError(461, "Not available. The topology (parent) object is currently not found in the cache.");
      }
      resolve();
    } catch (error) {
      logger.error(error);
      reject(error);
    }
  });
}


/**
 * Writes Link to cache
 *
 * body Coremodel14networkcontroldomaincache_linkuuid_body 
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * uuid String Instance identifier that is unique within the device
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.putLinkToCache = function (url, body, fields, uuid, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      const startsWithCoreLink = (obj) => {
        return Object.keys(obj)[0].includes("link");
      };
      if (!startsWithCoreLink(body)) {
        throw new createHttpError[400]("Bad Request");
      }
      let correctLink = null;
      let link = decodeLinkUuid(url, true);
      if (typeof link === 'object') {
        logger.error("putLinkToCache - link: " + link);
        throw new createHttpError(link[0].code, link[0].message);
        return;
      } else {
        correctLink = link;
      }
      let elapsedTime = await elkUtility.recordRequest(body, correctLink);

      logger.info("putLinkToCache - Read from ELK: " + correctLink);
      let result = await elkUtility.readRecords("linkList");
      if (result == undefined) {
        logger.warn("link list in Elasticsearch not found");
        const myObject = { LinkList: [] };
        myObject.LinkList.push(correctLink);
        let elapsedTime = await elkUtility.recordRequest(myObject, "linkList");
      } else {
        let linkListArray = result["LinkList"];
        // Verify if link already exists in linklist
        if (!linkListArray.includes(correctLink)) {
          result.LinkList.push(correctLink);
          let elapsedTime = await elkUtility.recordRequest(result, "linkList");
        }
      }
      resolve();
    } catch (error) {
      logger.error(error);
      reject(error);
    }

  });
}


// GET Cached data ===============================================================================

// --------------- Cache Management

async function getFromCache(url, mountName) {

}

/**
 * Provides ControlConstruct from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_3
 **/
exports.getCachedControlConstruct = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!utility.isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = utility.decodeURIWithCheck(url);
      const parts = url.split('?fields=');
      url = parts[0];

      let correctMountname = null;

      let mountname = utility.decodeMountName(url, true);
      if (typeof mountname === 'object') {
        logger.error(`getCachedControlConstruct - Wrong decoding mountname, is an object: ${mountname}`);
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = utility.retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = utility.modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      logger.info("Control Construct - Read from ELK mountname: " + correctMountname);
      let result = await elkUtility.readRecords(correctMountname);
      if (result != undefined) {
        let finalJson = undefined;
        try {
          finalJson = cacheResponse.cacheResponseBuilder(correctUrl, result);
        } catch (error) {
          throw new createHttpError(470, `Resource not existing. Device informs about addressed resource unknown`);
        }
        if (finalJson != undefined) {
          logger.info("GetCachedControlConstruct: FASTER Routine");
          utility.modifyReturnJson(finalJson);

          const objectKey = Object.keys(finalJson)[0];
          finalJson = finalJson[objectKey];

          if (myFields !== undefined) {
            const ccUuid = finalJson[0]?.uuid;
            const filter = utility.getFieldsFilter(myFields);
            fieldsManager.getFilteredJsonExt(finalJson, filter);
            if (utility.isJsonEmpty(finalJson)) {
              throw new createHttpError(470, 'Resource not existing. Device informs about addressed resource unknown');
            }

            if (finalJson[0] && ccUuid !== undefined) {
              finalJson[0].uuid = ccUuid;
            }
          }
          returnObject[objectKey] = finalJson;

        } else {
          throw new createHttpError(470, `Resource not existing. Device informs about addressed resource unknown`);
        }
      } else {
        throw new createHttpError(460, `Requested device ${correctMountname} is not available in the cache`);
      }
      resolve(returnObject);
    } catch (error) {
      logger.error(error);
      reject(error);
    }
  });
}

// ==============================================================================================

// GET Live data ===============================================================================

// --------------- Live Management


/**
 * Provides ControlConstruct from live network
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountname String The mount-name of the device that is addressed by the request
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_3
 **/
exports.getLiveControlConstruct = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountname, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let currentTime = new Date().toJSON();
      url = decodeURIComponent(url);
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const urlParts = url.split("?fields=");
      const myFields = urlParts[1];

      let correctCc = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = utility.decodeMountName(url, true);
      if (typeof mountname === 'object') {
        logger.error(mountname, "getLiveControlConstruct - Wrong decoding mountname, is an object:");
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      let Url = utility.retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = utility.formatUrlForOdl(Url, myFields);
      const Authorization = common[0].key;
      if (common[0].applicationName.indexOf(OPENDAYLIGHT_STR) != -1) { //"OpenDayLight"
        const result = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (result == false) {
          //resolve(NotFound());
          throw new createHttpError(532, "Bad Gateway. Upstream server not responding.");
        } else if (result.status != 200) {
          logger.error(result, "Get CC from live network fails, result.status!=200");
          if (result.statusText == undefined) {
            throw new createHttpError(502, "Bad Gateway");
          } else if (result.statusText == 401 || result.statusText == 403) {
            // resolve(result.status, result.statusText);
            throw new createHttpError(531, "Bad Gateway. Authentication at upstream server failed.");
          } 
           else if (result.statusText == "Service Unavailable" || result.status == 503) {
              throw new createHttpError(503, "Service Unavailable. The service request could not be processed.");
          } else if (result.status === 409) {
            throw new createHttpError(
              502,
              "Bad Gateway. The server is acting as a gateway or proxy and received an invalid response from the upstream device or application."
            );
          }
          else {
            throw new createHttpError(533, "Bad gateway. The resource/service that is addressed does not exist at the device/application.");
          }
        } else {
          if (result.statusText == undefined) {
            throw new createHttpError(530, "Data invalid. Response data not available, incomplete or corrupted");
          } else {
            let jsonObj = result.data;
            utility.modifyUUID(jsonObj, correctCc);
            if (myFields === undefined) {
              jsonObj['last-complete-control-construct-update-time'] = new Date().toJSON();
              try {
                let elapsedTime = await elkUtility.recordRequest(jsonObj, correctCc);
                let device = {
                  "mount-name": correctCc,
                  "last-complete-control-construct-update-time-attempt": currentTime
                };
                await slidingWindowHandler.createOrUpdateDevice(device);
                await deviceMetadataCacheUpdate.setLastCompleteControlConstructUpdateTimeAttempt(device["mount-name"], currentTime);
                await deviceMetadataCacheUpdate.setLastSuccessfulCompleteControlConstructUpdateTime(device["mount-name"], currentTime);
              }
              catch (error) {
                let device = {
                  "mount-name": correctCc,
                  "last-complete-control-construct-update-time-attempt": currentTime
                };
                await slidingWindowHandler.createOrUpdateDevice(device);
                await deviceMetadataCacheUpdate.setLastCompleteControlConstructUpdateTimeAttempt(device["mount-name"], currentTime);
                console.error(error);
              }
              utility.modifyReturnJson(jsonObj);
              let res = cacheResponse.cacheResponseBuilder(url, jsonObj);
              resolve(res);
            } else {
              let filters = true;
              // Update record on ES
              let Url = decodeURIComponent(utility.retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
              let correctUrl = utility.modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
              try {
                // read from ES
                let result1 = await elkUtility.readRecords(correctCc);
                let ccFromLive = jsonObj;
                ccFromLive['last-complete-control-construct-update-time'] = new Date().toJSON();
                // Update json object
                let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result1, jsonObj, filters);
                // Write updated Json to ES
                let elapsedTime = await elkUtility.recordRequest(ccFromLive, correctCc);
                let device = {
                  "mount-name": correctCc,
                  "last-complete-control-construct-update-time-attempt": currentTime
                };
                await slidingWindowHandler.createOrUpdateDevice(device);
                await deviceMetadataCacheUpdate.setLastCompleteControlConstructUpdateTimeAttempt(device["mount-name"], currentTime);
                await deviceMetadataCacheUpdate.setLastSuccessfulCompleteControlConstructUpdateTime(device["mount-name"], currentTime);
              } catch (error) {
                let device = {
                  "mount-name": correctCc,
                  "last-complete-control-construct-update-time-attempt": currentTime
                };
                await slidingWindowHandler.createOrUpdateDevice(device);
                await deviceMetadataCacheUpdate.setLastCompleteControlConstructUpdateTimeAttempt(device["mount-name"], currentTime);
                logger.error(error);
              }
              utility.modifyReturnJson(jsonObj);
              let splittedUrl = url.split('?');
              let res = cacheResponse.cacheResponseBuilder(splittedUrl[0], jsonObj);
              resolve(res);
            }
          }
        }
      }
    }
    catch (error) {
      logger.error(error);
      reject(error);
    }

  });
}


/**
 * Provides ActualEquipment from live network
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_12
 **/
exports.getLiveActualEquipment = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        logger.error("getLiveActualEquipment - Wrong decoding mountname, is an object:");
        logger.error(mountname);
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf(OPENDAYLIGHT_STR) != -1) { //"OpenDayLight"
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError(532, "Bad Gateway. Upstream server not responding.");
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(502, "Bad Gateway");
          } else if (res.statusText == 401 || res.statusText == 403) {
            throw new createHttpError(531, "Bad Gateway. Authentication at upstream server failed.");
          }
          else if (res.statusText == "Service Unavailable" || res.status == 503) {
              throw new createHttpError(503, "Service Unavailable. The service request could not be processed.");
          } else if (res.status === 409) {
            throw new createHttpError(
              502,
              "Bad Gateway. The server is acting as a gateway or proxy and received an invalid response from the upstream device or application."
            );
          }
          else {
            throw new createHttpError(533, "Bad gateway. The resource/service that is addressed does not exist at the device/application.");
          }
        } else {
          if (res.statusText == undefined) {
            throw new createHttpError(530, "Data invalid. Response data not available, incomplete or corrupted");
          } else {
            let jsonObj = res.data;
            retJson = jsonObj;
            modifyUUID(jsonObj, correctCc);
            let filters = false;
            if (myFields !== undefined) {
              filters = true;
            }
            try {
              // Update record on ES
              let Url = decodeURIComponent(retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
              let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
              // read from ES
              let result = await elkUtility.readRecords(correctCc);
              // Update json object
              let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
              // Write updated Json to ES
              let elapsedTime = await elkUtility.recordRequest(result, correctCc);
            }
            catch (error) {
              console.error(error);
            }
            modifyReturnJson(retJson)
            resolve(retJson);
          }
        }
      }
    } catch (error) {
      console.error(error);
      logger.error(error);
      reject(error);
    }
  });
}

/**
 * Provides AirInterfaceCapability from live network
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * localId String Instance identifier that is unique within its list
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_31
 **/
exports.getLiveAirInterfaceCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        logger.error("getLiveAirInterfaceCapability - Wrong decoding mountname, is an object:");
        logger.error(mountname);
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf(OPENDAYLIGHT_STR) != -1) { //"OpenDayLight"
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError(532, "Bad Gateway. Upstream server not responding.");
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(502, "Bad Gateway");
          } else if (res.statusText == 401 || res.statusText == 403) {
            throw new createHttpError(531, "Bad Gateway. Authentication at upstream server failed.");
          } 
           else if (res.statusText == "Service Unavailable" || res.status == 503) {
              throw new createHttpError(503, "Service Unavailable. The service request could not be processed.");
          } else if (res.status === 409) {
            throw new createHttpError(
              502,
              "Bad Gateway. The server is acting as a gateway or proxy and received an invalid response from the upstream device or application."
            );
          }
          else {
            throw new createHttpError(533, "Bad gateway. The resource/service that is addressed does not exist at the device/application.");
          }
        } else {
          if (res.statusText == undefined) {
            throw new createHttpError(530, "Data invalid. Response data not available, incomplete or corrupted");
          } else {
            let jsonObj = res.data;
            retJson = jsonObj;
            modifyUUID(jsonObj, correctCc);
            let filters = false;
            if (myFields !== undefined) {
              filters = true;
            }
            try {
              // Update record on ES
              let Url = decodeURIComponent(retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
              let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
              // read from ES
              let result = await elkUtility.readRecords(correctCc);
              // Update json object
              let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
              // Write updated Json to ES
              let elapsedTime = await elkUtility.recordRequest(result, correctCc);
            }
            catch (error) {
              console.error(error);
            }
            modifyReturnJson(retJson)
            resolve(retJson);
          }
        }
      }
    } catch (error) {
      logger.error(error);
      reject(error);
    }
  });
}

