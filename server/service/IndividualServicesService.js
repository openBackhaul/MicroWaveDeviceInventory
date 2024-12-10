'use strict';
const tcpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpServerInterface');
const onfAttributeFormatter = require('onf-core-model-ap/applicationPattern/onfModel/utility/OnfAttributeFormatter');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const logicalTerminationPoint = require('onf-core-model-ap/applicationPattern/onfModel/models/LogicalTerminationPoint');
const tcpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpClientInterface');
const ForwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const FcPort = require('onf-core-model-ap/applicationPattern/onfModel/models/FcPort');
const LogicalTerminationPoint = require('onf-core-model-ap/applicationPattern/onfModel/models/LogicalTerminationPoint');
const OperationClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationClientInterface');
const createHttpError = require('http-errors');
const RestClient = require('./individualServices/rest/client/dispacher');
const cacheResponse = require('./individualServices/cacheResponseBuilder');
const cacheUpdate = require('./individualServices/cacheUpdateBuilder');
const fieldsManager = require('./individualServices/fieldsManagement');
const { getIndexAliasAsync, createResultArray, elasticsearchService } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const RequestHeader = require('onf-core-model-ap/applicationPattern/rest/client/RequestHeader');
const axios = require('axios');
const HttpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpServerInterface');
const RequestBuilder = require('onf-core-model-ap/applicationPattern/rest/client/RequestBuilder');
const subscriberManagement = require('./individualServices/SubscriberManagement');
const inputValidation = require('./individualServices/InputValidation');
const notificationManagement = require('./individualServices/NotificationManagement');
const executionAndTraceService = require('onf-core-model-ap/applicationPattern/services/ExecutionAndTraceService');
const responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
const bequeathHandler = require('./individualServices/BequeathYourDataAndDieHandler');
const alarmHandler = require('./individualServices/alarmUpdater')

const crypto = require("crypto");
const { updateDeviceListFromNotification } = require('./individualServices/CyclicProcessService/cyclicProcess');
const { getDeviceListInMemory } = require('./individualServices/CyclicProcessService/cyclicProcess');
let lastSentMessages = [];

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
// exports.bequeathYourDataAndDie = function (url, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
//   return new Promise(async function (resolve, reject) {

//     let newApplicationDetails = body;
//     let currentReleaseNumber = await HttpServerInterface.getReleaseNumberAsync();
//     let newReleaseNumber = body["new-application-release"];

//     if (newReleaseNumber !== currentReleaseNumber) {

//       softwareUpgrade.upgradeSoftwareVersion(user, xCorrelator, traceIndicator, customerJourney, newApplicationDetails)
//         .catch(err => console.log(`upgradeSoftwareVersion failed with error: ${err}`));
//     }
//   });
// }

