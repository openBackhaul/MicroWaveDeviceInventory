'use strict';

var utils = require('../utils/writer.js');
var OperationServer = require('../service/OperationServerService');

module.exports.getOperationServerLifeCycleState = function getOperationServerLifeCycleState (req, res, next, uuid) {
  OperationServer.getOperationServerLifeCycleState(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getOperationServerOperationKey = function getOperationServerOperationKey (req, res, next, uuid) {
  OperationServer.getOperationServerOperationKey(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getOperationServerOperationName = function getOperationServerOperationName (req, res, next, uuid) {
  OperationServer.getOperationServerOperationName(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putOperationServerLifeCycleState = function putOperationServerLifeCycleState (req, res, next, body, uuid) {
  OperationServer.putOperationServerLifeCycleState(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putOperationServerOperationKey = function putOperationServerOperationKey (req, res, next, body, uuid) {
  OperationServer.putOperationServerOperationKey(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
