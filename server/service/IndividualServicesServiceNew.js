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
const CORE_MODEL = "core-model-1-4";
const CTR_CONST = "control-construct";
const CORE_MODEL_CTRL_CONSTR = CORE_MODEL + ":" + CTR_CONST;
const CORE_MODEL_LINK = CORE_MODEL + ":link";
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
exports.bequeathYourDataAndDie = async function (url, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    await bequeathHandler.handleRequest(body, url);
    return;
  } catch (error) {
    logger.error(error);
  }
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
    // Case 2: Input given --> group by device-type
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
            const link = linkRecordForLinkUuid[CORE_MODEL_LINK][0]; // "core-model-1-4:link"
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
            let link = linkRecordForLinkUuid[CORE_MODEL_LINK][0];  // "core-model-1-4:link"

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
      const finalUrl = utility.formatUrlForOdl(decodeURIComponent(appNameAndUuidFromForwarding[0].url), urlParts[1]);
      let returnObject = {};
      let parts = finalUrl.split("?fields=");
      let myFields = parts[1];
      let result = await elkUtility.readRecords(mountName);
      if (result != undefined) {
        let finalJson = cacheResponse.cacheResponseBuilder(parts[0], result);
        if (finalJson != undefined) {
          utility.modifyReturnJson(finalJson);
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
      const finalUrl = utility.formatUrlForOdl(decodeURIComponent(appNameAndUuidFromForwarding[0].url), urlParts[1]);
      let returnObject = {};
      let toChangeObject = {};
      let parts = finalUrl.split("?fields=");
      let myFields = parts[1];
      let result = await elkUtility.readRecords(mountName);
      if (result != undefined) {
        let finalJson = cacheResponse.cacheResponseBuilder(parts[0], result);
        if (finalJson != undefined) {
          utility.modifyReturnJson(finalJson);
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
            let link = linkRecordForLinkUuid[CORE_MODEL_LINK][0]; "core-model-1-4:link"
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
            let link = linkRecordForLinkUuid[CORE_MODEL_LINK][0];  // "core-model-1-4:link"

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
      if (!linkToCompare[CORE_MODEL_LINK][0][END_POINT_LIST]) {
        index = 1;
      }
      const controlConstructList = linkToCompare[CORE_MODEL_LINK][index][END_POINT_LIST].map(endpoint => endpoint[CTR_CONST]);
      let result = await elkUtility.readRecords("linkList");
      for (var link of result.LinkList) {
        if (link != linkId) {
          let resLink = await elkUtility.readRecords(link);
          try {
            if (!resLink[CORE_MODEL_LINK][0][END_POINT_LIST]) {
              index1 = 1;
            }
            const ccList = resLink[CORE_MODEL_LINK][index1][END_POINT_LIST].map(endpoint => endpoint[CTR_CONST]);
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
// Module-level constant: allocated once.
const RESOURCE_NOT_FOUND =
  "Resource not existing. Device informs about addressed resource unknown";

async function getDataFromCache(url, fields, hasFields, hasCC) {
  const decodedUrl = utility.decodeURIWithCheck(url);

  // Avoid split() and its temporary array.
  const queryIndex = decodedUrl.indexOf("?fields=");
  const resourceUrl = queryIndex === -1 ? decodedUrl : decodedUrl.slice(0, queryIndex);

  const correctMountname = utility.decodeMountName(resourceUrl, hasCC);

  // Handle the helper's error response without dereferencing null.
  if (typeof correctMountname !== "string" || correctMountname.length === 0) {
    const decodingError = Array.isArray(correctMountname) ? correctMountname[0] : undefined;

    throw createHttpError(
      decodingError?.code ?? 400,
      decodingError?.message ?? "Invalid control-construct mount name"
    );
  }

  const config = common[1];
  const finalUrl = utility.retrieveCorrectUrl(resourceUrl, config.tcpConn, config.applicationName);
  const correctUrl = utility.modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

  const result = await elkUtility.readRecords(correctMountname, resourceUrl, fields);

  if (result == null) {
    throw createHttpError(460, `Requested device ${correctMountname} is not available in the cache`);
  }

  let response;
  try {
    response = cacheResponse.cacheResponseBuilder(correctUrl, result);
  } catch (error) {
    // Preserves the original mapping of builder errors to HTTP 470.
    throw createHttpError(470, RESOURCE_NOT_FOUND);
  }

  if (response == null) {
    throw createHttpError(470, RESOURCE_NOT_FOUND);
  }

  const objectKey = Object.keys(response)[0];
  const payload = response[objectKey];

  return { [objectKey]: payload };
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
exports.getCachedControlConstruct = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {

  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, true);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
};

exports.getCachedControlConstructOld = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
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

// ---------- ALARMS APIs -----------------------------------------

/**
 * Provides CurrentAlarms from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_6
 **/
exports.getCachedCurrentAlarms = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides AlarmCapability from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_4
 **/
exports.getCachedAlarmCapability = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides AlarmConfiguration from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_5
 **/
exports.getCachedAlarmConfiguration = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides AlarmEventRecords from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_7
 **/
exports.getCachedAlarmEventRecords = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}
// ---------- ALARM APIs END -----------------------------------------


// ---------- EQUIPMENT APIs -----------------------------------------
/**
 * Provides Equipment from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_8
 **/
exports.getCachedEquipment = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides ActualEquipment from cache
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
exports.getCachedActualEquipment = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides ExpectedEquipment from cache
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
 * returns inline_response_200_11
 **/
exports.getCachedExpectedEquipment = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides ContainedHolder from cache
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
 * returns inline_response_200_10
 **/
exports.getCachedContainedHolder = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}
// ---------- EQUIPMENT APIs END -----------------------------------------

// ---------- FIRMWARE APIs -----------------------------------------
/**
 * Provides FirmwareCollection from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_13
 **/
exports.getCachedFirmwareCollection = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}


/**
 * Provides FirmwareComponentCapability from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * localId String Instance identifier that is unique within its list
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_15
 **/
exports.getCachedFirmwareComponentCapability = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}


/**
 * Provides FirmwareComponentList from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * localId String Instance identifier that is unique within its list
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_14
 **/
exports.getCachedFirmwareComponentList = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}


/**
 * Provides FirmwareComponentStatus from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * localId String Instance identifier that is unique within its list
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_16
 **/
exports.getCachedFirmwareComponentStatus = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}
// ---------- FIRMWARE APIs END -----------------------------------------

// ---------- PROFILE APIs -----------------------------------------

/**
 * Provides Profile from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_18
 **/
exports.getCachedProfile = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}