exports.bequeathYourDataAndDie = function (url, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {

      await bequeathHandler.handleRequest(body, url);
      resolve();
    } catch (error) {
      console.log(error);
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
        throw new createHttpError(link[0].code, link[0].message);
        return;
      } else {
        correctLink = link;
      }
      let result = await ReadRecords(correctLink);
      if (result != undefined) {
        let ret = await deleteRequest(correctLink);
        let listLink = await ReadRecords("linkList");
        if (listLink.LinkList.includes(correctLink)) {
          let indexToRemove = listLink.LinkList.indexOf(correctLink);
          listLink.LinkList.splice(indexToRemove, 1);
          let elapsedTime = await recordRequest(listLink, "linkList");
        }
        resolve();
      } else {
        let listLink = await ReadRecords("linkList");
        if (listLink != undefined) {
          if (listLink.LinkList.includes(correctLink)) {
            let indexToRemove = listLink.LinkList.indexOf(correctLink);
            listLink.LinkList.splice(indexToRemove, 1);
            let elapsedTime = await recordRequest(listLink, "linkList");
          }
        }
        throw new createHttpError.NotFound(`unable to DELETE records for link ${correctLink}`);
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
      var format = /[ `!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?~]/;
      const matchLink = format.test(link);
      const matchId = format.test(id);
      if (matchLink || matchId) {
        throw new createHttpError("400", "Fields must not contain special chars");
      }
      if (typeof link === 'object') {
        throw new createHttpError(link[0].code, link[0].message);
      } else {
        correctLink = link;
      }
      let result = await ReadRecords(correctLink);
      if (result != undefined) {
        let objectKey = Object.keys(result)[0];
        if (result[objectKey][0] && Array.isArray(result[objectKey][0]["link-port"])) {
          const index = result[objectKey][0]["link-port"].findIndex(port => port["local-id"] === id);
          if (index !== -1) {
            result[objectKey][0]["link-port"] = result[objectKey][0]["link-port"].filter(port => port["local-id"] !== id)
            let elapsedTime = await recordRequest(result, correctLink);
          } else {
            throw new createHttpError.NotFound(`unable to fetch records for linkport ${correctLink} / ${id}`);
          }
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for linkport ${correctLink} / ${id}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to DELETE records for linkport ${correctLink} / ${id}`);
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
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
exports.getCachedActualEquipment = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedAirInterfaceCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedAirInterfaceConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedAirInterfaceHistoricalPerformances = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedAirInterfaceStatus = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedAlarmCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedAlarmConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedAlarmEventRecords = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedCoChannelProfileCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedCoChannelProfileConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedConnector = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedContainedHolder = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIWithCheck(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName();
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, true);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
        if (finalJson != undefined) {
          modifyReturnJson(finalJson);
          let objectKey = Object.keys(finalJson)[0];
          finalJson = finalJson[objectKey];
          if (myFields != undefined) {
            myFields = decodeURIComponent(myFields);
            var objList = [];
            var rootObj = { value: "root", children: [] }
            const replacedUrlFilter = replaceFilterString(myFields);
            var ret = fieldsManager.decodeFieldsSubstringExt(replacedUrlFilter, 0, rootObj)
            objList.push(rootObj)
            fieldsManager.getFilteredJsonExt(finalJson, objList[0].children);
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


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
exports.getCachedCurrentAlarms = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


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
exports.getCachedEquipment = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedEthernetContainerCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedEthernetContainerConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedEthernetContainerHistoricalPerformances = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedEthernetContainerStatus = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedExpectedEquipment = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


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
exports.getCachedFirmwareCollection = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedFirmwareComponentCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedFirmwareComponentList = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedFirmwareComponentStatus = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedForwardingConstruct = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, uuid1, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedForwardingConstructPort = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, uuid1, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


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
exports.getCachedForwardingDomain = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides HybridMwStructureCapability from cache
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
 * returns inline_response_200_39
 **/
exports.getCachedHybridMwStructureCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides HybridMwStructureConfiguration from cache
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
 * returns inline_response_200_40
 **/
exports.getCachedHybridMwStructureConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides HybridMwStructureHistoricalPerformances from cache
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
 * returns inline_response_200_42
 **/
exports.getCachedHybridMwStructureHistoricalPerformances = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides HybridMwStructureStatus from cache
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
 * returns inline_response_200_41
 **/
exports.getCachedHybridMwStructureStatus = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

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
        throw new createHttpError(link[0].code, link[0].message);
        return;
      } else {
        correctLink = link;
      }
      let result = await ReadRecords(correctLink);
      if (result != undefined) {
        let objectKey = Object.keys(result)[0];
        if (objectKey.indexOf("link") != -1) {
          resolve(result);
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for link ${correctLink}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for link ${correctLink}`);
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
      var format = /[ `!@#$%^&*()+\=\[\]{};':"\\|,.<>\/?~]/;
      const matchLink = format.test(link);
      const matchId = format.test(id);
      if (matchLink || matchId) {
        throw new createHttpError("400", "Fields must not contain special chars");
      }
      if (typeof link === 'object') {
        throw new createHttpError(link[0].code, link[0].message);
      } else {
        correctLink = link;
      }
      let result = await ReadRecords(correctLink);
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
            throw new createHttpError.NotFound(`unable to fetch records for linkport ${correctLink} / ${id}`);
          }
          // const linkPortArray = result[0]["link-port"].find(
          //   port => port["local-id"] === id
          // );
          let returnObject = { [topJsonWrapper]: [linkPortArray] };
          resolve(returnObject);
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for linkport ${correctLink} / ${id}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for linkport ${correctLink} / ${id}`);
      }
    } catch (error) {
      reject(error);
    }
  });
}


/**
 * Provides LogicalTerminationPoint from live network
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
exports.getLiveLogicalTerminationPoint = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides LtpAugment from live network
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
exports.getLiveLtpAugment = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides MacInterfaceCapability from cache
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
 * returns inline_response_200_43
 **/
exports.getCachedMacInterfaceCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides MacInterfaceConfiguration from cache
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
 * returns inline_response_200_44
 **/
exports.getCachedMacInterfaceConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides MacInterfaceHistoricalPerformances from cache
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
 * returns inline_response_200_46
 **/
exports.getCachedMacInterfaceHistoricalPerformances = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides MacInterfaceStatus from cache
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
 * returns inline_response_200_45
 **/
exports.getCachedMacInterfaceStatus = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedPolicingProfileCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedPolicingProfileConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


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
exports.getCachedProfile = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedProfileCollection = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

/**
 * Provides PureEthernetStructureCapability from cache
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
 * returns inline_response_200_47
 **/
exports.getCachedPureEthernetStructureCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides PureEthernetStructureConfiguration from cache
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
 * returns inline_response_200_48
 **/
exports.getCachedPureEthernetStructureConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides PureEthernetStructureHistoricalPerformances from cache
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
 * returns inline_response_200_50
 **/
exports.getCachedPureEthernetStructureHistoricalPerformances = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides PureEthernetStructureStatus from cache
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
 * returns inline_response_200_49
 **/
exports.getCachedPureEthernetStructureStatus = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedQosProfileCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedQosProfileConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides SchedulerProfileCapability from cache
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_25
 **/
exports.getCachedSchedulerProfileCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedSchedulerProfileConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides VlanInterfaceCapability from cache
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
 * returns inline_response_200_51
 **/
exports.getCachedVlanInterfaceCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides VlanInterfaceConfiguration from cache
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
 * returns inline_response_200_52
 **/
exports.getCachedVlanInterfaceConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides VlanInterfaceHistoricalPerformances from cache
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
 * returns inline_response_200_54
 **/
exports.getCachedVlanInterfaceHistoricalPerformances = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides VlanInterfaceStatus from cache
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
 * returns inline_response_200_53
 **/
exports.getCachedVlanInterfaceStatus = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides WireInterfaceCapability from cache
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
 * returns inline_response_200_55
 **/
exports.getCachedWireInterfaceCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides WireInterfaceConfiguration from cache
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
 * returns inline_response_200_56
 **/
exports.getCachedWireInterfaceConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides WireInterfaceHistoricalPerformances from cache
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
 * returns inline_response_200_58
 **/
exports.getCachedWireInterfaceHistoricalPerformances = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides WireInterfaceStatus from cache
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
 * returns inline_response_200_57
 **/
exports.getCachedWireInterfaceStatus = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedWredProfileCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
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
exports.getCachedWredProfileConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


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
exports.getCachedLogicalTerminationPoint = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
exports.getCachedLtpAugment = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let myFields = fields;
      if (myFields != undefined) {
        if (!isFilterValid(myFields)) {
          throw new createHttpError.BadRequest;
        }
      }
      url = decodeURIComponent(url);
      const parts = url.split('?fields=');
      url = parts[0];
      //const fields = parts[1];
      let correctMountname = null;
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url);
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctMountname = mountname;
      }
      let returnObject = {};
      const finalUrl = await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName);
      const correctUrl = modifyUrlConcatenateMountNamePlusUuid(finalUrl, correctMountname);

      let result = await ReadRecords(correctMountname);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(correctUrl, result);
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
            if (isJsonEmpty(finalJson)) {
              throw new createHttpError.BadRequest;
            }
          }
          returnObject[objectKey] = finalJson;
        } else {
          throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
        }
      } else {
        throw new createHttpError.NotFound(`unable to fetch records for mountName ${correctMountname}`);
      }
      resolve(returnObject);
    } catch (error) {
      console.error(error);
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
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
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
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides AirInterfaceConfiguration from live network
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
exports.getLiveAirInterfaceConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides AirInterfaceCurrentPerformance from live network
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
 * returns inline_response_200_59
 **/
exports.getLiveAirInterfaceCurrentPerformance = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      //  const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          // modificaUUID(jsonObj, correctCc);
          resolve(jsonObj);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides AirInterfaceHistoricalPerformances from live network
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
exports.getLiveAirInterfaceHistoricalPerformances = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides AirInterfaceStatus from live network
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
exports.getLiveAirInterfaceStatus = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides AlarmCapability from live network
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
exports.getLiveAlarmCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides AlarmConfiguration from live network
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
exports.getLiveAlarmConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides AlarmEventRecords from live network
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
exports.getLiveAlarmEventRecords = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides CoChannelProfileCapability from live network
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
exports.getLiveCoChannelProfileCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides CoChannelProfileConfiguration from live network
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
exports.getLiveCoChannelProfileConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides Connector from live network
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
exports.getLiveConnector = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides ContainedHolder from live network
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
exports.getLiveContainedHolder = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
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
      url = decodeURIComponent(url);
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const urlParts = url.split("?fields=");
      const myFields = urlParts[1];

      let correctCc = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, true);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
        return;
      } else {
        correctCc = mountname;
      }
      let Url = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl1 = formatUrlForOdl(decodeURIComponent(Url));
      const finalUrl = formatUrlForOdl(Url);
      const Authorization = common[0].key;
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const result = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (result == false) {
          resolve(NotFound());
          throw new createHttpError.NotFound;
        } else if (result.status != 200) {
          if (result.statusText == undefined) {
            resolve(result.status, result.message);
            throw new createHttpError(result.status, result.message);
          } else {
            resolve(result.status, result.statusText);
            throw new createHttpError(result.status, result.statusText);
          }
        } else {
          let jsonObj = result.data;
          modificaUUID(jsonObj, correctCc);
          if (myFields === undefined) {
            try {
              let elapsedTime = await recordRequest(jsonObj, correctCc);
            }
            catch (error) {
              console.error(error);
            }
            modifyReturnJson(jsonObj);
            let res = await cacheResponse.cacheResponseBuilder(url, jsonObj);
            resolve(res);
          } else {
            let filters = true;
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            try {
              // read from ES
              let result1 = await ReadRecords(correctCc);
              // Update json object
              let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result1, jsonObj, filters);
              // Write updated Json to ES
              let elapsedTime = await recordRequest(result1, correctCc);
            }
            catch (error) {
              console.error(error);
            }
            modifyReturnJson(jsonObj)
            let splittedUrl = url.split('?');
            let res = await cacheResponse.cacheResponseBuilder(splittedUrl[0], jsonObj);
            resolve(res);
          }

        }
      }
    }
    catch (error) {
      console.error(error);
      reject(error);
    }

  });
}


/**
 * Provides CurrentAlarms from live network
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
exports.getLiveCurrentAlarms = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.message == undefined) {
            resolve(res);
            throw new createHttpError(res.status, res.statusText);
          } else {
            resolve(res);
            throw new createHttpError(res.status, res.message);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides Equipment from live network
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
exports.getLiveEquipment = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides EthernetContainerCapability from live network
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
exports.getLiveEthernetContainerCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides EthernetContainerConfiguration from live network
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
exports.getLiveEthernetContainerConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides EthernetContainerCurrentPerformance from live network
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
 * returns inline_response_200_60
 **/
exports.getLiveEthernetContainerCurrentPerformance = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      //  const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.notFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          // modificaUUID(jsonObj, correctCc);
          resolve(jsonObj);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides EthernetContainerHistoricalPerformances from live network
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
exports.getLiveEthernetContainerHistoricalPerformances = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides EthernetContainerStatus from live network
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
exports.getLiveEthernetContainerStatus = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides ExpectedEquipment from live network
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
exports.getLiveExpectedEquipment = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides FirmwareCollection from live network
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
exports.getLiveFirmwareCollection = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides FirmwareComponentCapability from live network
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
exports.getLiveFirmwareComponentCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides FirmwareComponentList from live network
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
exports.getLiveFirmwareComponentList = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides FirmwareComponentStatus from live network
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
exports.getLiveFirmwareComponentStatus = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

/**
 * Provides ForwardingConstruct from live network
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
 * returns inline_response_200_63
 **/
exports.getLiveForwardingConstruct = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, uuid1, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides ForwardingConstructPort from live network
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
 * returns inline_response_200_64
 **/
exports.getLiveForwardingConstructPort = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, uuid1, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides ForwardingDomain from live network
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mountName of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_62
 **/
exports.getLiveForwardingDomain = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

/**
 * Provides HybridMwStructureCapability from live network
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
 * returns inline_response_200_39
 **/
exports.getLiveHybridMwStructureCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides HybridMwStructureConfiguration from live network
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
 * returns inline_response_200_40
 **/
exports.getLiveHybridMwStructureConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides HybridMwStructureCurrentPerformance from live network
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
 * returns inline_response_200_61
 **/
exports.getLiveHybridMwStructureCurrentPerformance = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      //  const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          // modificaUUID(jsonObj, correctCc);
          resolve(jsonObj);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides HybridMwStructureHistoricalPerformances from live network
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
 * returns inline_response_200_42
 **/
exports.getLiveHybridMwStructureHistoricalPerformances = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides HybridMwStructureStatus from live network
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
 * returns inline_response_200_41
 **/
exports.getLiveHybridMwStructureStatus = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides MacInterfaceCapability from live network
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
 * returns inline_response_200_43
 **/
exports.getLiveMacInterfaceCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides MacInterfaceConfiguration from live network
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
 * returns inline_response_200_44
 **/
exports.getLiveMacInterfaceConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides MacInterfaceCurrentPerformance from live network
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
 * returns inline_response_200_62
 **/
exports.getLiveMacInterfaceCurrentPerformance = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      //  const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          // modificaUUID(jsonObj, correctCc);
          resolve(jsonObj);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides MacInterfaceHistoricalPerformances from live network
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
 * returns inline_response_200_46
 **/
exports.getLiveMacInterfaceHistoricalPerformances = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides MacInterfaceStatus from live network
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
 * returns inline_response_200_45
 **/
exports.getLiveMacInterfaceStatus = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides PolicingProfileCapability from live network
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
exports.getLivePolicingProfileCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides PolicingProfileConfiguration from live network
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
exports.getLivePolicingProfileConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides Profile from live network
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
exports.getLiveProfile = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides ProfileCollection from live network
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
exports.getLiveProfileCollection = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides PureEthernetStructureCapability from live network
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
 * returns inline_response_200_47
 **/
exports.getLivePureEthernetStructureCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides PureEthernetStructureConfiguration from live network
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
 * returns inline_response_200_48
 **/
exports.getLivePureEthernetStructureConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides PureEthernetStructureCurrentPerformance from live network
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
 * returns inline_response_200_63
 **/
exports.getLivePureEthernetStructureCurrentPerformance = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      //  const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          // modificaUUID(jsonObj, correctCc);
          resolve(jsonObj);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides PureEthernetStructureHistoricalPerformances from live network
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
 * returns inline_response_200_50
 **/
exports.getLivePureEthernetStructureHistoricalPerformances = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides PureEthernetStructureStatus from live network
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
 * returns inline_response_200_49
 **/
exports.getLivePureEthernetStructureStatus = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides QosProfileCapability from live network
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
exports.getLiveQosProfileCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides QosProfileConfiguration from live network
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
exports.getLiveQosProfileConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides SchedulerProfileCapability from live network
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * mountName String The mount-name of the device that is addressed by the request
 * uuid String Instance identifier that is unique within the device
 * fields String Query parameter to filter ressources according to RFC8040 fields filter spec (optional)
 * returns inline_response_200_25
 **/
exports.getLiveSchedulerProfileCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

/**
 * Provides SchedulerProfileConfiguration from live network
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
exports.getLiveSchedulerProfileConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides VlanInterfaceCapability from live network
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
 * returns inline_response_200_51
 **/
exports.getLiveVlanInterfaceCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides VlanInterfaceConfiguration from live network
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
 * returns inline_response_200_52
 **/
exports.getLiveVlanInterfaceConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides VlanInterfaceCurrentPerformance from live network
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
 * returns inline_response_200_64
 **/
exports.getLiveVlanInterfaceCurrentPerformance = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      //  const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          // modificaUUID(jsonObj, correctCc);
          resolve(jsonObj);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides VlanInterfaceHistoricalPerformances from live network
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
 * returns inline_response_200_54
 **/
exports.getLiveVlanInterfaceHistoricalPerformances = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides VlanInterfaceStatus from live network
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
 * returns inline_response_200_53
 **/
exports.getLiveVlanInterfaceStatus = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides WireInterfaceCapability from live network
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
 * returns inline_response_200_55
 **/
exports.getLiveWireInterfaceCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides WireInterfaceConfiguration from live network
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
 * returns inline_response_200_56
 **/
exports.getLiveWireInterfaceConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides WireInterfaceCurrentPerformance from live network
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
 * returns inline_response_200_65
 **/
exports.getLiveWireInterfaceCurrentPerformance = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          // modificaUUID(jsonObj, correctCc);
          resolve(jsonObj);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides WireInterfaceHistoricalPerformances from live network
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
 * returns inline_response_200_58
 **/
exports.getLiveWireInterfaceHistoricalPerformances = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides WireInterfaceStatus from live network
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
 * returns inline_response_200_57
 **/
exports.getLiveWireInterfaceStatus = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides WredProfileCapability from live network
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
exports.getLiveWredProfileCapability = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Provides WredProfileConfiguration from live network
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
exports.getLiveWredProfileConfiguration = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      let jsonObj = "";
      url = decodeURIComponent(url);
      const urlParts = url.split("?fields=");
      url = urlParts[0];
      // const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const myFields = urlParts[1];
      const endUrl = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl = formatUrlForOdl(decodeURIComponent(endUrl), urlParts[1]);
      const Authorization = common[0].key;
      let correctCc = null;
      let retJson = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, false);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
      } else {
        correctCc = mountname;
      }
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (res == false) {
          throw new createHttpError.NotFound;
        } else if (res.status != 200) {
          if (res.statusText == undefined) {
            throw new createHttpError(res.status, res.message);
          } else {
            throw new createHttpError(res.status, res.statusText);
          }
        } else {
          let jsonObj = res.data;
          retJson = jsonObj;
          modificaUUID(jsonObj, correctCc);
          let filters = false;
          if (myFields !== undefined) {
            filters = true;
          }
          try {
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            // read from ES
            let result = await ReadRecords(correctCc);
            // Update json object
            let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result, jsonObj, filters);
            // Write updated Json to ES
            let elapsedTime = await recordRequest(result, correctCc);
          }
          catch (error) {
            console.error(error);
          }
          modifyReturnJson(retJson)
          resolve(retJson);
        }
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

/**
 * Offers subscribing for notifications about device attributes being changed in the cache
 *
 * body V1_notifyattributevaluechanges_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.notifyAttributeValueChanges = async function (url, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      let subscribingApplicationName = body["subscriber-application"];
      let subscribingApplicationRelease = body["subscriber-release-number"];
      let subscribingApplicationProtocol = body["subscriber-protocol"];
      let subscribingApplicationAddress = body["subscriber-address"];
      let subscribingApplicationPort = body["subscriber-port"];
      let notificationsReceivingOperation = body["subscriber-operation"];

      let validInput = inputValidation.validateSubscriberInput(
        subscribingApplicationName,
        subscribingApplicationRelease,
        subscribingApplicationProtocol,
        subscribingApplicationAddress,
        subscribingApplicationPort,
        notificationsReceivingOperation
      );

      if (validInput) {
        let success = await subscriberManagement.addSubscriberToConfig(url, subscribingApplicationName, subscribingApplicationRelease, subscribingApplicationProtocol,
          subscribingApplicationAddress, subscribingApplicationPort, notificationsReceivingOperation);

        if (!success) {
          throw new Error('notifyControllerObjectCreations: addSubscriber failed');
        }
      } else {
        throw new Error('notifyControllerObjectCreations: invalid input data');
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}



/**
 * Offers subscribing for notifications about device objects being created in the cache
 *
 * body V1_notifyobjectcreations_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.notifyObjectCreations = function (url, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      let subscribingApplicationName = body["subscriber-application"];
      let subscribingApplicationRelease = body["subscriber-release-number"];
      let subscribingApplicationProtocol = body["subscriber-protocol"];
      let subscribingApplicationAddress = body["subscriber-address"];
      let subscribingApplicationPort = body["subscriber-port"];
      let notificationsReceivingOperation = body["subscriber-operation"];

      let validInput = inputValidation.validateSubscriberInput(
        subscribingApplicationName,
        subscribingApplicationRelease,
        subscribingApplicationProtocol,
        subscribingApplicationAddress,
        subscribingApplicationPort,
        notificationsReceivingOperation
      );

      if (validInput) {
        let success = await subscriberManagement.addSubscriberToConfig(url, subscribingApplicationName, subscribingApplicationRelease, subscribingApplicationProtocol,
          subscribingApplicationAddress, subscribingApplicationPort, notificationsReceivingOperation);

        if (!success) {
          throw new Error('notifyControllerObjectCreations: addSubscriber failed');
        }
      } else {
        throw new Error('notifyControllerObjectCreations: invalid input data');
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}


/**
 * Offers subscribing for notifications about device objects being deleted from the cache
 *
 * body V1_notifyobjectdeletions_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.notifyObjectDeletions = function (url, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      let subscribingApplicationName = body["subscriber-application"];
      let subscribingApplicationRelease = body["subscriber-release-number"];
      let subscribingApplicationProtocol = body["subscriber-protocol"];
      let subscribingApplicationAddress = body["subscriber-address"];
      let subscribingApplicationPort = body["subscriber-port"];
      let notificationsReceivingOperation = body["subscriber-operation"];

      let validInput = inputValidation.validateSubscriberInput(
        subscribingApplicationName,
        subscribingApplicationRelease,
        subscribingApplicationProtocol,
        subscribingApplicationAddress,
        subscribingApplicationPort,
        notificationsReceivingOperation
      );

      if (validInput) {
        let success = await subscriberManagement.addSubscriberToConfig(url, subscribingApplicationName, subscribingApplicationRelease, subscribingApplicationProtocol,
          subscribingApplicationAddress, subscribingApplicationPort, notificationsReceivingOperation);

        if (!success) {
          throw new Error('notifyControllerObjectCreations: addSubscriber failed');
        }
      } else {
        throw new Error('notifyControllerObjectCreations: invalid input data');
      }
      resolve();
    } catch (error) {
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
      let result = await ReadRecords(mountName);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(parts[0], result);
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
              if(equipmentType !== undefined){
              return {
              uuid: item.uuid,
              "equipment-type-name":equipmentType,
            }}
            }).filter((item)=> item !== undefined)
          };
          returnObject = transformedData;
        } else {
          throw new createHttpError(404, `unable to fetch records for mount-name ${mountName}`);
        }
      } else {
        throw new createHttpError(404, `unable to fetch records for mount-name ${mountName}`);
      }
      resolve(returnObject);
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
      let mountname = "DeviceList"
      let returnObject = {};
      let result = await ReadRecords(mountname);
      if (result != undefined) {
        const outputJson = {
          "mount-name-list": result.deviceList.map(item => item["node-id"])
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
      let result = await ReadRecords(mountName);
      if (result != undefined) {
        let finalJson = await cacheResponse.cacheResponseBuilder(parts[0], result);
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
        throw new createHttpError(404, `unable to fetch records for mount-name ${mountName}`);
      }
      resolve(returnObject);
    } catch (error) {
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
      let linkToCompare = await ReadRecords(linkId);
      if (linkToCompare == undefined) {
        throw new createHttpError.NotFound(`unable to fetch records for link ${linkId}`)
      }
      if (!linkToCompare["core-model-1-4:link"][0]["end-point-list"]) {
        index = 1;
      }
      const controlConstructList = linkToCompare["core-model-1-4:link"][index]["end-point-list"].map(endpoint => endpoint["control-construct"]);
      let result = await ReadRecords("linkList");
      for (var link of result.LinkList) {
        if (link != linkId) {
          let resLink = await ReadRecords(link);
          try {
            if (!resLink["core-model-1-4:link"][0]["end-point-list"]) {
              index1 = 1;
            }
            const ccList = resLink["core-model-1-4:link"][index1]["end-point-list"].map(endpoint => endpoint["control-construct"]);
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
      var format = /[ `!@#$%^&*()+\=\[\]{};':"\\|,.<>\/?~]/;
      const matchLink = format.test(link);
      if (matchLink) {
        throw new createHttpError("400", "Fields must not contain special chars");
      }
      if (typeof link === 'object') {
        throw new createHttpError(link[0].code, link[0].message);
        return;
      } else {
        correctLink = link;
      }
      let value = await ReadRecords(correctLink);
      let result = await ReadRecords("linkList");
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
        let elapsedTime = await recordRequest(value, correctLink);
      } else {
        throw new createHttpError.NotFound(`link ${correctLink} not found in cache: cannot put linkport for unknown link`);
      }
      resolve();
    } catch (error) {
      console.error(error);
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
        throw new createHttpError(link[0].code, link[0].message);
        return;
      } else {
        correctLink = link;
      }
      let elapsedTime = await recordRequest(body, correctLink);
      let result = await ReadRecords("linkList");
      if (result == undefined) {
        console.warn("link list in Elasticsearch not found");
        const myObject = { LinkList: [] };
        myObject.LinkList.push(correctLink);
        let elapsedTime = await recordRequest(myObject, "linkList");
      } else {
        let linkListArray = result["LinkList"];
        // Verify if link already exists in linklist
        if (!linkListArray.includes(correctLink)) {
          result.LinkList.push(correctLink);
          let elapsedTime = await recordRequest(result, "linkList");
        }
      }
      resolve();
    } catch (error) {
      console.error(error);
      reject(error);
    }

  });
}


