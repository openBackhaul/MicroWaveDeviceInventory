'use strict';

var utils = require('../utils/writer.js');
var StringProfile = require('../service/StringProfileService');

module.exports.getStringProfileEnumeration = function getStringProfileEnumeration (req, res, next, uuid) {
  StringProfile.getStringProfileEnumeration(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getStringProfilePattern = function getStringProfilePattern (req, res, next, uuid) {
  StringProfile.getStringProfilePattern(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getStringProfileStringName = function getStringProfileStringName (req, res, next, uuid) {
  StringProfile.getStringProfileStringName(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getStringProfileStringValue = function getStringProfileStringValue (req, res, next, uuid) {
  StringProfile.getStringProfileStringValue(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putStringProfileStringValue = function putStringProfileStringValue (req, res, next, body, uuid) {
  StringProfile.putStringProfileStringValue(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
