'use strict';

var IntegerProfile = require('../service/IntegerProfileService');
var responseBuilder = require('onf-core-model-ap/applicationPattern/rest/server/ResponseBuilder');
var responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
var oamLogService = require('onf-core-model-ap/applicationPattern/services/OamLogService');

module.exports.getIntegerProfileIntegerName = function getIntegerProfileIntegerName (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  IntegerProfile.getIntegerProfileIntegerName(uuid)
  .then(function (response) {
    responseBuilder.buildResponse(res, responseCode, response);
  })
  .catch(function (response) {
    let sentResp = responseBuilder.buildResponse(res, undefined, response);
    responseCode = sentResp.code;
  });
oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getIntegerProfileIntegerValue = function getIntegerProfileIntegerValue (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  IntegerProfile.getIntegerProfileIntegerValue(uuid)
  .then(function (response) {
    responseBuilder.buildResponse(res, responseCode, response);
  })
  .catch(function (response) {
    let sentResp = responseBuilder.buildResponse(res, undefined, response);
    responseCode = sentResp.code;
  });
oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getIntegerProfileMaximum = function getIntegerProfileMaximum (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  IntegerProfile.getIntegerProfileMaximum(uuid)
  .then(function (response) {
    responseBuilder.buildResponse(res, responseCode, response);
  })
  .catch(function (response) {
    let sentResp = responseBuilder.buildResponse(res, undefined, response);
    responseCode = sentResp.code;
  });
oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getIntegerProfileMinimum = function getIntegerProfileMinimum (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  IntegerProfile.getIntegerProfileMinimum(uuid)
  .then(function (response) {
    responseBuilder.buildResponse(res, responseCode, response);
  })
  .catch(function (response) {
    let sentResp = responseBuilder.buildResponse(res, undefined, response);
    responseCode = sentResp.code;
  });
oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getIntegerProfileUnit = function getIntegerProfileUnit (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  IntegerProfile.getIntegerProfileUnit(uuid)
  .then(function (response) {
    responseBuilder.buildResponse(res, responseCode, response);
  })
  .catch(function (response) {
    let sentResp = responseBuilder.buildResponse(res, undefined, response);
    responseCode = sentResp.code;
  });
oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putIntegerProfileIntegerValue = function putIntegerProfileIntegerValue (req, res, next, body, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  IntegerProfile.putIntegerProfileIntegerValue(body, uuid)
  .then(function (response) {
    responseBuilder.buildResponse(res, responseCode, response);
  })
  .catch(function (response) {
    let sentResp = responseBuilder.buildResponse(res, undefined, response);
    responseCode = sentResp.code;
  });
oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};
