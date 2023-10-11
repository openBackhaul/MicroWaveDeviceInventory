'use strict';

var OperationServer = require('../service/OperationServerService');
var responseBuilder = require('onf-core-model-ap/applicationPattern/rest/server/ResponseBuilder');
var responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
var oamLogService = require('onf-core-model-ap/applicationPattern/services/OamLogService');

module.exports.getOperationServerLifeCycleState = async function getOperationServerLifeCycleState(req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await OperationServer.getOperationServerLifeCycleState(req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getOperationServerOperationKey = async function getOperationServerOperationKey(req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await OperationServer.getOperationServerOperationKey(req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getOperationServerOperationName = async function getOperationServerOperationName(req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await OperationServer.getOperationServerOperationName(req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putOperationServerLifeCycleState = async function putOperationServerLifeCycleState(req, res, next, body, uuid) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  await OperationServer.putOperationServerLifeCycleState(req.url, body, uuid)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putOperationServerOperationKey = async function putOperationServerOperationKey(req, res, next, body, uuid) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  await OperationServer.putOperationServerOperationKey(body, uuid)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};