/**
 * Receives notifications about attribute value changes at the Controller
 *
 * body V1_regardcontrollerattributevaluechange_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.regardControllerAttributeValueChange = function (url, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      let objectKey = Object.keys(body)[0];
      let currentJSON = body[objectKey];
      let resource = currentJSON['resource'];
      let attributeName = currentJSON['attribute-name'];
      let newValue = currentJSON['new-value'];

      const match = resource.match(/logical-termination-point=(\w+)/);

      // Extract the Control-construct
      const logicalTerminationPoint = match ? match[1] : null;
      // Create an object req 
      let urlString = '/core-model-1-4:network-control-domain=live/control-construct=' + logicalTerminationPoint;
      const urlf = require('url');
      const parsedUrl = urlf.parse(urlString);

      // const appNameAndUuidFromForwarding = await NotifiedDeviceAlarmCausesUpdatingTheEntryInCurrentAlarmListOfCache()
      const tempUrl = decodeURIComponent(notify[0].finalTcpAddr);
      // Parse the URL
      const parsedNewUrl = new URL(tempUrl);
      // Construct the base URL
      const baseUrl = `${parsedNewUrl.protocol}//${parsedNewUrl.host}`;
      const finalUrl = baseUrl + urlString;

      //  const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(urlString)
      if (attributeName == 'connection-status' && newValue == 'connected') {
        updateDeviceListFromNotification(1, logicalTerminationPoint);
        /*try {
          let resRequestor = await sentDataToRequestor(null, user, originator, xCorrelator, traceIndicator, customerJourney, finalUrl, appNameAndUuidFromForwarding[0].key);
          //let ret = getLiveControlConstruct(simulatedReq, res, null, null, null, user, originator, xCorrelator, traceIndicator, customerJourney);
          console.log("")
        } catch (error) {
          console.error(`Error in REST call for ${logicalTerminationPoint}:`, error.message);
          reject(error);
        } */
      } else if (attributeName == 'connection-status' && newValue !== 'connected') {
        updateDeviceListFromNotification(2, logicalTerminationPoint);
        let indexAlias = common[1].indexAlias;
        const { deleteRecordFromElasticsearch } = module.exports;
        let ret = await deleteRecordFromElasticsearch(indexAlias, '_doc', logicalTerminationPoint);
        console.log('* ' + ret.result);
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}


