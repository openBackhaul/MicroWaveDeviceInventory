'use strict';

var responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
var restResponseHeader = require('onf-core-model-ap/applicationPattern/rest/server/ResponseHeader');
var restResponseBuilder = require('onf-core-model-ap/applicationPattern/rest/server/ResponseBuilder');
var IndividualServices = require('../service/IndividualServicesService');
var executionAndTraceService = require('onf-core-model-ap/applicationPattern/services/ExecutionAndTraceService');

module.exports.bequeathYourDataAndDie = function bequeathYourDataAndDie (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  IndividualServices.bequeathYourDataAndDie(req.url,body, user, originator, xCorrelator, traceIndicator, customerJourney)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedActualEquipment = function getCachedActualEquipment (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedActualEquipment(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedAirInterfaceCapability = function getCachedAirInterfaceCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedAirInterfaceCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedAirInterfaceConfiguration = function getCachedAirInterfaceConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedAirInterfaceConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedAirInterfaceHistoricalPerformances = function getCachedAirInterfaceHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedAirInterfaceHistoricalPerformances(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedAirInterfaceStatus = function getCachedAirInterfaceStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedAirInterfaceStatus(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedAlarmCapability = function getCachedAlarmCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedAlarmCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedAlarmConfiguration = function getCachedAlarmConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedAlarmConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedAlarmEventRecords = function getCachedAlarmEventRecords (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedAlarmEventRecords(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedCoChannelProfileCapability = function getCachedCoChannelProfileCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedCoChannelProfileCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedCoChannelProfileConfiguration = function getCachedCoChannelProfileConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedCoChannelProfileConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedConnector = function getCachedConnector (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedConnector(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedContainedHolder = function getCachedContainedHolder (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedContainedHolder(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedControlConstruct = function getCachedControlConstruct (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedControlConstruct(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedCurrentAlarms = function getCachedCurrentAlarms (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedCurrentAlarms(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedEquipment = function getCachedEquipment (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedEquipment(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedEthernetContainerCapability = function getCachedEthernetContainerCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedEthernetContainerCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedEthernetContainerConfiguration = function getCachedEthernetContainerConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedEthernetContainerConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedEthernetContainerHistoricalPerformances = function getCachedEthernetContainerHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedEthernetContainerHistoricalPerformances(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedEthernetContainerStatus = function getCachedEthernetContainerStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedEthernetContainerStatus(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedExpectedEquipment = function getCachedExpectedEquipment (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedExpectedEquipment(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedFirmwareCollection = function getCachedFirmwareCollection (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedFirmwareCollection(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedFirmwareComponentCapability = function getCachedFirmwareComponentCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedFirmwareComponentCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedFirmwareComponentList = function getCachedFirmwareComponentList (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedFirmwareComponentList(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedFirmwareComponentStatus = function getCachedFirmwareComponentStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedFirmwareComponentStatus(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedHybridMwStructureCapability = function getCachedHybridMwStructureCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedHybridMwStructureCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedHybridMwStructureConfiguration = function getCachedHybridMwStructureConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedHybridMwStructureConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedHybridMwStructureHistoricalPerformances = function getCachedHybridMwStructureHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedHybridMwStructureHistoricalPerformances(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedHybridMwStructureStatus = function getCachedHybridMwStructureStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedHybridMwStructureStatus(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedLogicalTerminationPoint = function getCachedLogicalTerminationPoint (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedLogicalTerminationPoint(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveLtpAugment = function getLiveLtpAugment (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveLtpAugment(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedMacInterfaceCapability = function getCachedMacInterfaceCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedMacInterfaceCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedMacInterfaceConfiguration = function getCachedMacInterfaceConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedMacInterfaceConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedMacInterfaceHistoricalPerformances = function getCachedMacInterfaceHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedMacInterfaceHistoricalPerformances(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedMacInterfaceStatus = function getCachedMacInterfaceStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedMacInterfaceStatus(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedPolicingProfileCapability = function getCachedPolicingProfileCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedPolicingProfileCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedPolicingProfileConfiguration = function getCachedPolicingProfileConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedPolicingProfileConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedProfile = function getCachedProfile (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedProfile(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedProfileCollection = function getCachedProfileCollection (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedProfileCollection(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedPureEthernetStructureCapability = function getCachedPureEthernetStructureCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedPureEthernetStructureCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedPureEthernetStructureConfiguration = function getCachedPureEthernetStructureConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedPureEthernetStructureConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedPureEthernetStructureHistoricalPerformances = function getCachedPureEthernetStructureHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedPureEthernetStructureHistoricalPerformances(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedPureEthernetStructureStatus = function getCachedPureEthernetStructureStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedPureEthernetStructureStatus(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedQosProfileCapability = function getCachedQosProfileCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedQosProfileCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedQosProfileConfiguration = function getCachedQosProfileConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedQosProfileConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedSchedulerProfileCapability = function getCachedSchedulerProfileCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedSchedulerProfileCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedSchedulerProfileConfiguration = function getCachedSchedulerProfileConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedSchedulerProfileConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedVlanInterfaceCapability = function getCachedVlanInterfaceCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedVlanInterfaceCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedVlanInterfaceConfiguration = function getCachedVlanInterfaceConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedVlanInterfaceConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedVlanInterfaceHistoricalPerformances = function getCachedVlanInterfaceHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedVlanInterfaceHistoricalPerformances(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedVlanInterfaceStatus = function getCachedVlanInterfaceStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedVlanInterfaceStatus(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedWireInterfaceCapability = function getCachedWireInterfaceCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedWireInterfaceCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedWireInterfaceConfiguration = function getCachedWireInterfaceConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedWireInterfaceConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedWireInterfaceHistoricalPerformances = function getCachedWireInterfaceHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedWireInterfaceHistoricalPerformances(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedWireInterfaceStatus = function getCachedWireInterfaceStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedWireInterfaceStatus(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedWredProfileCapability = function getCachedWredProfileCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedWredProfileCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedWredProfileConfiguration = function getCachedWredProfileConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedWredProfileConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveLogicalTerminationPoint = function getLiveLogicalTerminationPoint (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveLogicalTerminationPoint(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getCachedLtpAugment = function getCachedLtpAugment (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getCachedLtpAugment(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveActualEquipment = function getLiveActualEquipment (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveActualEquipment(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveAirInterfaceCapability = function getLiveAirInterfaceCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveAirInterfaceCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveAirInterfaceConfiguration = function getLiveAirInterfaceConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveAirInterfaceConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveAirInterfaceCurrentPerformance = function getLiveAirInterfaceCurrentPerformance (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveAirInterfaceCurrentPerformance(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveAirInterfaceHistoricalPerformances = function getLiveAirInterfaceHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveAirInterfaceHistoricalPerformances(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveAirInterfaceStatus = function getLiveAirInterfaceStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveAirInterfaceStatus(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveAlarmCapability = function getLiveAlarmCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveAlarmCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveAlarmConfiguration = function getLiveAlarmConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveAlarmConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveAlarmEventRecords = function getLiveAlarmEventRecords (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveAlarmEventRecords(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveCoChannelProfileCapability = function getLiveCoChannelProfileCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveCoChannelProfileCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveCoChannelProfileConfiguration = function getLiveCoChannelProfileConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveCoChannelProfileConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveConnector = function getLiveConnector (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveConnector(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveContainedHolder = function getLiveContainedHolder (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveContainedHolder(req.url,req.url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveControlConstruct = function getLiveControlConstruct (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountname, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveControlConstruct(req.url,req.url, user, originator, xCorrelator, traceIndicator, customerJourney, mountname, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveCurrentAlarms = function getLiveCurrentAlarms (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveCurrentAlarms(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveEquipment = function getLiveEquipment (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveEquipment(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveEthernetContainerCapability = function getLiveEthernetContainerCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveEthernetContainerCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveEthernetContainerConfiguration = function getLiveEthernetContainerConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveEthernetContainerConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveEthernetContainerCurrentPerformance = function getLiveEthernetContainerCurrentPerformance (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveEthernetContainerCurrentPerformance(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveEthernetContainerHistoricalPerformances = function getLiveEthernetContainerHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveEthernetContainerHistoricalPerformances(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveEthernetContainerStatus = function getLiveEthernetContainerStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveEthernetContainerStatus(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveExpectedEquipment = function getLiveExpectedEquipment (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveExpectedEquipment(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveFirmwareCollection = function getLiveFirmwareCollection (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveFirmwareCollection(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveFirmwareComponentCapability = function getLiveFirmwareComponentCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveFirmwareComponentCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveFirmwareComponentList = function getLiveFirmwareComponentList (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveFirmwareComponentList(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveFirmwareComponentStatus = function getLiveFirmwareComponentStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveFirmwareComponentStatus(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveHybridMwStructureCapability = function getLiveHybridMwStructureCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveHybridMwStructureCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveHybridMwStructureConfiguration = function getLiveHybridMwStructureConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveHybridMwStructureConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveHybridMwStructureCurrentPerformance = function getLiveHybridMwStructureCurrentPerformance (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveHybridMwStructureCurrentPerformance(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveHybridMwStructureHistoricalPerformances = function getLiveHybridMwStructureHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveHybridMwStructureHistoricalPerformances(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveHybridMwStructureStatus = function getLiveHybridMwStructureStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveHybridMwStructureStatus(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveMacInterfaceCapability = function getLiveMacInterfaceCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveMacInterfaceCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveMacInterfaceConfiguration = function getLiveMacInterfaceConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveMacInterfaceConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveMacInterfaceCurrentPerformance = function getLiveMacInterfaceCurrentPerformance (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveMacInterfaceCurrentPerformance(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveMacInterfaceHistoricalPerformances = function getLiveMacInterfaceHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveMacInterfaceHistoricalPerformances(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveMacInterfaceStatus = function getLiveMacInterfaceStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveMacInterfaceStatus(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLivePolicingProfileCapability = function getLivePolicingProfileCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLivePolicingProfileCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLivePolicingProfileConfiguration = function getLivePolicingProfileConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLivePolicingProfileConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveProfile = function getLiveProfile (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveProfile(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveProfileCollection = function getLiveProfileCollection (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveProfileCollection(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLivePureEthernetStructureCapability = function getLivePureEthernetStructureCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLivePureEthernetStructureCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLivePureEthernetStructureConfiguration = function getLivePureEthernetStructureConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLivePureEthernetStructureConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLivePureEthernetStructureCurrentPerformance = function getLivePureEthernetStructureCurrentPerformance (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLivePureEthernetStructureCurrentPerformance(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLivePureEthernetStructureHistoricalPerformances = function getLivePureEthernetStructureHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLivePureEthernetStructureHistoricalPerformances(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLivePureEthernetStructureStatus = function getLivePureEthernetStructureStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLivePureEthernetStructureStatus(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveQosProfileCapability = function getLiveQosProfileCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveQosProfileCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveQosProfileConfiguration = function getLiveQosProfileConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveQosProfileConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveSchedulerProfileCapability = function getLiveSchedulerProfileCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveSchedulerProfileCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveSchedulerProfileConfiguration = function getLiveSchedulerProfileConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveSchedulerProfileConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveVlanInterfaceCapability = function getLiveVlanInterfaceCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveVlanInterfaceCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveVlanInterfaceConfiguration = function getLiveVlanInterfaceConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveVlanInterfaceConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveVlanInterfaceCurrentPerformance = function getLiveVlanInterfaceCurrentPerformance (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveVlanInterfaceCurrentPerformance(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveVlanInterfaceHistoricalPerformances = function getLiveVlanInterfaceHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveVlanInterfaceHistoricalPerformances(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveVlanInterfaceStatus = function getLiveVlanInterfaceStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveVlanInterfaceStatus(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveWireInterfaceCapability = function getLiveWireInterfaceCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveWireInterfaceCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveWireInterfaceConfiguration = function getLiveWireInterfaceConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveWireInterfaceConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveWireInterfaceCurrentPerformance = function getLiveWireInterfaceCurrentPerformance (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveWireInterfaceCurrentPerformance(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveWireInterfaceHistoricalPerformances = function getLiveWireInterfaceHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveWireInterfaceHistoricalPerformances(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveWireInterfaceStatus = function getLiveWireInterfaceStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveWireInterfaceStatus(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveWredProfileCapability = function getLiveWredProfileCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveWredProfileCapability(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.getLiveWredProfileConfiguration = function getLiveWredProfileConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.getLiveWredProfileConfiguration(req.url,user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.notifyAttributeValueChanges = function notifyAttributeValueChanges (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.notifyAttributeValueChanges(req.url,body, user, originator, xCorrelator, traceIndicator, customerJourney)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.notifyObjectCreations = function notifyObjectCreations (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.notifyObjectCreations(req.url,body, user, originator, xCorrelator, traceIndicator, customerJourney)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.notifyObjectDeletions = function notifyObjectDeletions (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.notifyObjectDeletions(req.url,body, user, originator, xCorrelator, traceIndicator, customerJourney)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.provideListOfActualDeviceEquipment = function provideListOfActualDeviceEquipment (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.provideListOfActualDeviceEquipment(req.url,body, user, originator, xCorrelator, traceIndicator, customerJourney)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.provideListOfConnectedDevices = function provideListOfConnectedDevices (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.provideListOfConnectedDevices(req.url,user, originator, xCorrelator, traceIndicator, customerJourney)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.provideListOfDeviceInterfaces = function provideListOfDeviceInterfaces (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.provideListOfDeviceInterfaces(req.url,body, user, originator, xCorrelator, traceIndicator, customerJourney)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.regardControllerAttributeValueChange = function regardControllerAttributeValueChange (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.regardControllerAttributeValueChange(req.url,body, user, originator, xCorrelator, traceIndicator, customerJourney)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.regardDeviceAlarm = function regardDeviceAlarm (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.regardDeviceAlarm(req.url,body, user, originator, xCorrelator, traceIndicator, customerJourney)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.regardDeviceAttributeValueChange = function regardDeviceAttributeValueChange (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  IndividualServices.regardDeviceAttributeValueChange(req.url,body, user, originator, xCorrelator, traceIndicator, customerJourney)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.regardDeviceObjectCreation = function regardDeviceObjectCreation (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.regardDeviceObjectCreation(req.url,body, user, originator, xCorrelator, traceIndicator, customerJourney)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.regardDeviceObjectDeletion = function regardDeviceObjectDeletion (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  IndividualServices.regardDeviceObjectDeletion(req.url,body, user, originator, xCorrelator, traceIndicator, customerJourney)
  .then(async function (responseBody) {
    responseBodyToDocument = responseBody;
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
  })
  .catch(async function (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};
