'use strict';

var ActionProfile = require('../service/ActionProfileService');
var responseBuilder = require('onf-core-model-ap/applicationPattern/rest/server/ResponseBuilder');
var responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
var oamLogService = require('onf-core-model-ap/applicationPattern/services/OamLogService');

module.exports.getActionProfileConsequentOperationReference = async function getActionProfileConsequentOperationReference (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await ActionProfile.getActionProfileConsequentOperationReference(req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getActionProfileDisplayInNewBrowserWindow = async function getActionProfileDisplayInNewBrowserWindow (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await ActionProfile.getActionProfileDisplayInNewBrowserWindow(req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getActionProfileInputValueListt = async function getActionProfileInputValueListt (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await ActionProfile.getActionProfileInputValueListt(req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getActionProfileLabel = async function getActionProfileLabel (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await ActionProfile.getActionProfileLabel(req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getActionProfileOperationName = async function getActionProfileOperationName (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await ActionProfile.getActionProfileOperationName(req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putActionProfileConsequentOperationReference = async function putActionProfileConsequentOperationReference (req, res, next, body, uuid) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  await ActionProfile.putActionProfileConsequentOperationReference(req.url, body)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};