/**
 * Receives notifications about alarms at devices
 *
 * body V1_regarddevicealarm_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.regardDeviceAlarm = function (url, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      let objectKey = Object.keys(body)[0];
      let currentJSON = body[objectKey];
      let resource = currentJSON['resource'];
      let timeStamp = currentJSON['timestamp'];
      let alarmTypeId = currentJSON['alarm-type-id'];
      let alarmTypeQualifier = currentJSON['alarm-type-qualifier'];
      let problemSeverity = currentJSON['problem-severity'];

      let mountname = decodeMountName(resource, false);

      let result = await ReadRecords(mountname);
      if (result == undefined) {
        throw new createHttpError.NotFound("unable to find device")
      }
      modifyReturnJson(result);

      let updatedAttributes = {
        "alarm-severity": "alarms-1-0:SEVERITY_TYPE_" + problemSeverity.toUpperCase(),
        "alarm-type-qualifier": alarmTypeQualifier,
        "alarm-type-id": alarmTypeId,
        "timestamp": timeStamp,
        "resource": resource
      };
      // Update json object

      alarmHandler.updateAlarmByTypeAndResource(result, alarmTypeId, resource, problemSeverity, updatedAttributes);
      // Write updated Json to ES
      modificaUUID(result, mountname);
      let elapsedTime = await recordRequest(result, mountname);

      resolve();
    } catch (error) {
      //console.error(error);
      reject(error);
    }
  });
}


/**
 * Receives notifications about changes of values of attributes inside the devices
 *
 * body V1_regarddeviceattributevaluechange_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.regardDeviceAttributeValueChange = function (url, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      let objectKey = Object.keys(body)[0];
      let currentJSON = body[objectKey];
      let resource = currentJSON['object-path'];
      let counter = currentJSON['counter'];
      let attributeName = currentJSON['attribute-name'];
      let jsonObj = "";
      url = decodeURIComponent(url);

      // const appNameAndUuidFromForwarding = await NotifiedDeviceAttributeValueChangeCausesUpdateOfCache(counter)
      const tempUrl = decodeURIComponent(notify[0].finalTcpAddr);
      // Parse the URL
      const parsedUrl = new URL(tempUrl);

      // Construct the base URL
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
      const finalUrl = baseUrl + resource;
      let resRequestor = await sentDataToRequestor(body, user, originator, xCorrelator, traceIndicator, customerJourney, finalUrl, notify[0].key);
      //const res = await RestClient.dispatchEvent(finalUrl, 'GET', '', appNameAndUuidFromForwarding[0].key)
      if (resRequestor == null) {
        throw new createHttpError.NotFound;
      } else if (resRequestor.status != 200) {
        if (resRequestor.statusText == undefined) {
          throw new createHttpError(resRequestor.response.status, resRequestor.response.message);
        } else {
          throw new createHttpError(resRequestor.response.status, resRequestor.response.statusText);
        }
      } else if (!hasAttribute(resRequestor.data, attributeName)) {
        throw new createHttpError.BadRequest;
      } else {
        let appInformation = proxy;
        const releaseNumber = appInformation["release-number"];
        let parts = releaseNumber.split(".");
        const applicationName = appInformation["application-name"] + "-" + parts[0] + "-" + parts[1] + ":attribute-value-changed-notification";
        const newJson = {};
        newJson[applicationName] = {
          "counter": counter,
          "timestamp": currentJSON.timestamp,
          "attribute-name": currentJSON["attribute-name"],
          "new-value": currentJSON["new-value"]
        };
        notifyAllDeviceSubscribers("/v1/notify-attribute-value-changes", newJson);
        resolve();
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Receives notifications about objects that have been created inside the devices
 *
 * body V1_regarddeviceobjectcreation_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.regardDeviceObjectCreation = function (url, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      let objectKey = Object.keys(body)[0];
      let currentJSON = body[objectKey];
      let resource = currentJSON['object-path'];
      let counter = currentJSON['counter'];
      let jsonObj = "";
      // find the index of the last "/"
      //      const lastIndex = resource.lastIndexOf("/");
      // Truncate path at last "/"  
      //      const truncatedPath = resource.substring(0, lastIndex);
      url = decodeURIComponent(url);

      //  const appNameAndUuidFromForwarding = await NotifiedDeviceObjectCreationCausesSelfCallingOfLiveResourcePath(counter)
      const tempUrl = decodeURIComponent(notify[0].finalTcpAddr);
      // Parse the URL
      const parsedUrl = new URL(tempUrl);

      // Construct the base URL
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
      const finalUrl = baseUrl + resource;
      let resRequestor = await sentDataToRequestor(body, user, originator, xCorrelator, traceIndicator, customerJourney, finalUrl, notify[0].key);
      if (resRequestor == null) {
        throw new createHttpError.NotFound;
      } else if (resRequestor.status != 200) {
        if (resRequestor.response.statusText == undefined) {
          throw new createHttpError(resRequestor.response.status, resRequestor.response.message);
        } else {
          throw new createHttpError(resRequestor.response.status, resRequestor.response.statusText);
        }
      } else {
        let appInformation = proxy;
        const releaseNumber = appInformation["release-number"];
        let parts = releaseNumber.split(".");
        const applicationName = appInformation["application-name"] + "-" + parts[0] + "-" + parts[1] + ":object-creation-notification";
        const newJson = {};
        newJson[applicationName] = {
          "counter": counter,
          "timestamp": currentJSON.timestamp,
          "object-path": resource,
        };
        notifyAllDeviceSubscribers("/v1/notify-object-creations", newJson);
        resolve();
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


/**
 * Receives notifications about objects that have been deleted inside the devices
 *
 * body V1_regarddeviceobjectdeletion_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.regardDeviceObjectDeletion = function (url, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      let objectKey = Object.keys(body)[0];
      let currentJSON = body[objectKey];
      let resource = currentJSON['object-path'];
      let counter = currentJSON['counter'];
      /*
      let jsonObj = "";
      let correctPlaceHolder = resource.replace("live", "cache");      
      const appNameAndUuidFromForwarding = await NotifiedDeviceObjectDeletionCausesDeletingTheObjectInCache(counter)
      const tempUrl = decodeURIComponent(appNameAndUuidFromForwarding[0].tcpConn);
      // Parse the URL
      const parsedUrl = new URL(tempUrl);

      // Construct the base URL
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
      const finalUrl = baseUrl + correctPlaceHolder;
      */
      let matchUrl = resource.split("live/");
      let DefUrl = matchUrl[1];
      // Find CC in url
      const match = resource.match(/control-construct=(\w+)/);
      const controlConstruct = match ? match[1] : null;
      // read from ES
      let result = await ReadRecords(controlConstruct);
      if (result == undefined) {
        throw new createHttpError.NotFound("unable to find device")
      }
      modifyReturnJson(result);
      // Update json object
      let finalJson = cacheUpdate.cacheUpdateBuilder(DefUrl, result, null, null);
      // Write updated Json to ES
      modificaUUID(result, controlConstruct);
      let elapsedTime = await recordRequest(result, controlConstruct);
      let appInformation = proxy;
      const releaseNumber = appInformation["release-number"];
      let parts = releaseNumber.split(".");
      const applicationName = appInformation["application-name"] + "-" + parts[0] + "-" + parts[1] + ":object-deletion-notification";
      const newJson = {};
      newJson[applicationName] = {
        "counter": currentJSON.counter,
        "timestamp": currentJSON.timestamp,
        "object-path": resource
      };
      notifyAllDeviceSubscribers("/v1/notify-object-deletions", newJson);
      resolve();
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

