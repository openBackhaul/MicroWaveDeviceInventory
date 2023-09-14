'use strict';

var utils = require('../utils/writer.js');
var ElasticsearchClient = require('../service/ElasticsearchClientService');

module.exports.getElasticsearchClientApiKey = function getElasticsearchClientApiKey (req, res, next, uuid) {
  ElasticsearchClient.getElasticsearchClientApiKey(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getElasticsearchClientIndexAlias = function getElasticsearchClientIndexAlias (req, res, next, uuid) {
  ElasticsearchClient.getElasticsearchClientIndexAlias(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getElasticsearchClientLifeCycleState = function getElasticsearchClientLifeCycleState (req, res, next, uuid) {
  ElasticsearchClient.getElasticsearchClientLifeCycleState(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getElasticsearchClientOperationalState = function getElasticsearchClientOperationalState (req, res, next, uuid) {
  ElasticsearchClient.getElasticsearchClientOperationalState(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getElasticsearchClientServiceRecordsPolicy = function getElasticsearchClientServiceRecordsPolicy (req, res, next, uuid) {
  ElasticsearchClient.getElasticsearchClientServiceRecordsPolicy(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putElasticsearchClientApiKey = function putElasticsearchClientApiKey (req, res, next, body, uuid) {
  ElasticsearchClient.putElasticsearchClientApiKey(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putElasticsearchClientIndexAlias = function putElasticsearchClientIndexAlias (req, res, next, body, uuid) {
  ElasticsearchClient.putElasticsearchClientIndexAlias(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putElasticsearchClientServiceRecordsPolicy = function putElasticsearchClientServiceRecordsPolicy (req, res, next, body, uuid) {
  ElasticsearchClient.putElasticsearchClientServiceRecordsPolicy(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
