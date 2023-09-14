'use strict';

var utils = require('../utils/writer.js');
var HttpServer = require('../service/HttpServerService');

module.exports.getHttpServerApplicationName = function getHttpServerApplicationName (req, res, next, uuid) {
  HttpServer.getHttpServerApplicationName(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getHttpServerApplicationPurpose = function getHttpServerApplicationPurpose (req, res, next, uuid) {
  HttpServer.getHttpServerApplicationPurpose(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getHttpServerDataUpdatePeriode = function getHttpServerDataUpdatePeriode (req, res, next, uuid) {
  HttpServer.getHttpServerDataUpdatePeriode(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getHttpServerOwnerEmailAddress = function getHttpServerOwnerEmailAddress (req, res, next, uuid) {
  HttpServer.getHttpServerOwnerEmailAddress(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getHttpServerOwnerName = function getHttpServerOwnerName (req, res, next, uuid) {
  HttpServer.getHttpServerOwnerName(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getHttpServerReleaseList = function getHttpServerReleaseList (req, res, next, uuid) {
  HttpServer.getHttpServerReleaseList(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getHttpServerReleaseNumber = function getHttpServerReleaseNumber (req, res, next, uuid) {
  HttpServer.getHttpServerReleaseNumber(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