exports.getLiveDeviceList = function (url) {
  return new Promise(async function (resolve, reject) {
    try {
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingNameForDeviceList();
      let urlForOdl = "/rests/data/network-topology:network-topology/topology=topology-netconf?fields=node(node-id;netconf-node-topology:connection-status)"
      const finalUrl = common[0].tcpConn + urlForOdl;
      const Authorization = common[0].key;
      const result = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization);
      if (result.status == 200) {
        let deviceList = result["data"]["network-topology:topology"][0].node;
        resolve(deviceList);
      } else {
        reject("Error in retrieving device list from ODL. (" + result.status + " - " + result.statusText + ")");
      }
    } catch (error) {
      reject(error);
    }
  });
}

exports.writeDeviceListToElasticsearch = function (deviceList) {
  return new Promise(async function (resolve, reject) {
    try {
      let deviceListToWrite = '{"deviceList":' + deviceList + '}';
      let result = await recordRequest(deviceListToWrite, "DeviceList");
      if (result.took !== undefined) {
        resolve(true);
      } else {
        reject("Error in writing device list to elasticsearch.")
      }
    } catch (error) {
      reject(error);
    }
  })
}

exports.readDeviceListFromElasticsearch = function () {
  return new Promise(async function (resolve, reject) {
    try {
      let result = await ReadRecords("DeviceList");
      if (result == undefined) {
        reject("Device list in Elasticsearch not found");
      } else {
        let esDeviceList = result["deviceList"];
        resolve(esDeviceList);
      }
    } catch (error) {
      reject(error);
    }
  })
}