/**
 * Provides ProfileCollection from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_17
 **/
exports.getCachedProfileCollection = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides CoChannelProfileCapability from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_19
 **/
exports.getCachedCoChannelProfileCapability = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides CoChannelProfileConfiguration from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_20
 **/
exports.getCachedCoChannelProfileConfiguration = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides Connector from cache
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
 * returns inline_response_200_9
 **/
exports.getCachedConnector = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides WredTemplateProfileConfiguration from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mountName of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_36
 **/
exports.getCachedWredTemplateProfileConfiguration = function (user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = {
      "wred-template-profile-1-0:wred-template-profile-configuration": {}
    };
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

exports.getCachedWredTemplateProfileCapability = function (user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = {
      "wred-template-profile-1-0:wred-template-profile-capability": {}
    };

    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

/**
 * Provides WredProfileConfiguration from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_28
 **/
exports.getCachedWredProfileConfiguration = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides WredProfileCapability from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_27
 **/
exports.getCachedWredProfileCapability  = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides SchedulerProfileConfiguration from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_26
 **/
exports.getCachedSchedulerProfileConfiguration  = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides SchedulerProfileConfiguration from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_26
 **/
exports.getCachedSchedulerProfileConfiguration  = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}


/**
 * Provides QosProfileConfiguration from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_24
 **/
exports.getCachedQosProfileConfiguration  = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}


/**
 * Provides QosProfileCapability from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_23
 **/
exports.getCachedQosProfileCapability  = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides PolicingProfileConfiguration from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_22
 **/
exports.getCachedPolicingProfileConfiguration = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}


/**
 * Provides PolicingProfileCapability from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_21
 **/
exports.getCachedPolicingProfileCapability = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}
// ----------------------- PROFILE APIS END ----------------------------

// ----------------------- FORWARDING DOMAIN APIs ----------------------

/**
 * Provides ForwardingDomain from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mountName of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_32
 **/
exports.getCachedForwardingDomain = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides ForwardingConstruct from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mountName of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * uuid1 String Another instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_33
 **/
exports.getCachedForwardingConstruct = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides ForwardingConstructPort from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mountName of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * uuid1 String Another instance identifier that is unique within the device
 * localId String Instance identifier that is unique within its list
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_34
 **/
exports.getCachedForwardingConstructPort = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}
// ----------------------- FORWARDING DOMAIN APIs END ----------------------


// ----------------------- LINK APIs ---------------------------------------
/**
 * Provides Link from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_35
 **/
