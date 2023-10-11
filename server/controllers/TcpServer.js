'use strict';

var TcpServer = require('../service/TcpServerService');
var responseBuilder = require('onf-core-model-ap/applicationPattern/rest/server/ResponseBuilder');
var responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
var oamLogService = require('onf-core-model-ap/applicationPattern/services/OamLogService');

module.exports.getTcpServerDescription = async function getTcpServerDescription (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await TcpServer.getTcpServerDescription(req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getTcpServerLocalAddress = async function getTcpServerLocalAddress (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await TcpServer.getTcpServerLocalAddress(req.url)
      .then(function (response) {
        responseBuilder.buildResponse(res, responseCode, response);
      })
      .catch(function (response) {
        let sentResp = responseBuilder.buildResponse(res, undefined, response);
        responseCode = sentResp.code;
      });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getTcpServerLocalPort = async function getTcpServerLocalPort (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await TcpServer.getTcpServerLocalPort(req.url)
      .then(function (response) {
        responseBuilder.buildResponse(res, responseCode, response);
      })
      .catch(function (response) {
        let sentResp = responseBuilder.buildResponse(res, undefined, response);
        responseCode = sentResp.code;
      });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getTcpServerLocalProtocol = async function getTcpServerLocalProtocol (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await TcpServer.getTcpServerLocalProtocol(req.url)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putTcpServerDescription = async function putTcpServerDescription (req, res, next, body, uuid) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  await TcpServer.putTcpServerDescription(req.url, body, uuid)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putTcpServerLocalAddress = async function putTcpServerLocalAddress (req, res, next, body, uuid) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  await TcpServer.putTcpServerLocalAddress(body, uuid)
      .then(function (response) {
        responseBuilder.buildResponse(res, responseCode, response);
      })
      .catch(function (response) {
        let sentResp = responseBuilder.buildResponse(res, undefined, response);
        responseCode = sentResp.code;
      });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putTcpServerLocalPort = async function putTcpServerLocalPort (req, res, next, body, uuid) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  await TcpServer.putTcpServerLocalPort(body, uuid)
      .then(function (response) {
        responseBuilder.buildResponse(res, responseCode, response);
      })
      .catch(function (response) {
        let sentResp = responseBuilder.buildResponse(res, undefined, response);
        responseCode = sentResp.code;
      });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putTcpServerLocalProtocol = async function putTcpServerLocalProtocol (req, res, next, body, uuid) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  await TcpServer.putTcpServerLocalProtocol(req.url, body, uuid)
    .then(function (response) {
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};
