'use strict';

var utils = require('../utils/writer.js');
var TcpClient = require('../service/TcpClientService');

module.exports.getTcpClientRemoteAddress = function getTcpClientRemoteAddress (req, res, next, uuid) {
  TcpClient.getTcpClientRemoteAddress(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTcpClientRemotePort = function getTcpClientRemotePort (req, res, next, uuid) {
  TcpClient.getTcpClientRemotePort(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTcpClientRemoteProtocol = function getTcpClientRemoteProtocol (req, res, next, uuid) {
  TcpClient.getTcpClientRemoteProtocol(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putTcpClientRemoteAddress = function putTcpClientRemoteAddress (req, res, next, body, uuid) {
  TcpClient.putTcpClientRemoteAddress(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putTcpClientRemotePort = function putTcpClientRemotePort (req, res, next, body, uuid) {
  TcpClient.putTcpClientRemotePort(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putTcpClientRemoteProtocol = function putTcpClientRemoteProtocol (req, res, next, body, uuid) {
  TcpClient.putTcpClientRemoteProtocol(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
