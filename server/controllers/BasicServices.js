'use strict';

var BasicServices = require('onf-core-model-ap-bs/basicServices/BasicServicesService');
var responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
var restResponseHeader = require('onf-core-model-ap/applicationPattern/rest/server/ResponseHeader');
var restResponseBuilder = require('onf-core-model-ap/applicationPattern/rest/server/ResponseBuilder');
var executionAndTraceService = require('onf-core-model-ap/applicationPattern/services/ExecutionAndTraceService');
var startModule = require('../temporarySupportFiles/StartModule.js');
var individualServices = require('../service/IndividualServicesService.js');
const ForwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const ForwardingConstruct = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingConstruct');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const LogicalTerminationPoint = require('onf-core-model-ap/applicationPattern/onfModel/models/LogicalTerminationPoint');
const metadataProcessStart = require('../service/individualServices/CyclicProcessService/metadattablecyclicprocess.js')
const tcpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpClientInterface');
const forwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');


const NEW_RELEASE_FORWARDING_NAME = undefined;
const OLD_RELEASE_FORWARDING_NAME = 'PromptForEmbeddingCausesRequestForBequeathingData';


module.exports.embedYourself = async function embedYourself(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  
  

  
  let newReleaseUuids = await resolveHttpTcpAndOperationClientUuidOfNewRelease()
  /****************************************************************************************
   * Prepare logicalTerminatinPointConfigurationInput object to 
   * configure logical-termination-point
   ****************************************************************************************/
  let tcpclientUuid = newReleaseUuids.tcpClientUuid;

  let newPort = await tcpClientInterface.getRemotePortAsync(tcpclientUuid);
  let retNewIpAddress = await tcpClientInterface.getRemoteAddressAsync(tcpclientUuid);
  let newIpAddress = retNewIpAddress['ip-address']['ipv-4-address'];
  
  let oldIpAddress = body['old-release-address']['ip-address']['ipv-4-address'];
  let oldPort = body['old-release-port'];

  let registryOfficeIpAddress = body['registry-office-address']['ip-address']['ipv-4-address'];
  let registryOfficePort = body['registry-office-port'];
  
  console.log("---------------------------------------------------------------------------------------------------------------------");
  console.log("EMBED-YOURSELF:   [IP   nr: " + newIpAddress + "   or: " + oldIpAddress + "   ro: " + registryOfficeIpAddress + 
              "] - [Port   nr: " + newPort + "   or: " + oldPort + "   ro: " + registryOfficePort + "]");
  console.log("---------------------------------------------------------------------------------------------------------------------");
  /*
  if (newPort != oldPort || newIpAddress != oldIpAddress) {
      
      let bequeathData = await individualServicesService.GetBequeathYourDataAndDieData();
      let operationKey = bequeathData.operationKey;
      let requestorUrl = "http://" + oldIpAddress + ":" + oldPort + bequeathData.operationName;
      let newApplicationName = await HttpServerInterface.getApplicationNameAsync();
      let newReleaseNumber = await HttpServerInterface.getReleaseNumberAsync();
      let requestorBody = {
          "new-application-name": newApplicationName,
          "new-application-release": newReleaseNumber,
          "new-application-protocol": "HTTP",
          "new-application-address": {
              "ip-address": {
                  "ipv-4-address": newIpAddress
              }
          },
          "new-application-port": newPort
      };
  
      let httpRequestHeader = new RequestHeader(
          user,
          originator,
          xCorrelator,
          traceIndicator,
          customerJourney,
          operationKey
      );
  
      let httpRequestHeaderRequestor = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(httpRequestHeader);
  
      console.log("NEW RELEASE --> calling OLD RELEASE <Bequeath Your Data And Die> ....");
      try {
          let response = await axios.post(requestorUrl, requestorBody, {
              headers: httpRequestHeaderRequestor
          });          
      } catch (error) {
          console.log("NEW RELEASE --> calling OLD RELEASE <Bequeath Your Data And Die> .... ERROR  (" + error + ")");          
      }
  } 
  */  
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  
  await BasicServices.embedYourself(body, user, xCorrelator, traceIndicator, customerJourney, req.url)
    .then(async function (responseBody) {
      startModule.start();
     // metadataProcessStart.MetadataTableprocess()
     // start metadattable process
      individualServices.PromptForEmbeddingCausesSubscribingForNotifications (user, originator, xCorrelator, traceIndicator, customerJourney);
      responseBodyToDocument = responseBody;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url,-1);
      let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
    let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  if (!execTime) execTime = 0;
  else execTime = Math.round(execTime);
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.endSubscription = async function endSubscription(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  await BasicServices.endSubscription(body, user, xCorrelator, traceIndicator, customerJourney, req.url)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url,-1);
      let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
    let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  if (!execTime) execTime = 0;
  else execTime = Math.round(execTime);
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.informAboutApplication = async function informAboutApplication(req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  await BasicServices.informAboutApplication()
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url,-1);
      let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
    let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  if (!execTime) execTime = 0;
  else execTime = Math.round(execTime);
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.informAboutApplicationInGenericRepresentation = async function informAboutApplicationInGenericRepresentation(req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  await BasicServices.informAboutApplicationInGenericRepresentation(req.url)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url,-1);
      let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
    let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  if (!execTime) execTime = 0;
  else execTime = Math.round(execTime);
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.informAboutReleaseHistory = async function informAboutReleaseHistory(req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  await BasicServices.informAboutReleaseHistory()
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url,-1);
      let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
    let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  if (!execTime) execTime = 0;
  else execTime = Math.round(execTime);
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.informAboutReleaseHistoryInGenericRepresentation = async function informAboutReleaseHistoryInGenericRepresentation(req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  await BasicServices.informAboutReleaseHistoryInGenericRepresentation(req.url)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url,-1);
      let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
    let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  if (!execTime) execTime = 0;
  else execTime = Math.round(execTime);
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.inquireOamRequestApprovals = async function inquireOamRequestApprovals(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  await BasicServices.inquireOamRequestApprovals(body, user, xCorrelator, traceIndicator, customerJourney, req.url,NEW_RELEASE_FORWARDING_NAME)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url,-1);
      let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
    let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  if (!execTime) execTime = 0;
  else execTime = Math.round(execTime);
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.listLtpsAndFcs = async function listLtpsAndFcs(req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  await BasicServices.listLtpsAndFcs()
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url,-1);
      let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
    let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  if (!execTime) execTime = 0;
  else execTime = Math.round(execTime);
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.redirectOamRequestInformation = async function redirectOamRequestInformation(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  await BasicServices.redirectOamRequestInformation(body, user, xCorrelator, traceIndicator, customerJourney, req.url,NEW_RELEASE_FORWARDING_NAME)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url,-1);
      let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
    let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  if (!execTime) execTime = 0;
  else execTime = Math.round(execTime);
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.redirectServiceRequestInformation = async function redirectServiceRequestInformation(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  await BasicServices.redirectServiceRequestInformation(body, user, xCorrelator, traceIndicator, customerJourney, req.url,NEW_RELEASE_FORWARDING_NAME)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url,-1);
      let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
    let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  if (!execTime) execTime = 0;
  else execTime = Math.round(execTime);
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.redirectTopologyChangeInformation = async function redirectTopologyChangeInformation(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  await BasicServices.redirectTopologyChangeInformation(body, user, xCorrelator, traceIndicator, customerJourney, req.url,NEW_RELEASE_FORWARDING_NAME)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url,-1);
      let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
    let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  if (!execTime) execTime = 0;
  else execTime = Math.round(execTime);
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.registerYourself = async function registerYourself(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  
  if (Object.keys(req.body).length === 0) {
    body = req.body;
    user = req.headers["user"];
    originator = req.headers["originator"];
    xCorrelator = req.headers["x-correlator"];
    traceIndicator = req.headers["trace-indicator"];
    customerJourney = req.headers["customer-journey"]; 
  }
  await BasicServices.registerYourself(body, user, xCorrelator, traceIndicator, customerJourney, req.url)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url,-1);
      let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
    let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  if (!execTime) execTime = 0;
  else execTime = Math.round(execTime);
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.startApplicationInGenericRepresentation = async function startApplicationInGenericRepresentation(req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  await BasicServices.startApplicationInGenericRepresentation(req.url)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url,-1);
      let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
    let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  if (!execTime) execTime = 0;
  else execTime = Math.round(execTime);
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
}

module.exports.updateClient = async function updateClient(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  await BasicServices.updateClient(body, user, xCorrelator, traceIndicator, customerJourney, req.url, NEW_RELEASE_FORWARDING_NAME)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url,-1);
      let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
    let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  if (!execTime) execTime = 0;
  else execTime = Math.round(execTime);
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.updateOperationClient = async function updateOperationClient(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  await BasicServices.updateOperationClient(body, user, xCorrelator, traceIndicator, customerJourney, req.url, NEW_RELEASE_FORWARDING_NAME)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url,-1);
      let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
    let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  if (!execTime) execTime = 0;
  else execTime = Math.round(execTime);
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.updateOperationKey = async function updateOperationKey(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  await BasicServices.updateOperationKey(body)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url,-1);
      let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
    let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  if (!execTime) execTime = 0;
  else execTime = Math.round(execTime);
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.disposeRemaindersOfDeregisteredApplication = async function disposeRemaindersOfDeregisteredApplication(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument;
  await BasicServices.disposeRemaindersOfDeregisteredApplication(body, user, originator, xCorrelator, traceIndicator, customerJourney, req.url, NEW_RELEASE_FORWARDING_NAME)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
      let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
  let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  if (!execTime) execTime = 0;
  else execTime = Math.round(execTime);
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument, execTime);
};
module.exports.informAboutPrecedingRelease = async function informAboutPrecedingRelease(req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  await BasicServices.informAboutPrecedingRelease(OLD_RELEASE_FORWARDING_NAME)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
      let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
  let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  if (!execTime) execTime = 0;
  else execTime = Math.round(execTime);
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument, execTime);
};