exports.deleteRecordFromElasticsearch = function (index, type, id) {
  return new Promise(async function (resolve, reject) {
    try {
      let exists = false;
      let client = await common[1].EsClient;
      if (id) {
        exists = await client.exists({ index: index, type: type, id: id });
      }
      let ret
      if (exists.body) {
        await client.delete({ index: index, type: type, id: id });
        ret = { _id: id, result: 'Element ' + id + ' deleted.' };
      } else {
        ret = { _id: id, result: 'Element ' + id + ' not deleted. (Not found in elasticsearch).' };
      }
      resolve(ret);
    }
    catch (error) {
      reject(error);
    }
  })
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
        applicationName = "OpenDayLight";
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
    console.error(error);
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
      console.log("starting notification of " + activeSubscribers.length + " subscribers for '" + deviceNotificationType + "'");

      for (let subscriber of activeSubscribers) {
        sendMessageToSubscriber(deviceNotificationType, subscriber.targetOperationURL, subscriber.operationKey, notificationMessage);
      }
    } else {
      console.warn("no subscribers for " + deviceNotificationType + ", message discarded");
    }
  } catch (error) {
    console.error(error);
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
    console.warn("notification duplicate ignored");
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
    console.log("sending subscriber notification to: " + targetOperationURL + " with content: " + JSON.stringify(notificationMessage) + " - debugId: '" + uniqueSendingID + "'");

    axios.post(targetOperationURL, notificationMessage, {
      // axios.post("http://localhost:1237", notificationMessage, {
      headers: {
        'x-correlator': requestHeader.xCorrelator,
        'trace-indicator': requestHeader.traceIndicator,
        'user': requestHeader.user,
        'originator': requestHeader.originator,
        'customer-journey': requestHeader.customerJourney,
        'operation-key': operationKey
      }
    })
      .then((response) => {
        console.warn("subscriber-notification success, notificationType " + notificationType + ", target url: " + targetOperationURL + ", result status: " + response.status + " - debugId: '" + uniqueSendingID + "'");

        executionAndTraceService.recordServiceRequestFromClient(
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
      })
      .catch(e => {
        console.error(e, "error during subscriber-notification for " + notificationType + " - debugId: '" + uniqueSendingID + "'");

        executionAndTraceService.recordServiceRequestFromClient(
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
      });
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
    console.error(error);
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
    console.error(error);
  }
}

async function sentDataToRequestor(body, user, originator, xCorrelator, traceIndicator, customerJourney, requestorUrl, operationKey) {
  let httpRequestHeaderRequestor;

  //TO FIX
  //let operationKey = 'Operation key not yet provided.'

  let httpRequestHeader = new RequestHeader(
    user,
    originator,
    xCorrelator,
    traceIndicator,
    customerJourney,
    operationKey
  );

  httpRequestHeaderRequestor = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(httpRequestHeader);
  console.log('Send data to Requestor:' + requestorUrl);

  try {
    let response = await axios(requestorUrl, {
      headers: httpRequestHeaderRequestor
    });
    return response;
  }
  catch (error) {
    return (error);
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
        console.error(`SubscribingForNotifications - subscribing request from MWDI with body ${JSON.stringify(httpRequestBody)} failed with response status: ${response.status}`);
      }
      console.error(`SubscribingForNotifications - subscribing request from MWDI with body ${JSON.stringify(httpRequestBody)} failed with response status: ${response.status}`);
    }

  } catch (error) {
    console.error(`SubscribingForNotifications - subscribing request from MWDI with body ${JSON.stringify(httpRequestBody)} failed with response status: ${error.message}`);
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
    console.error(error);
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
    console.error(error);
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
        applicationName = "OpenDayLight";
        tcpConn = await OperationClientInterface.getTcpClientConnectionInfoAsync(opLtpUuid);
        EsClient = await elasticsearchService.getClient(false);
      } else if (opLtpUuid.includes("es")) {
        tcpConn = await getTcpClientConnectionInfoAsync(opLtpUuid);
        applicationName = "ElasticSearch";
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
    console.error(error);
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
    console.error(error);
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
    console.error(error);
  }
}

async function retrieveCorrectUrl(originalUrl, path, applicationName) {
  try {
    const urlParts = originalUrl.split("?fields=");
    const myFields = urlParts[1];
    let ControlConstruct = urlParts[0].match(/control-construct=([^/]+)/)[1];
    let placeHolder = "";
    if (applicationName === "OpenDayLight") {
      placeHolder = "/rests/data/network-topology:network-topology/topology=topology-netconf/node=tochange/yang-ext:mount/core-model-1-4:control-construct"
    } else if (applicationName === "ElasticSearch") {
      placeHolder = "/";
    }
    var sequenzaDaCercare = "control-construct=" + ControlConstruct;
    var indiceSequenza = originalUrl.indexOf(sequenzaDaCercare);

    if (indiceSequenza !== -1) {
      var parte1 = urlParts[0].substring(0, indiceSequenza);
      if (applicationName === "OpenDayLight") {
        var parte2 = urlParts[0].substring(indiceSequenza + sequenzaDaCercare.length);
      } else if (applicationName === "ElasticSearch") {
        var parte2 = urlParts[0].substring(indiceSequenza);
      }
    }

    let correctPlaceHolder = placeHolder.replace("tochange", ControlConstruct);
    let final = path + correctPlaceHolder + parte2;
    if (final.indexOf("+") != -1) {
      var correctUrl = final.replace(/=.*?\+/g, "=");
    } else {
      correctUrl = final;
    }
    if (myFields != undefined) {
      final = final + "?fields=" + myFields;
    }
    return final;
  } catch (error) {
    console.error(error);
  }
}

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

      applicationName = "ElasticSearch";
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
    console.error(error);
  }
}

exports.GetBequeathYourDataAndDieData = function GetBequeathYourDataAndDieData() {
  return new Promise(async function (resolve, reject) {
    try {
      const forwardingName = "PromptForEmbeddingCausesRequestForBequeathingData"
      const forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);

      let fcPortOutputDirectionLogicalTerminationPointList = [];
      const fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
      for (const fcPort of fcPortList) {
        const portDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
        if (FcPort.portDirectionEnum.OUTPUT === portDirection) {
          fcPortOutputDirectionLogicalTerminationPointList.push(fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
        }
      }

      let retObj = new Object()
      for (const opLtpUuid of fcPortOutputDirectionLogicalTerminationPointList) {
        const httpLtpUuidList = await LogicalTerminationPoint.getServerLtpListAsync(opLtpUuid);
        const httpClientLtpUuid = httpLtpUuidList[0];
        const path = await OperationClientInterface.getOperationNameAsync(opLtpUuid);
        const key = await OperationClientInterface.getOperationKeyAsync(opLtpUuid)
        const tcpConn = await OperationClientInterface.getTcpClientConnectionInfoAsync(opLtpUuid);

        retObj = {
          operationKey: key,
          operationName: path
        }
      }
      resolve(retObj);
    } catch (error) {
      reject()
    }
  });
}

exports.GetNotificationProxyData = function GetNotificationProxyData() {
  return new Promise(async function (resolve, reject) {
    try {
      const forwardingName = "PromptForBequeathingDataCausesUnsubscribingFromDeviceAndControllerNotificationsAtNP";
      const forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);

      let fcPortOutputDirectionLogicalTerminationPointList = [];
      const fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
      for (const fcPort of fcPortList) {
        const portDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
        if (FcPort.portDirectionEnum.OUTPUT === portDirection) {
          fcPortOutputDirectionLogicalTerminationPointList.push(fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
        }
      }

      let retObj = new Object()
      for (const opLtpUuid of fcPortOutputDirectionLogicalTerminationPointList) {
        const httpLtpUuidList = await LogicalTerminationPoint.getServerLtpListAsync(opLtpUuid);
        const httpClientLtpUuid = httpLtpUuidList[0];
        const path = await OperationClientInterface.getOperationNameAsync(opLtpUuid);
        const key = await OperationClientInterface.getOperationKeyAsync(opLtpUuid)
        const tcpConn = await OperationClientInterface.getTcpClientConnectionInfoAsync(opLtpUuid);

        retObj = {
          operationKey: key,
          operationName: path,
          tcpConn: tcpConn
        }
      }
      resolve(retObj);
    } catch (error) {
      reject()
    }
  });
}

