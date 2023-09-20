'use strict';

var utils = require('../utils/writer.js');
var Core = require('../service/CoreService');

module.exports.getControlConstruct = function getControlConstruct (req, res, next) {
  Core.getControlConstruct()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getProfileInstance = function getProfileInstance (req, res, next, uuid) {
  Core.getProfileInstance(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