module.exports.inquireBasicAuthRequestApprovals = async function inquireBasicAuthRequestApprovals (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  await BasicServices.inquireBasicAuthRequestApprovals(body, user, xCorrelator, traceIndicator, customerJourney, req.url, NEW_RELEASE_FORWARDING_NAME)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
      let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
  let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  if (!execTime) execTime = 0;
  else execTime = Math.round(execTime);
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument, execTime);
};

module.exports.UpdateClientOfSubsequentRelease = async function UpdateClientOfSubsequentRelease (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  try {
    let NEW_RELEASE_FORWARDING = "PromptForBequeathingDataCausesTransferringExistingSubscriptionsForDeviceAttributeValueChanges";
    responseBodyToDocument = await BasicServices.updateClientOfSubsequentRelease(body, user, xCorrelator, traceIndicator, customerJourney, req.url, NEW_RELEASE_FORWARDING);
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  if (!execTime) execTime = 0;
  else execTime = Math.round(execTime);
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument, execTime);
};

async function resolveHttpTcpAndOperationClientUuidOfNewRelease () {
  return new Promise(async function (resolve, reject) {
      let forwardingName = 'PromptForBequeathingDataCausesTransferringExistingSubscriptionsForDeviceAttributeValueChanges'
      try {
          let uuidOfHttpandTcpClient = {};
          let forwardConstructName = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName)
          if (forwardConstructName === undefined) {
              return {};
          }
          let forwardConstructUuid = forwardConstructName[onfAttributes.GLOBAL_CLASS.UUID]
          let fcPortOutput = (await ForwardingConstruct.getOutputFcPortsAsync(forwardConstructUuid))[0]
          let operationClientUuid = fcPortOutput[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT];
          let httpClientUuid = (await LogicalTerminationPoint.getServerLtpListAsync(operationClientUuid))[0];
          let tcpClientUuid = (await LogicalTerminationPoint.getServerLtpListAsync(httpClientUuid))[0];
          uuidOfHttpandTcpClient = {
              httpClientUuid,
              tcpClientUuid
          }
          resolve(uuidOfHttpandTcpClient)
      } catch (error) {
          reject(error)
      }
  })
}