'use strict';

var ElasticsearchClient = require('../service/ElasticsearchClientService');
var responseBuilder = require('onf-core-model-ap/applicationPattern/rest/server/ResponseBuilder');
var responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
var oamLogService = require('onf-core-model-ap/applicationPattern/services/OamLogService');

module.exports.getElasticsearchClientApiKey = async function getElasticsearchClientApiKey (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await ElasticsearchClient.getElasticsearchClientApiKey(req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getElasticsearchClientIndexAlias = async function getElasticsearchClientIndexAlias (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await ElasticsearchClient.getElasticsearchClientIndexAlias(req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getElasticsearchClientLifeCycleState = async function getElasticsearchClientLifeCycleState (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await ElasticsearchClient.getElasticsearchClientLifeCycleState(req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getElasticsearchClientOperationalState = async function getElasticsearchClientOperationalState (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await ElasticsearchClient.getElasticsearchClientOperationalState(uuid)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getElasticsearchClientServiceRecordsPolicy = async function getElasticsearchClientServiceRecordsPolicy(req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await ElasticsearchClient.getElasticsearchClientServiceRecordsPolicy(uuid)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putElasticsearchClientApiKey = async function putElasticsearchClientApiKey (req, res, next, body, uuid) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  await ElasticsearchClient.putElasticsearchClientApiKey(req.url, body, uuid)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putElasticsearchClientIndexAlias = async function putElasticsearchClientIndexAlias (req, res, next, body, uuid) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  await ElasticsearchClient.putElasticsearchClientIndexAlias(req.url, body, uuid)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putElasticsearchClientServiceRecordsPolicy = async function putElasticsearchClientServiceRecordsPolicy (req, res, next, body, uuid) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  await ElasticsearchClient.putElasticsearchClientServiceRecordsPolicy(uuid, body)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};
