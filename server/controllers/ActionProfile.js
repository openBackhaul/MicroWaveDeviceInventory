'use strict';

var utils = require('../utils/writer.js');
var ActionProfile = require('../service/ActionProfileService');

module.exports.getActionProfileConsequentOperationReference = function getActionProfileConsequentOperationReference (req, res, next, uuid) {
  ActionProfile.getActionProfileConsequentOperationReference(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getActionProfileDisplayInNewBrowserWindow = function getActionProfileDisplayInNewBrowserWindow (req, res, next, uuid) {
  ActionProfile.getActionProfileDisplayInNewBrowserWindow(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getActionProfileInputValueListt = function getActionProfileInputValueListt (req, res, next, uuid) {
  ActionProfile.getActionProfileInputValueListt(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getActionProfileLabel = function getActionProfileLabel (req, res, next, uuid) {
  ActionProfile.getActionProfileLabel(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getActionProfileOperationName = function getActionProfileOperationName (req, res, next, uuid) {
  ActionProfile.getActionProfileOperationName(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putActionProfileConsequentOperationReference = function putActionProfileConsequentOperationReference (req, res, next, body, uuid) {
  ActionProfile.putActionProfileConsequentOperationReference(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