exports.getCachedLink = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      url = decodeURIComponent(url);
      let correctLink = null;
      let link = decodeLinkUuid(url, true);
      if (typeof link === 'object') {
        logger.error("getCachedLink - Link: " + link);
        throw new createHttpError(link[0].code, link[0].message);
        return;
      } else {
        correctLink = link;
      }

      logger.info("getCachedLink - Read from ELK: " + correctLink);
      let result = await elkUtility.readRecords(correctLink);
      if (result != undefined) {
        let objectKey = Object.keys(result)[0];
        if (objectKey.indexOf("link") != -1) {
          resolve(result);
        } else {
          throw new createHttpError(461, 'Not available. The topology (parent) object is currently not found in the cache.');
        }
      } else {
        throw new createHttpError(461, 'Not available. The topology (parent) object is currently not found in the cache.');
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Provides LinkPort from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * uuid String Instance identifier that is unique within the device
 * localId String Instance identifier that is unique within its list
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_36
 **/
exports.getCachedLinkPort = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      url = decodeURIComponent(url);
      let correctLink = null;
      let link = uuid;//decodeLinkUuid(url, true);
      let id = localId;
      const format = /[ `!@#$%^&*()+\=\[\]{};':"\\|,.<>\/?~]/;
      const matchLink = format.test(link);
      const matchId = format.test(id);
      if (matchLink || matchId) {
        logger.error("getCachedLinkPort - UUID: " + link + " - localID: " + id);
        throw new createHttpError("400", "Fields must not contain special chars");
      }
      if (typeof link === 'object') {
        logger.error("getCachedLinkPort - UUID: " + link);
        throw new createHttpError(link[0].code, link[0].message);
      } else {
        correctLink = link;
      }

      logger.info("getCachedLinkPort - Read from ELK: " + correctLink);
      let result = await elkUtility.readRecords(correctLink);
      if (result != undefined) {
        let objectKey = Object.keys(result)[0];
        if (objectKey.indexOf("link") != -1) {
          result = result[objectKey];
          let linkPortArray = null;
          const objectKeyParts = objectKey.split(":");
          let prefix = objectKeyParts[0];
          let topJsonWrapper = prefix + ":link-port";
          if (result[0] && Array.isArray(result[0]["link-port"])) {
            linkPortArray = result[0]["link-port"].find(
              port => port["local-id"] === id
            );
          } else {
            throw new createHttpError(471, "(Child) topology object not existing. Cache informs about addressed resource unknown.");
          }
          // const linkPortArray = result[0]["link-port"].find(
          //   port => port["local-id"] === id
          // );
          let returnObject = { [topJsonWrapper]: [linkPortArray] };
          resolve(returnObject);
        } else {
          throw new createHttpError(461, "Not available. The topology (parent) object is currently not found in the cache.");
        }
      } else {
        throw new createHttpError(461, "Not available. The topology (parent) object is currently not found in the cache.");
      }
    } catch (error) {
      reject(error);
    }
  });
}
// ----------------------- LINK APIs END ---------------------------------------

// --------------- LOGICAL TERMINATION POINT APIs----------------------------------------

/**
 * Provides LogicalTerminationPoint from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_29
 **/
exports.getCachedLogicalTerminationPoint  = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides LtpAugment from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_30
 **/
exports.getCachedLtpAugment = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides AirInterfaceCapability from cache
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
exports.getCachedAirInterfaceCapability = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides AirInterfaceConfiguration from cache
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
 * returns inline_response_200_32
 **/
exports.getCachedAirInterfaceConfiguration = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides AirInterfaceHistoricalPerformances from cache
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
 * returns inline_response_200_34
 **/
exports.getCachedAirInterfaceHistoricalPerformances = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides AirInterfaceStatus from cache
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
 * returns inline_response_200_33
 **/
exports.getCachedAirInterfaceStatus = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

/**
 * Provides EthernetContainerCapability from cache
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
 * returns inline_response_200_35
 **/
exports.getCachedEthernetContainerCapability = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}


/**
 * Provides EthernetContainerConfiguration from cache
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
 * returns inline_response_200_36
 **/
exports.getCachedEthernetContainerConfiguration = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}


/**
 * Provides EthernetContainerHistoricalPerformances from cache
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
 * returns inline_response_200_38
 **/
exports.getCachedEthernetContainerHistoricalPerformances = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}


/**
 * Provides EthernetContainerStatus from cache
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
 * returns inline_response_200_37
 **/
exports.getCachedEthernetContainerStatus = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  try {
    // Treat both undefined and null as "no filter".
    const hasFields = utility.checkFields(fields);

    const result = await getDataFromCache(url, fields, hasFields, false);
    return result;
  } catch (error) {
    logger.error(error);
    throw (error);
  }
}

// ==============================================================================================


// GET Live data ===============================================================================

// --------------- Live Management
// General routine for live data
async function getLiveData(url, fields) {
  const controller = common[0];
  const cache = common[1];

  if (!controller.applicationName?.includes(OPENDAYLIGHT_STR)) {
    throw createHttpError(502, "Unsupported upstream controller");
  }

  if (typeof url !== "string" || url.length === 0) {
    throw createHttpError(400, "Invalid URL");
  }

  // Separate the query before decoding the resource path.
  const fieldsIndex = url.indexOf("?fields=");

  let resourceUrl;
  let myFields;

  try {
    resourceUrl = decodeURIComponent(fieldsIndex === -1 ? url : url.slice(0, fieldsIndex));

    // Prefer the API's parsed fields argument.
    // Assume that argument is already decoded by the API framework.
    myFields =
      fields != null ? fields : fieldsIndex === -1 ? undefined : decodeURIComponent(url.slice(fieldsIndex + "?fields=".length));
  } catch (error) {
    if (error instanceof URIError) {
      throw createHttpError(400, "Invalid URL encoding");
    }

    throw error;
  }

  const correctCc = utility.decodeMountName(resourceUrl, false);

  if (typeof correctCc !== "string" || correctCc.length === 0) {
    const decodingError = Array.isArray(correctCc) ? correctCc[0] : undefined;

    throw createHttpError(
      decodingError?.code ?? 400,
      decodingError?.message ?? "Invalid control-construct mount name"
    );
  }

  const controllerUrl = utility.retrieveCorrectUrl(resourceUrl, controller.tcpConn, controller.applicationName);
  const finalUrl = utility.formatUrlForOdl(controllerUrl, myFields);

  // Perform get from ODL controller
  const response = await RestClient.dispatchEvent(finalUrl, "GET", "", controller.key);

  if (!response) {
    throw createHttpError(532, "Bad Gateway. Upstream server not responding.");
  }

  const status = Number(response.status);

  if (status !== 200) {
    switch (status) {
      case 401:
      case 403:
        throw createHttpError(531, "Bad Gateway. Authentication at upstream server failed.");

      case 503:
        throw createHttpError(503, "Service Unavailable. The service request could not be processed.");

      case 409:
        throw createHttpError(502, "Bad Gateway. Invalid response from the upstream device or application.");

      default:
        if (!Number.isInteger(status) || status < 100 || status > 599) {
          throw createHttpError(502, "Bad Gateway. Invalid upstream status.");
        }

        throw createHttpError(533, "Bad gateway. The resource/service that is addressed does not exist at the device/application.");
    }
  }

  const liveData = response.data;

  if (liveData === null || typeof liveData !== "object" || Array.isArray(liveData)) {
    throw createHttpError(530, "Data invalid. Response data not available, incomplete or corrupted");
  }

  // Keep the response data separate from mutable cache-update data.
  const cacheData = structuredClone(liveData);

  try {
    utility.modifyUUID(cacheData, correctCc);
    const cacheUrl = utility.retrieveCorrectUrl(resourceUrl, cache.tcpConn, cache.applicationName);
    const correctUrl = utility.modifyUrlConcatenateMountNamePlusUuid(cacheUrl, correctCc);

    // IMPORTANT: read the complete document before replacing it.
    const existingDocument = await elkUtility.readRecords(correctCc);

    if (existingDocument == null) {
      throw new Error(`Cannot update missing cache document ${correctCc}`);
    }

    // Await works whether the builder is synchronous or asynchronous.
    const updatedDocument = await cacheUpdate.cacheUpdateBuilder(correctUrl, existingDocument, cacheData, myFields != null);

    if (updatedDocument === null || typeof updatedDocument !== "object") {
      throw new Error("cacheUpdateBuilder returned an invalid document");
    }

    const writeResult = await elkUtility.recordRequest(updatedDocument, correctCc);

    if (!writeResult?.ok) {
      logger.warn(`Cache update failed for ${correctCc}: ` + (writeResult?.reason ?? "Unknown write failure"));
    }
  } catch (error) {
    logger.error(error, `Cache update failed for ${correctCc}`);
  }

  // Preserve your existing response normalization.
  utility.modifyReturnJson(liveData);

  return liveData;
}

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
exports.getLiveActualEquipment = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  
  try {
    return getLiveData(url, fields);
  } catch (error) {
    logger.error(error);
    throw(error);
  }
};


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
exports.getLiveAirInterfaceCapability = async function (
  url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  
  try {
    return getLiveData(url, fields);
  } catch (error) {
    logger.error(error);
    throw(error);
  }
};




///////////////////////////////////////////////////////
async function RequestForListOfDeviceInterfacesCausesReadingFromCache(mountName) {

  try {
    const forwardingName = "RequestForListOfDeviceInterfacesCausesReadingFromCache";
    const forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
    // const forwardingConstruct1 = await ForwardingDomain.

    let fcPortOutputDirectionLogicalTerminationPointList = [];
    const fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
    for (const fcPort of fcPortList) {
      const portDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
      if (FcPort.portDirectionEnum.OUTPUT === portDirection) {
        fcPortOutputDirectionLogicalTerminationPointList.push(fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
      }
    }

    let applicationNameList = [];
    //let urlForOdl = "/rests/data/network-topology:network-topology/topology=topology-netconf";
    //let urlForOdl = "/rests/data/network-topology:network-topology?fields=topology/node(node-id;netconf-node-topology:connection-status)"
    let urlForEs = "/control-construct={mountName}?fields=logical-termination-point(uuid;layer-protocol(local-id;layer-protocol-name))"
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
 * Receives notifications about objects that have been deleted inside the devices
 *
 * calculates the correct ip, port and protocol to address ODL and ES 
 * Returns a list of 2 arrays.
 * the first contains the ODL parameters and the URL to call
 * the second contains the same for ES
 **/
exports.resolveApplicationNameAndHttpClientLtpUuidFromForwardingName = async function () {
  try {
    const forwardingName = "RequestForLiveControlConstructCausesReadingFromDeviceAndWritingIntoCache";
    const forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
    if (forwardingConstruct === undefined) {
      return null;
    }

    let fcPortOutputDirectionLogicalTerminationPointList = [];
    const fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
    for (const fcPort of fcPortList) {
      const portDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
      if (FcPort.portDirectionEnum.OUTPUT === portDirection) {
        fcPortOutputDirectionLogicalTerminationPointList.push(fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
      }
    }

    /*  if (fcPortOutputDirectionLogicalTerminationPointList.length !== 1) {
       return null;
     } */
    let applicationNameList = [];
    for (const opLtpUuid of fcPortOutputDirectionLogicalTerminationPointList) {
      //const opLtpUuid = fcPortOutputDirectionLogicalTerminationPointList[0];
      const httpLtpUuidList = await LogicalTerminationPoint.getServerLtpListAsync(opLtpUuid);
      const httpClientLtpUuid = httpLtpUuidList[0];
      let applicationName = 'api';
      /*const applicationName = await httpClientInterface.getApplicationNameAsync(httpClientLtpUuid);*/
      const path = await OperationClientInterface.getOperationNameAsync(opLtpUuid);
      let prefix = opLtpUuid.split('op')[0];
      const key = await extractProfileConfiguration(prefix + "file-p-000");
      let url = "";
      let tcpConn = "";
      let EsClient = null;
      let indexAlias = await getIndexAliasAsync();

      if (opLtpUuid.includes("odl")) {
        applicationName = OPENDAYLIGHT_STR; // "OpenDayLight";
        tcpConn = await OperationClientInterface.getTcpClientConnectionInfoAsync(opLtpUuid);
        EsClient = await elasticsearchService.getClient(false);
      } else if (opLtpUuid.includes("es")) {
        tcpConn = await getTcpClientConnectionInfoAsync(opLtpUuid);
        applicationName = ELASTICSEARCH_STR; //"ElasticSearch";
        EsClient = await elasticsearchService.getClient(false);
      }
      const applicationNameData = applicationName === undefined ? {
        applicationName: null,
        httpClientLtpUuid,
        tcpConn: null, key: null,
        indexAlias: null, EsClient: null
      } : {
        applicationName,
        httpClientLtpUuid,
        tcpConn, key,
        indexAlias, EsClient
      };
      applicationNameList.push(applicationNameData);
    }
    return applicationNameList;
  } catch (error) {
    logger.error(error);
  }
}

async function getTcpClientConnectionInfoAsync(operationClientUuid) {
  try {
    let httpClientUuidList = await logicalTerminationPoint.getServerLtpListAsync(operationClientUuid);
    let httpClientUuid = httpClientUuidList[0];
    let tcpClientUuidList = await logicalTerminationPoint.getServerLtpListAsync(httpClientUuid);
    let tcpClientUuid = tcpClientUuidList[0];
    let tcpServerUuidList = await logicalTerminationPoint.getServerLtpListAsync(tcpClientUuid);
    let tcpServerUuid = tcpServerUuidList[0];
    let tcpClientRemoteAddress = await tcpClientInterface.getRemoteAddressAsync(tcpServerUuid);
    let remoteAddress = await getConfiguredRemoteAddress(tcpClientRemoteAddress);
    let remotePort = await tcpClientInterface.getRemotePortAsync(tcpServerUuid);
    let remoteProtocol = await tcpClientInterface.getRemoteProtocolAsync(tcpServerUuid);
    return remoteProtocol.toLowerCase() + "://" + remoteAddress + ":" + remotePort;
  } catch (error) {
    logger.error(error);
  }
}

function getConfiguredRemoteAddress(remoteAddress) {
  try {
    let domainName = onfAttributes.TCP_CLIENT.DOMAIN_NAME;
    if (domainName in remoteAddress) {
      remoteAddress = remoteAddress["domain-name"];
    } else {
      remoteAddress = remoteAddress[
        onfAttributes.TCP_CLIENT.IP_ADDRESS][
        onfAttributes.TCP_CLIENT.IPV_4_ADDRESS
      ];
    }
    return remoteAddress;
  } catch (error) {
    logger.error(error);
  }
}

async function extractProfileConfiguration(uuid) {
  try {
    let profile = await profileCollection.getProfileAsync(uuid);
    let objectKey = Object.keys(profile)[2];
    profile = profile[objectKey];
    let filepath = profile["file-profile-configuration"]["file-name"];

    let applicationDataFile = await fileProfileOperation.getApplicationDataFileContent();
    const data = JSON.parse(fs.readFileSync(applicationDataFile, 'utf8'));
    return data["api-key"];
  } catch (error) {
    logger.error(error);
  }
}


async function resolveApplicationNameAndHttpClientLtpUuidFromForwardingNameForDeviceList() {
  try {
    const forwardingName = "PromptForEmbeddingCausesCyclicLoadingOfDeviceListFromController";
    const forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
    if (forwardingConstruct === undefined) {
      return null;
    }

    let fcPortOutputDirectionLogicalTerminationPointList = [];
    const fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
    for (const fcPort of fcPortList) {
      const portDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
      if (FcPort.portDirectionEnum.OUTPUT === portDirection) {
        fcPortOutputDirectionLogicalTerminationPointList.push(fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
      }
    }

    let applicationNameList = [];
    //let urlForOdl = "/rests/data/network-topology:network-topology/topology=topology-netconf";
    //let urlForOdl = "/rests/data/network-topology:network-topology?fields=topology/node(node-id;netconf-node-topology:connection-status)"
    let urlForOdl = "/rests/data/network-topology:network-topology/topology=topology-netconf?fields=node(node-id;netconf-node-topology:connection-status)"
    for (const opLtpUuid of fcPortOutputDirectionLogicalTerminationPointList) {
      const httpLtpUuidList = await LogicalTerminationPoint.getServerLtpListAsync(opLtpUuid);
      const httpClientLtpUuid = httpLtpUuidList[0];
      let applicationName = 'api';
      const path = await OperationClientInterface.getOperationNameAsync(opLtpUuid);
      let prefix = opLtpUuid.split('op')[0];
      const key = await extractProfileConfiguration(prefix + "file-p-000");
      let url = "";
      let tcpConn = "";
      if (opLtpUuid.includes("odl")) {
        applicationName = OPENDAYLIGHT_STR;
        tcpConn = await OperationClientInterface.getTcpClientConnectionInfoAsync(opLtpUuid);
        url = tcpConn + urlForOdl;
      }
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



/* List of functions needed for individual services*/

/**
 * Notify subscribers of any NP subscription service of a new controller-notification
 *
 * @param deviceNotificationType type of subscription
 * @param controllerNotification inbound notification from controller
 * @param controllerName
 * @param controllerRelease
 * @param controllerTargetUrl
 */
async function notifyAllDeviceSubscribers(deviceNotificationType, notificationMessage) {
  try {
    let activeSubscribers = await notificationManagement.getActiveSubscribers(deviceNotificationType);

    if (activeSubscribers.length > 0) {
      logger.info("starting notification of " + activeSubscribers.length + " subscribers for '" + deviceNotificationType + "'");

      for (let subscriber of activeSubscribers) {
        await sendMessageToSubscriber(deviceNotificationType, subscriber.targetOperationURL, subscriber.operationKey, notificationMessage);
      }
    } else {
      logger.warn("no subscribers for " + deviceNotificationType + ", message discarded");
    }
  } catch (error) {
    logger.error(error);
  }
}


/**
 * Trigger notification to subscriber with data
 * @param notificationType type of notification
 * @param targetOperationURL target url with endpoint where subscriber expects arrival of notifications
 * @param notificationMessage converted notification to send
 * @param operationKey
 */
async function sendMessageToSubscriber(notificationType, targetOperationURL, operationKey, notificationMessage) {

  cleanupOutboundNotificationCache();

  //check if same notification was sent more than once in certain timespan
  let isDuplicate = checkNotificationDuplicate(notificationType, targetOperationURL, notificationMessage);

  if (isDuplicate) {
    logger.warn("notification duplicate ignored");
  } else {
    let sendingTimestampMs = Date.now();

    // "clone"
    let comparisonNotificationMessage = JSON.parse(JSON.stringify(notificationMessage));
    //ignore timestamp and counter for comparison
    delete comparisonNotificationMessage[Object.keys(comparisonNotificationMessage)[0]]["timestamp"];
    delete comparisonNotificationMessage[Object.keys(comparisonNotificationMessage)[0]]["counter"];

    let messageCacheEntry = {
      "targetOperationURL": targetOperationURL,
      "type": notificationType,
      "notification": comparisonNotificationMessage,
      "timeMs": sendingTimestampMs
    }
    lastSentMessages.push(messageCacheEntry);

    let appInformation = await notificationManagement.getAppInformation();

    let requestHeader = notificationManagement.createRequestHeader();

    let uniqueSendingID = crypto.randomUUID();

    //send notification
    //logger.info("sending subscriber notification to: " + targetOperationURL + " with content: " + JSON.stringify(notificationMessage) + " - debugId: '" + uniqueSendingID + "'");
    logger.info(`sending subscriber notification to: ${targetOperationURL}, notificationType=${notificationType}, debugId=${uniqueSendingID}`);
    try {
      const response = await axios.post(targetOperationURL, notificationMessage, {
        // axios.post("http://localhost:1237", notificationMessage, {
        timeout: SUBSCRIBER_NOTIFICATION_TIMEOUT_MS,
        headers: {
          'x-correlator': requestHeader.xCorrelator,
          'trace-indicator': requestHeader.traceIndicator,
          'user': requestHeader.user,
          'originator': requestHeader.originator,
          'customer-journey': requestHeader.customerJourney,
          'operation-key': operationKey
        }
      });

      logger.info(`subscriber-notification success, notificationType=${notificationType}, target url=${targetOperationURL}, result status=${response.status}, debugId=${uniqueSendingID}`);

      await executionAndTraceService.recordServiceRequestFromClient(
        appInformation["application-name"],
        appInformation["release-number"],
        requestHeader.xCorrelator,
        requestHeader.traceIndicator,
        requestHeader.user,
        requestHeader.originator,
        notificationType, //for example "notifications/device-alarms"
        response.status,
        notificationMessage,
        response.data);
    } catch (e) {
      logger.error(e, "error during subscriber-notification for " + notificationType + " - debugId: '" + uniqueSendingID + "'");

      await executionAndTraceService.recordServiceRequestFromClient(
        appInformation["application-name"],
        appInformation["release-number"],
        requestHeader.xCorrelator,
        requestHeader.traceIndicator,
        requestHeader.user,
        requestHeader.originator,
        notificationType,
        responseCodeEnum.code.INTERNAL_SERVER_ERROR,
        notificationMessage,
        e);
    }
  }
}


function cleanupOutboundNotificationCache() {
  try {
    let toRemoveElements = [];

    for (const lastSentMessage of lastSentMessages) {
      let differenceInTimestampMs = Date.now() - lastSentMessage.timeMs;

      //timeout from env - use 5 seconds as fallback
      let timespanMs = process.env['NOTIFICATION_DUPLICATE_TIMESPAN_MS'] ? process.env['NOTIFICATION_DUPLICATE_TIMESPAN_MS'] : 5000;

      if (differenceInTimestampMs > timespanMs) {
        toRemoveElements.push(lastSentMessage)
      }
    }

    //remove timed out elements
    lastSentMessages = lastSentMessages.filter((element) => toRemoveElements.includes(element) === false);
  } catch (error) {
    logger.error(error);
  }
}

function checkNotificationDuplicate(notificationType, targetOperationURL, notificationMessage) {

  try {
    // "clone"
    let newComparisonNotificationMessage = JSON.parse(JSON.stringify(notificationMessage));
    //ignore timestamp and counter for comparison
    delete newComparisonNotificationMessage[Object.keys(newComparisonNotificationMessage)[0]]["timestamp"];
    delete newComparisonNotificationMessage[Object.keys(newComparisonNotificationMessage)[0]]["counter"];
    let newNotificationString = JSON.stringify(newComparisonNotificationMessage);

    for (const lastSentMessage of lastSentMessages) {
      // "clone"
      let oldComparisonNotificationMessage = JSON.parse(JSON.stringify(lastSentMessage.notification));
      //ignore timestamp and counter for comparison
      delete oldComparisonNotificationMessage[Object.keys(oldComparisonNotificationMessage)[0]]["timestamp"];
      delete oldComparisonNotificationMessage[Object.keys(oldComparisonNotificationMessage)[0]]["counter"];
      let oldNotificationString = JSON.stringify(oldComparisonNotificationMessage);

      if (newNotificationString === oldNotificationString &&
        lastSentMessage.type === notificationType &&
        lastSentMessage.targetOperationURL === targetOperationURL) {
        return true;
      }
    }
    return false;
  } catch (error) {
    logger.error(error);
  }
}

async function sentDataToRequestor(body, user, originator, xCorrelator, traceIndicator, customerJourney, requestorUrl, operationKey) {
  let httpRequestHeaderRequestor;

  let httpRequestHeader = new RequestHeader(
    user,
    originator,
    xCorrelator,
    traceIndicator,
    customerJourney,
    operationKey
  );

  httpRequestHeaderRequestor = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(httpRequestHeader);
  logger.info('Send data to Requestor:' + requestorUrl);

  try {
    let response = await axios(requestorUrl, {
      headers: httpRequestHeaderRequestor,
      timeout: 60000,
      maxContentLength: 2 * 1024 * 1024,
      maxBodyLength: 2 * 1024 * 1024,
      validateStatus: () => true
    });
    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      response: {
        status: response.status,
        statusText: response.statusText
      }
    };
  }
  catch (error) {
    logger.error(
      `[sentDataToRequestor-REQUESTOR-ERROR] url=${requestorUrl.substring(0, 300)} status=${error.response?.status || "NA"} message=${error.message}`
    );

    return {
      status: error.response?.status || 503,
      statusText: error.response?.statusText || error.message,
      data: undefined,
      response: {
        status: error.response?.status || 503,
        statusText: error.response?.statusText || error.message
      }
    };
  }
}


exports.PromptForEmbeddingCausesSubscribingForNotifications = async function (user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    let traceIndicatorIncrementer = 1;
    originator = 'MicroWaveDeviceInventory';
    const forwardingName = "PromptForEmbeddingCausesSubscribingForNotifications";
    const forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
    if (forwardingConstruct === undefined) {
      return null;
    }
    let fcPortInputDirectionLogicalTerminationPointList = [];
    let fcPortOutputDirectionLogicalTerminationPointList = [];

    const fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
    for (const fcPort of fcPortList) {
      const portDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
      if (FcPort.portDirectionEnum.INPUT === portDirection) {
        fcPortInputDirectionLogicalTerminationPointList.push(fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
      }
    }

    for (const fcPort of fcPortList) {
      const portDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
      if (FcPort.portDirectionEnum.OUTPUT === portDirection) {
        fcPortOutputDirectionLogicalTerminationPointList.push(fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
      }
    }

    const opLtpUuid = fcPortInputDirectionLogicalTerminationPointList[0];
    const httpLtpUuidList = await LogicalTerminationPoint.getServerLtpListAsync(opLtpUuid);
    const httpClientLtpUuid = httpLtpUuidList[0];
    let tcpConn = await LogicalTerminationPoint.getServerLtpListAsync(httpClientLtpUuid)
    let applicationName = await HttpServerInterface.getApplicationNameAsync();
    let applicationReleaseNumber = await HttpServerInterface.getReleaseNumberAsync();

    let tcpClientLocalAddress = await tcpServerInterface.getLocalAddressOfTheProtocol('HTTP')
    let tcpClientLocalport = await tcpServerInterface.getLocalPortOfTheProtocol('HTTP')

    for (const opLtpUuidOutput of fcPortOutputDirectionLogicalTerminationPointList) {
      //let opLtpUuidOutput = fcPortOutputDirectionLogicalTerminationPointList[0];
      const key = await OperationClientInterface.getOperationKeyAsync(opLtpUuidOutput);
      const operation = await OperationClientInterface.getOperationNameAsync(opLtpUuidOutput);
      let traceIndicatorMod = traceIndicator + '.' + traceIndicatorIncrementer;
      //console.log("traceIndicator: " + traceIndicatorMod);
      let httpRequestHeader = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(new RequestHeader(user, originator, xCorrelator, traceIndicatorMod, customerJourney, key));
      traceIndicatorIncrementer++;
      let httpRequestBody = {
        "subscribing-application-name": applicationName,
        "subscribing-application-release": applicationReleaseNumber,
        "subscribing-application-protocol": "HTTP",
        "subscribing-application-address": {
          "ip-address": tcpClientLocalAddress
        },
        "subscribing-application-port": tcpClientLocalport,
        "notifications-receiving-operation": operation
      }

      let response = await RequestBuilder.BuildAndTriggerRestRequest(opLtpUuidOutput, "POST", httpRequestHeader, httpRequestBody);
      let responseCodeValue = response.status.toString();
      if (responseCodeValue.startsWith("2")) {
        logger.error(`SubscribingForNotifications - subscribing request from MWDI with body ${JSON.stringify(httpRequestBody)} failed with response status: ${response.status}`);
      }
      logger.error(`SubscribingForNotifications - subscribing request from MWDI with body ${JSON.stringify(httpRequestBody)} failed with response status: ${response.status}`);
    }

  } catch (error) {
    logger.error(`SubscribingForNotifications - subscribing request from MWDI, failed with response status: ${error.message}`);
    return false;
  }
}

exports.NotifiedDeviceAlarmCausesUpdatingTheEntryInCurrentAlarmListOfCache = async function () {
  try {
    const forwardingName = "NotifiedDeviceAlarmCausesUpdatingTheEntryInCurrentAlarmListOfCache";
    const forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
    if (forwardingConstruct === undefined) {
      return null;
    }

    let fcPortInputDirectionLogicalTerminationPointList = [];
    let fcPortOutputDirectionLogicalTerminationPointList = [];

    const fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
    for (const fcPort of fcPortList) {
      const portDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
      if (FcPort.portDirectionEnum.INPUT === portDirection) {
        fcPortInputDirectionLogicalTerminationPointList.push(fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
      }
    }
    for (const fcPort of fcPortList) {
      const portDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
      if (FcPort.portDirectionEnum.OUTPUT === portDirection) {
        fcPortOutputDirectionLogicalTerminationPointList.push(fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
      }
    }
    let opLtpUuidOutput = fcPortOutputDirectionLogicalTerminationPointList[0];
    const key = await OperationClientInterface.getOperationKeyAsync(opLtpUuidOutput);
    let applicationNameList = [];
    const opLtpUuid = fcPortInputDirectionLogicalTerminationPointList[0];
    // const key = await OperationClientInterface.getOperationKeyAsync(opLtpUuid)
    const httpLtpUuidList = await LogicalTerminationPoint.getServerLtpListAsync(opLtpUuid);
    const httpClientLtpUuid = httpLtpUuidList[0];
    let tcpConn = await LogicalTerminationPoint.getServerLtpListAsync(httpClientLtpUuid)
    let i = 0;
    let protocol = "";
    for (const connection of tcpConn) {
      if (i == 0) {
        protocol = "HTTP";
      } else {
        protocol = "HTTPS";
      }
      let tcpClientRemoteAddress = await tcpServerInterface.getLocalAddressOfTheProtocol(protocol)     //     getRemoteAddressAsync(tcpConn[0]);
      let tcpClientRemoteport = await tcpServerInterface.getLocalPortOfTheProtocol(protocol)     //     getRemoteAddressAsync(tcpConn[0]);
      //tcpConne = await getTcpClientConnectionInfoAsync(httpClientLtpUuid);
      let finalTcpAddr = protocol.toLowerCase() + "://" + tcpClientRemoteAddress['ipv-4-address'] + ":" + tcpClientRemoteport;

      const applicationNameData = {
        key,
        protocol,
        finalTcpAddr
      };
      i++;
      applicationNameList.push(applicationNameData);
    }
    return applicationNameList;
  } catch (error) {
    logger.error(error);
  }
}

async function NotifiedDeviceAttributeValueChangeCausesUpdateOfCache(counter) {
  try {
    const forwardingName = "NotifiedDeviceAttributeValueChangeCausesUpdateOfCache";
    const forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
    if (forwardingConstruct === undefined) {
      return null;
    }

    let fcPortInputDirectionLogicalTerminationPointList = [];
    let fcPortOutputDirectionLogicalTerminationPointList = [];
    const fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
    for (const fcPort of fcPortList) {
      const portDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
      if (FcPort.portDirectionEnum.INPUT === portDirection) {
        fcPortInputDirectionLogicalTerminationPointList.push(fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
      }
    }
    for (const fcPort of fcPortList) {
      const portDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
      if (FcPort.portDirectionEnum.OUTPUT === portDirection) {
        fcPortOutputDirectionLogicalTerminationPointList.push(fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
      }
    }

    let opLtpUuidOutput = fcPortOutputDirectionLogicalTerminationPointList[counter];
    const key = await OperationClientInterface.getOperationKeyAsync(opLtpUuidOutput)
    let applicationNameList = [];
    const opLtpUuid = fcPortInputDirectionLogicalTerminationPointList[0];
    // const key = await OperationClientInterface.getOperationKeyAsync(opLtpUuid)
    const httpLtpUuidList = await LogicalTerminationPoint.getServerLtpListAsync(opLtpUuid);
    const httpClientLtpUuid = httpLtpUuidList[0];
    let tcpConn = await LogicalTerminationPoint.getServerLtpListAsync(httpClientLtpUuid)
    let i = 0;
    let protocol = "";
    for (const connection of tcpConn) {
      if (i == 0) {
        protocol = "HTTP";
      } else {
        protocol = "HTTPS";
      }
      let tcpClientRemoteAddress = await tcpServerInterface.getLocalAddressOfTheProtocol(protocol)     //     getRemoteAddressAsync(tcpConn[0]);
      let tcpClientRemoteport = await tcpServerInterface.getLocalPortOfTheProtocol(protocol)     //     getRemoteAddressAsync(tcpConn[0]);
      //tcpConne = await getTcpClientConnectionInfoAsync(httpClientLtpUuid);
      let finalTcpAddr = protocol.toLowerCase() + "://" + tcpClientRemoteAddress['ipv-4-address'] + ":" + tcpClientRemoteport;

      const applicationNameData = {
        key,
        protocol,
        finalTcpAddr
      };
      i++;
      applicationNameList.push(applicationNameData);
    }
    return applicationNameList;
  } catch (error) {
    logger.error(error);
  }
}

async function NotifiedDeviceObjectCreationCausesSelfCallingOfLiveResourcePath(counter) {
  try {
    const forwardingName = "NotifiedDeviceObjectCreationCausesSelfCallingOfLiveResourcePath";
    const forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
    if (forwardingConstruct === undefined) {
      return null;
    }

    let fcPortInputDirectionLogicalTerminationPointList = [];
    let fcPortOutputDirectionLogicalTerminationPointList = [];
    const fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
    for (const fcPort of fcPortList) {
      const portDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
      if (FcPort.portDirectionEnum.INPUT === portDirection) {
        fcPortInputDirectionLogicalTerminationPointList.push(fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
      }
    }
    for (const fcPort of fcPortList) {
      const portDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
      if (FcPort.portDirectionEnum.OUTPUT === portDirection) {
        fcPortOutputDirectionLogicalTerminationPointList.push(fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
      }
    }

    let opLtpUuidOutput = fcPortOutputDirectionLogicalTerminationPointList[counter - 3];
    const key = await OperationClientInterface.getOperationKeyAsync(opLtpUuidOutput)
    let applicationNameList = [];
    const opLtpUuid = fcPortInputDirectionLogicalTerminationPointList[0];
    // const key = await OperationClientInterface.getOperationKeyAsync(opLtpUuid)
    const httpLtpUuidList = await LogicalTerminationPoint.getServerLtpListAsync(opLtpUuid);
    const httpClientLtpUuid = httpLtpUuidList[0];
    let tcpConn = await LogicalTerminationPoint.getServerLtpListAsync(httpClientLtpUuid)
    let i = 0;
    let protocol = "";
    for (const connection of tcpConn) {
      if (i == 0) {
        protocol = "HTTP";
      } else {
        protocol = "HTTPS";
      }
      let tcpClientRemoteAddress = await tcpServerInterface.getLocalAddressOfTheProtocol(protocol)     //     getRemoteAddressAsync(tcpConn[0]);
      let tcpClientRemoteport = await tcpServerInterface.getLocalPortOfTheProtocol(protocol)     //     getRemoteAddressAsync(tcpConn[0]);
      //tcpConne = await getTcpClientConnectionInfoAsync(httpClientLtpUuid);
      let finalTcpAddr = protocol.toLowerCase() + "://" + tcpClientRemoteAddress['ipv-4-address'] + ":" + tcpClientRemoteport;

      const applicationNameData = {
        key,
        protocol,
        finalTcpAddr
      };
      i++;
      applicationNameList.push(applicationNameData);
    }
    return applicationNameList;
  } catch (error) {
    reject(error);
  }
}

async function NotifiedDeviceObjectDeletionCausesDeletingTheObjectInCache(counter) {
  try {
    const forwardingName = "NotifiedDeviceObjectDeletionCausesDeletingTheObjectInCache";
    const forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
    if (forwardingConstruct === undefined) {
      return null;
    }

    const fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
    let fcPortOutputDirectionLogicalTerminationPointList = [];
    for (const fcPort of fcPortList) {
      const portDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
      if (FcPort.portDirectionEnum.OUTPUT === portDirection) {
        fcPortOutputDirectionLogicalTerminationPointList.push(fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
      }
    }

    let opLtpUuidOutput = fcPortOutputDirectionLogicalTerminationPointList[counter - 3];
    const key = await OperationClientInterface.getOperationKeyAsync(opLtpUuidOutput)
    let applicationNameList = [];
    let tcpConn = await getTcpClientConnectionInfoAsync(opLtpUuidOutput);
    const applicationNameData = {
      key,
      tcpConn
    };
    applicationNameList.push(applicationNameData);

    return applicationNameList;
  } catch (error) {
    reject();
  }
}