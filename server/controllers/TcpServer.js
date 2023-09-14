'use strict';

var utils = require('../utils/writer.js');
var TcpServer = require('../service/TcpServerService');

module.exports.getTcpServerDescription = function getTcpServerDescription (req, res, next, uuid) {
  TcpServer.getTcpServerDescription(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTcpServerLocalAddress = function getTcpServerLocalAddress (req, res, next, uuid) {
  TcpServer.getTcpServerLocalAddress(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTcpServerLocalPort = function getTcpServerLocalPort (req, res, next, uuid) {
  TcpServer.getTcpServerLocalPort(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTcpServerLocalProtocol = function getTcpServerLocalProtocol (req, res, next, uuid) {
  TcpServer.getTcpServerLocalProtocol(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putTcpServerDescription = function putTcpServerDescription (req, res, next, body, uuid) {
  TcpServer.putTcpServerDescription(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putTcpServerLocalAddress = function putTcpServerLocalAddress (req, res, next, body, uuid) {
  TcpServer.putTcpServerLocalAddress(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putTcpServerLocalPort = function putTcpServerLocalPort (req, res, next, body, uuid) {
  TcpServer.putTcpServerLocalPort(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putTcpServerLocalProtocol = function putTcpServerLocalProtocol (req, res, next, body, uuid) {
  TcpServer.putTcpServerLocalProtocol(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
