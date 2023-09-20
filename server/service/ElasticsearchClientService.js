'use strict';


/**
 * Returns API key
 *
 * uuid String 
 * returns inline_response_200_110
 **/
exports.getElasticsearchClientApiKey = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "elasticsearch-client-interface-1-0:api-key" : "YWRtaW46MTIzNDU2"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns index alias
 *
 * uuid String 
 * returns inline_response_200_111
 **/
exports.getElasticsearchClientIndexAlias = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "elasticsearch-client-interface-1-0:index-alias" : "eatl_service_records"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns life cycle state of the connection towards Elasticsearch
 *
 * uuid String 
 * returns inline_response_200_114
 **/
exports.getElasticsearchClientLifeCycleState = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "elasticsearch-client-interface-1-0:life-cycle-state" : "elasticsearch-client-interface-1-0:LIFE_CYCLE_STATE_TYPE_NOT_YET_DEFINED"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns operational state of the connection towards Elasticsearch
 *
 * uuid String 
 * returns inline_response_200_113
 **/
exports.getElasticsearchClientOperationalState = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "elasticsearch-client-interface-1-0:operational-state" : "elasticsearch-client-interface-1-0:OPERATIONAL_STATE_TYPE_NOT_YET_DEFINED"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns service records policy
 *
 * uuid String 
 * returns inline_response_200_112
 **/
exports.getElasticsearchClientServiceRecordsPolicy = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "elasticsearch-client-interface-1-0:service-records-policy" : "{\"service-records-policy-name\":\"eatl_service_records_policy\",\"phases\":{\"hot\":{\"min-age\":\"30s\",\"actions\":{\"rollover\":{\"max-age\":\"5d\"}}},\"delete\":{\"min-age\":\"5d\",\"actions\":{}}}}"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Configures API key
 *
 * body Auth_apikey_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putElasticsearchClientApiKey = function(body,uuid) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Configures index alias
 *
 * body Elasticsearchclientinterfaceconfiguration_indexalias_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putElasticsearchClientIndexAlias = function(body,uuid) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Configures service records policy
 *
 * body Elasticsearchclientinterfaceconfiguration_servicerecordspolicy_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putElasticsearchClientServiceRecordsPolicy = function(body,uuid) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}