exports.GetApplicationData = function GetApplicationData() {
  return new Promise(async function (resolve, reject) {
    try {

      let name = getApplicationNameAsync
      const forwardingName = "ServiceRequestCausesLoggingRequest";
      const forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);

      let fcPortOutputDirectionLogicalTerminationPointList = [];
      const fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
      for (const fcPort of fcPortList) {
        const portDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
        if (FcPort.portDirectionEnum.OUTPUT === portDirection) {
          fcPortOutputDirectionLogicalTerminationPointList.push(fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
        }
      }

      let retObj = new Object()
      for (const opLtpUuid of fcPortOutputDirectionLogicalTerminationPointList) {
        const httpLtpUuidList = await LogicalTerminationPoint.getServerLtpListAsync(opLtpUuid);
        const httpClientLtpUuid = httpLtpUuidList[0];
        const path = await OperationClientInterface.getOperationNameAsync(opLtpUuid);
        const key = await OperationClientInterface.getOperationKeyAsync(opLtpUuid)
        const tcpConn = await OperationClientInterface.getTcpClientConnectionInfoAsync(opLtpUuid);

        retObj = {
          operationKey: key,
          operationName: path,
          tcpConn: tcpConn
        }
      }
      resolve(retObj)
    } catch (error) {
      reject()
    }
  })
}

async function RequestForListOfActualDeviceEquipmentCausesReadingFromCache(mountName) {

  try {
    const forwardingName = "RequestForListOfActualDeviceEquipmentCausesReadingFromCache";
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

      applicationName = "ElasticSearch";
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
    console.error(error);
  }
}

/**
 * Records a request
 *
 * body controlconstruct 
 * no response value expected for this operation
 **/
async function recordRequest(body, cc) {
  let pipelineExists = false;
  let client = await common[1].EsClient;
  try {
    // Check if the pipeline exists
    await client.ingest.getPipeline({ id: 'mwdi' });
    pipelineExists = true;
  } catch (error) {
    if (error.statusCode === 404) {
      // Pipeline does not exist
      console.warn(`Pipeline mwdi not found. Indexing without the pipeline.`);
    } else {
      // Other errors
      console.error("An error occurred while checking the pipeline:", error);
      throw error; // Re-throw the error if it's not a 404
    }
  }

  try {
    let indexAlias = common[1].indexAlias
    let startTime = process.hrtime();

    let indexParams = {
      index: indexAlias,
      id: cc,
      body: body
    };

    if (pipelineExists) {
      indexParams.pipeline = 'mwdi';
    }

    let result = await client.index(indexParams);
    let backendTime = process.hrtime(startTime);
    if (result.body.result == 'created' || result.body.result == 'updated') {
      return { "took": backendTime[0] * 1000 + backendTime[1] / 1000000 };
    }
  } catch (error) {
    console.error(error);
  }
}

/**
 * delete a request
 *
 * body controlconstruct 
 * no response value expected for this operation
 **/
async function deleteRequest(cc) {
  try {
    let indexAlias = common[1].indexAlias
    let client = await common[1].EsClient;
    let startTime = process.hrtime();
    let result = await client.delete({
      id: cc,
      index: indexAlias
    });
    let backendTime = process.hrtime(startTime);
    if (result.body.result == 'created' || result.body.result == 'updated') {
      return { "took": backendTime[0] * 1000 + backendTime[1] / 1000000 };
    }
  } catch (error) {
    console.error(error);
  }
}

/**
 * Read from ES
 *
 * response value expected for this operation
 **/
async function ReadRecords(cc) {
  try {
    let size = 100;
    let from = 0;
    let query = {

      term: {
        _id: cc
      }

    };
    let indexAlias = common[1].indexAlias
    let client = await common[1].EsClient;
    const result = await client.search({
      index: indexAlias,
      body: {
        query: query
      }
    });
    const resultArray = createResultArray(result);
    return (resultArray[0])
  } catch (error) {
    console.error(error);
  }
}


// Function to modify UUID to mountName+UUID
function modificaUUID(obj, mountName) {
  try {
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        // if the value is an object, recall the function recursively
        modificaUUID(obj[key], mountName);
      } else if (key === 'uuid' || key === 'local-id') {
        obj[key] = mountName + "+" + obj[key];
      }
    }
  } catch (error) {
    console.error(error);
  }
}

