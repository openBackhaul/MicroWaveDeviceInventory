'use strict';

var StringProfile = require('../service/StringProfileService');
var responseBuilder = require('onf-core-model-ap/applicationPattern/rest/server/ResponseBuilder');
var responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
var oamLogService = require('onf-core-model-ap/applicationPattern/services/OamLogService');

module.exports.getStringProfileEnumeration = async function getStringProfileEnumeration(req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await StringProfile.getStringProfileEnumeration(req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getStringProfilePattern = async function getStringProfilePattern(req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await StringProfile.getStringProfilePattern(req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getStringProfileStringName = async function getStringProfileStringName(req, res, next) {
  let responseCode = responseCodeEnum.code.OK;
  await StringProfile.getStringProfileStringName(req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getStringProfileStringValue = async function getStringProfileStringValue(req, res, next) {
  let responseCode = responseCodeEnum.code.OK;
  await StringProfile.getStringProfileStringValue(req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putStringProfileStringValue = async function putStringProfileStringValue(req, res, next, body) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  await StringProfile.putStringProfileStringValue(body, req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};