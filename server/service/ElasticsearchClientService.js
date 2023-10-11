'use strict';
var fileOperation = require('onf-core-model-ap/applicationPattern/databaseDriver/JSONDriver');
const { elasticsearchService, getApiKeyAsync, getIndexAliasAsync } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const prepareElasticsearch = require('./individualServices/ElasticsearchPreparation');

/**
 * Returns API key
 *
 * url String
 * returns inline_response_200_50
 **/
exports.getElasticsearchClientApiKey = async function(url) {
  var value = await fileOperation.readFromDatabaseAsync(url);
  var response = {
    "elasticsearch-client-interface-1-0:api-key" : value
  };
  return response;
}

/**
 * Returns index alias
 *
 * url String
 * returns inline_response_200_51
 **/
exports.getElasticsearchClientIndexAlias = async function(url) {
  var value = await fileOperation.readFromDatabaseAsync(url);
  var response = {
    "elasticsearch-client-interface-1-0:index-alias" : value
  };
  return response;
}

/**
 * Returns life cycle state of the connection towards Elasticsearch
 *
 * url String
 * returns inline_response_200_54
 **/
exports.getElasticsearchClientLifeCycleState = async function(url) {
  var value = await fileOperation.readFromDatabaseAsync(url);
  var response = {
    "elasticsearch-client-interface-1-0:life-cycle-state" : value
  };
  return response;
}

/**
 * Returns operational state of the connection towards Elasticsearch
 *
 * url String
 * uuid String
 * returns inline_response_200_53
 **/
exports.getElasticsearchClientOperationalState = async function(uuid) {
  let value = await elasticsearchService.getElasticsearchClientOperationalStateAsync(uuid);
  var response = {
    "elasticsearch-client-interface-1-0:operational-state" : value
  };
  return response;
}

/**
 * Returns service records policy
 *
 * uuid String
 * returns inline_response_200_52
 **/
exports.getElasticsearchClientServiceRecordsPolicy = async function(uuid) {
  var value = await elasticsearchService.getElasticsearchClientServiceRecordsPolicyAsync(uuid);
  var response = {
    "elasticsearch-client-interface-1-0:service-records-policy" : value
  };
  return response;
}

/**
 * Configures API key
 *
 * body Auth_apikey_body
 * url String
 * no response value expected for this operation
 **/
exports.putElasticsearchClientApiKey = async function(url, body, uuid) {
  let oldValue = await getApiKeyAsync(uuid);
  if (oldValue !== body["elasticsearch-client-interface-1-0:api-key"]) {
    await fileOperation.writeToDatabaseAsync(url, body, false);
    // recreate the client with new connection data
    await elasticsearchService.getClient(true, uuid);
    await prepareElasticsearch();
  }
}

/**
 * Configures index alias
 *
 * body Elasticsearchclientinterfaceconfiguration_indexalias_body
 * url String
 * no response value expected for this operation
 **/
exports.putElasticsearchClientIndexAlias = async function(url, body, uuid) {
  let oldValue = await getIndexAliasAsync(uuid);
  let oldPolicy = await elasticsearchService.getElasticsearchClientServiceRecordsPolicyAsync(uuid);
  if (oldValue !== body["elasticsearch-client-interface-1-0:index-alias"]) {
    await fileOperation.writeToDatabaseAsync(url, body, false);
    await prepareElasticsearch();
    // we need to reassign policy associated with the old alias to the new
    if (oldPolicy["service-records-policy-name"] !== "") {
      await elasticsearchService.assignPolicyToIndexTemplate(oldPolicy["service-records-policy-name"], uuid);
    }
  }
}

  /**
 * Configures service records policy
 *
 * body Elasticsearchclientinterfaceconfiguration_servicerecordspolicy_body
 * uuid String
 * no response value expected for this operation
 **/
exports.putElasticsearchClientServiceRecordsPolicy = async function(uuid, body) {
  await elasticsearchService.putElasticsearchClientServiceRecordsPolicyAsync(uuid, body);
  let policy = body["elasticsearch-client-interface-1-0:service-records-policy"];
  await elasticsearchService.assignPolicyToIndexTemplate(policy["service-records-policy-name"], uuid);
}