// function to convert the response from String1+String2 to String1
function modifyReturnJson(obj) {
  try {
    for (const key in obj) {
      if (Array.isArray(obj[key])) {
        obj[key].forEach(item => {
          modifyReturnJson(item);
        });
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        modifyReturnJson(obj[key]);
      } else {
        if (key === 'uuid' || key === 'local-id') {
          const parts = obj[key].split('+');
          obj[key] = parts[1];
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

function modifyUrlConcatenateMountNamePlusUuid(url, mountname) {
  try {
    const urlParts = url.split("?fields=");
    const myFields = urlParts[1];
    // Split the url using = as delimitator 
    const parts = urlParts[0].split('=');

    // Modify the values
    for (let i = 1; i < parts.length; i++) {
      if (parts[i].indexOf("+") == -1) {
        parts[i] = mountname + "+" + parts[i];
      }
    }

    // Reconstruct the string
    let modifiedString = parts.join('=');
    if (myFields != undefined) {
      modifiedString = modifiedString + "?fields=" + myFields;
    }
    return modifiedString;
  } catch (error) {
    console.error(error);
  }

}


function Error(code, message) {
  const myJson = {
    "code": code,
    "message": message
  };
  return myJson;
}

function formatUrlForOdl(url, fields) {
  try {
    const segments = url.split("/");
    let newSegments = [];
    // loop over segments
    for (const segment of segments) {
      const parts = segment.split("+");
      if (parts.length > 1) {
        if (parts[0].indexOf("control-construct") != -1) {
          newSegments.push(parts[0]);
        } else {
          newSegments.push(parts[0].split("=")[0] + "=" + parts[1]);
        }
      } else {
        newSegments.push(segment);
      }
    }
    let newUrl = newSegments.join("/");
    if (fields !== undefined) {
      newUrl = newUrl + "?fields=" + fields;
    }
    return newUrl;
  } catch (error) {
    console.error(error);
  }
}

function decodeMountName(url, cc) {
  try {
    let response = [];
    let responseData = null;
    let regex = "";
    let specialChars = "";
    let extractedValue = "";
    if (cc) {
      regex = /control-construct=([^?&]*)(\?fields|$)?/;
      specialChars = /[^a-zA-Z0-9+]/;
    } else {
      regex = /control-construct=([^/]+)\/?/;
      specialChars = /[^a-zA-Z0-9+]/;
    }
    const match = decodeURIComponent(url).match(regex);

    if (match) {
      if (cc) {
        extractedValue = match[1];
        if (!match[2]) {
          const startIndex = url.indexOf("control-construct=") + "control-construct=".length;
          extractedValue = url.substring(startIndex);
        }
      } else {
        extractedValue = match[1];
      }
      if (!specialChars.test(extractedValue)) {
        if (extractedValue.indexOf("+") != -1) {
          let parts = extractedValue.split("+");
          if (parts[1] != "" && parts[1] == parts[0]) {
            return parts[0];
          } else {
            responseData = {
              code: "400",
              message: "Control-construct must not contain special char"
            }
            response.push(responseData);
            return response;
          }
        } else {
          return extractedValue;
        }
      } else {
        responseData = {
          code: "400",
          message: "Control-construct must not contain special char"
        }
        response.push(responseData);
        return response;
      }
    } else {
      responseData = {
        code: "400",
        message: "no match found or wrong char at the end of the string"
      }
      response.push(responseData);
      return response;
    }
  } catch (error) {
    console.error(error);
  }
}

function decodeLinkUuid(url, uuid) {
  try {
    let response = [];
    let responseData = null;
    let regex = "";
    let specialChars = "";
    let extractedValue = "";
    if (uuid) {
      regex = /link=([^?&]*)(\?fields|$)?/;
      specialChars = /[^a-zA-Z0-9+-]/;
    } else {
      regex = /link=([^/]+)\/?/;
      specialChars = /[^a-zA-Z0-9+-]/;
    }
    const match = decodeURIComponent(url).match(regex);

    if (match) {
      if (uuid) {
        extractedValue = match[1];
        if (!match[2]) {
          const startIndex = url.indexOf("link=") + "link=".length;
          extractedValue = url.substring(startIndex);
        }
      } else {
        extractedValue = match[1];
      }
      if (!specialChars.test(extractedValue)) {
        if (extractedValue.indexOf("+") != -1) {
          let parts = extractedValue.split("+");
          if (parts[1] != "" && parts[1] == parts[0]) {
            return parts[0];
          } else {
            responseData = {
              code: "400",
              message: "link must not contain special char"
            }
            response.push(responseData);
            return response;
          }
        } else {
          return extractedValue;
        }
      } else {
        responseData = {
          code: "400",
          message: "link must not contain special char"
        }
        response.push(responseData);
        return response;
      }
    } else {
      responseData = {
        code: "400",
        message: "no match found or wrong char at the end of the string"
      }
      response.push(responseData);
      return response;
    }
  } catch (error) {
    console.error(error);
  }
}

async function extractProfileConfiguration(uuid) {
  try {
    const profileCollection = require('onf-core-model-ap/applicationPattern/onfModel/models/ProfileCollection');
    let profile = await profileCollection.getProfileAsync(uuid);
    let objectKey = Object.keys(profile)[2];
    profile = profile[objectKey];
    let filepath = profile["file-profile-configuration"]["file-path"];
    const fs = require('fs');
    const data = require(filepath);

    return data["api-key"];
  } catch (error) {
    console.error(error);
  }
}

function arraysHaveSameElements(array1, array2) {
  try {
    if (array1.length !== array2.length) {
      return false;
    }

    const frequencyMap = {};
    for (const element of array1) {
      frequencyMap[element] = (frequencyMap[element] || 0) + 1;
    }

    for (const element of array2) {
      if (!(element in frequencyMap)) {
        return false;
      }
      frequencyMap[element]--;

      if (frequencyMap[element] === 0) {
        delete frequencyMap[element];
      }
    }

    return Object.keys(frequencyMap).length === 0;
  } catch (error) {
    console.error(error);
  }
}

function isFilterValid(filter) {
  // Decode filter 
  let decodedFilter;
  try {
    decodedFilter = decodeURIComponent(filter);
  } catch (e) {
    // if there is an error in decoding the filter is not valid
    return false;
  }

  // Define valid chars
  const validChars = ['(', ')', '/', ';', '-', ':'];

  // Add letters from "a" to "z" and fron"A" to "Z" and numbers
  for (let i = 97; i <= 122; i++) {
    validChars.push(String.fromCharCode(i)); // add "a"-"z"
  }
  for (let i = 65; i <= 90; i++) {
    validChars.push(String.fromCharCode(i)); // add "A"-"Z"
  }
  for (let i = 48; i <= 57; i++) {
    validChars.push(String.fromCharCode(i)); // add "0"-"9"
  }

  // Verify if the decoded string contains only valid chars
  for (let i = 0; i < decodedFilter.length; i++) {
    const char = decodedFilter.charAt(i);
    // Se the char is not in the valid chars returns false
    if (!validChars.includes(char)) {
      return false;
    }
  }

  // If all chars are valid returns true
  return true;
}

function replaceFilterString(filter) {

  try {
    const replacements = [
      ["equipment\\(", "equipment(uuid;"],
      ["connector\\(", "connector(local-id;"],
      ["contained-holder\\(", "contained-holder(local-id;"],
      ["expected-equipment\\(", "expected-equipment(local-id;"],
      ["firmware-component-list\\(", "firmware-component-list(local-id;"],
      ["profile\\(", "profile(uuid;"],
      ["logical-termination-point\\(", "logical-termination-point(uuid;"],
      ["forwarding-domain\\(", "forwarding-domain(uuid;"],
      ["fc\\(", "fc(uuid1;"],
      ["fc-port\\(", "fc-port(local-id;"],
      ["layer-protocol\\(", "layer-protocol(local-id;"]
    ];

    let replacedFilter = filter;
    for (const [search, replace] of replacements) {
      if (replacedFilter.includes(replace)) {
        continue;
      }
      replacedFilter = replacedFilter.replace(new RegExp(search, "g"), replace);
    }

    return replacedFilter;
  } catch (error) {
    console.error(error);
  }
}

function isJsonEmpty(arr) {
  if (arr != undefined) {
    if (Array.isArray(arr)) {
      if (arr.length === 0) {
        return true;
      }
      for (let obj of arr) {
        // Se trovi un oggetto con almeno una chiave, l'array non è vuoto
        if (Object.keys(obj).length > 0) {
          return false;
        }
      }
      return true;
    } else if (Object.keys(arr).length === 0) {
      return true;
    } else {
      return false;
    }
  } else {
    return true;
  }
}

exports.getLiveControlConstructFromSW = function (url, user, originator, xCorrelator, traceIndicator, customerJourney, mountname, fields) {
  return new Promise(async function (resolve, reject) {
    try {
      url = decodeURIComponent(url);
      //const appNameAndUuidFromForwarding = await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(url)
      const urlParts = url.split("?fields=");
      const myFields = urlParts[1];

      let correctCc = null;
      //    let mountname = decodeURIComponent(url).match(/control-construct=([^/]+)/)[1];
      let mountname = decodeMountName(url, true);
      if (typeof mountname === 'object') {
        throw new createHttpError(mountname[0].code, mountname[0].message);
        return;
      } else {
        correctCc = mountname;
      }
      let Url = await retrieveCorrectUrl(url, common[0].tcpConn, common[0].applicationName);
      const finalUrl1 = formatUrlForOdl(decodeURIComponent(Url));
      const finalUrl = formatUrlForOdl(Url);
      const Authorization = common[0].key;
      if (common[0].applicationName.indexOf("OpenDayLight") != -1) {
        const result = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization)
        if (result == false) {
          resolve(NotFound());
          throw new createHttpError.NotFound;
        } else if (result.status != 200) {
          if (result.statusText == undefined) {
            resolve(result.status, result.message);
            throw new createHttpError(result.status, result.message);
          } else {
            resolve(result.status, result.statusText);
            throw new createHttpError(result.status, result.statusText);
          }
        } else if (await checkMountNameInDeviceList(correctCc)) {
          let jsonObj = result.data;
          modificaUUID(jsonObj, correctCc);
          if (myFields === undefined) {
            try {
              let elapsedTime = await recordRequest(jsonObj, correctCc);
            }
            catch (error) {
              console.error(error);
            }
            modifyReturnJson(jsonObj);
            let res = await cacheResponse.cacheResponseBuilder(url, jsonObj);
            resolve(res);
          } else {
            let filters = true;
            // Update record on ES
            let Url = decodeURIComponent(await retrieveCorrectUrl(url, common[1].tcpConn, common[1].applicationName));
            let correctUrl = modifyUrlConcatenateMountNamePlusUuid(Url, correctCc);
            try {
              // read from ES
              let result1 = await ReadRecords(correctCc);
              // Update json object
              let finalJson = cacheUpdate.cacheUpdateBuilder(correctUrl, result1, jsonObj, filters);
              // Write updated Json to ES
              let elapsedTime = await recordRequest(result1, correctCc);
            }
            catch (error) {
              console.error(error);
            }
            modifyReturnJson(jsonObj)
            let splittedUrl = url.split('?');
            let res = await cacheResponse.cacheResponseBuilder(splittedUrl[0], jsonObj);
            resolve(res);
          }

        } else {
          console.log(new createHttpError.BadRequest);
          resolve(new createHttpError.BadRequest);
        }
      }
    }
    catch (error) {
      console.error(error);
      reject(error);
    }

  });
}

async function checkMountNameInDeviceList(mountName) {
  let list = await getDeviceListInMemory();
  return list.some(device => device['node-id'] === mountName);
}

function hasAttribute(json, attributeName) {
  if (typeof json === 'object' && json !== null) {
    // Check if the attribute is at this level
    if (Object.hasOwnProperty.bind(json)(attributeName)) {
      return true;
    }
    // Otherwise loop in the object properties
    for (let key in json) {
      if (Object.hasOwnProperty.bind(json)(key)) {
        if (hasAttribute(json[key], attributeName)) {
          return true;
        }
      }
    }
  }
  // if json is an array, loop over the elements
  if (Array.isArray(json)) {
    for (let item of json) {
      if (hasAttribute(item, attributeName)) {
        return true;
      }
    }
  }
  return false;
}

function decodeURIWithCheck(encodedUri) {
  // Verify if URI contains "%25"
  if (encodedUri.includes("%25")) {
      // if contains "%25", it means that it's double codified
      return decodeURIComponent(decodeURIComponent(encodedUri));
  } else {
      // Otherwise is codified only once
      return decodeURIComponent(encodedUri);
  }
}