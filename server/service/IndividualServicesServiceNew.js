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

      let correctMountname = null;

      let mountname = decodeMountName(url, true);
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
        } catch(error) {
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
      // console.error(error);
      logger.error(error);
      reject(error);
    }
  });
}
