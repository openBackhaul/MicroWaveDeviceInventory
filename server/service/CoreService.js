'use strict';
var fileOperation = require('onf-core-model-ap/applicationPattern/databaseDriver/JSONDriver');
const { elasticsearchService } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');

/**
 * Returns entire data tree
 *
 * returns inline_response_200_8
 **/
exports.getControlConstruct = function () {
  return new Promise(async function (resolve, reject) {
    try {
      var value = await fileOperation.readFromDatabaseAsync("core-model-1-4:control-construct");
      var response = {};
      response['application/json'] = {
        "core-model-1-4:control-construct": await elasticsearchService.updateControlConstructWithServicePolicy(value)
      };
      if (Object.keys(response).length > 0) {
        resolve(response[Object.keys(response)[0]]);
      } else {
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Returns entire instance of Profile
 *
 * uuid String
 * returns inline_response_200_6
 **/
exports.getProfileInstance = function(url) {
  return new Promise(async function(resolve, reject) {
    try {
      var value = await fileOperation.readFromDatabaseAsync(url);
      var response = {};
      response['application/json'] = {
        "core-model-1-4:profile" : value
      };
      if (Object.keys(response).length > 0) {
        resolve(response[Object.keys(response)[0]]);
      } else {
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
}
