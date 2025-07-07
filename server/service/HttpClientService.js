'use strict';
var fileOperation = require('onf-core-model-ap/applicationPattern/databaseDriver/JSONDriver');
const prepareForwardingAutomation = require('./individualServices/PrepareForwardingAutomation');
const ForwardingAutomationService = require('onf-core-model-ap/applicationPattern/onfModel/services/ForwardingConstructAutomationServices');
const httpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpClientInterface');

/**
 * Returns name of application to be addressed
 *
 * uuid String 
 * returns inline_response_200_26
 **/
exports.getHttpClientApplicationName = function (url) {
  return new Promise(async function (resolve, reject) {
    try {
      let value = await fileOperation.readFromDatabaseAsync(url);
      let response = {};
      response['application/json'] = {
        "http-client-interface-1-0:application-name": value
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
 * Returns release number of application to be addressed
 *
 * uuid String 
 * returns inline_response_200_27
 **/
exports.getHttpClientReleaseNumber = function (url) {
  return new Promise(async function (resolve, reject) {
    try {
      let value = await fileOperation.readFromDatabaseAsync(url);
      let response = {};
      response['application/json'] = {
        "http-client-interface-1-0:release-number": value
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
 * Configures name of application to be addressed
 *
 * body Httpclientinterfaceconfiguration_applicationname_body
 * uuid String
 * no response value expected for this operation
 **/
exports.putHttpClientApplicationName = function(body, uuid) {
  return new Promise(async function (resolve, reject) {
    try {
      let isUpdated = await httpClientInterface.setApplicationNameAsync(uuid, body["http-client-interface-1-0:application-name"]);
      if(isUpdated){
        let forwardingAutomationInputList = await prepareForwardingAutomation.OAMLayerRequest(
          uuid
        );
        ForwardingAutomationService.automateForwardingConstructWithoutInputAsync(
          forwardingAutomationInputList
        );
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Configures release number of application to be addressed
 *
 * body Httpclientinterfaceconfiguration_releasenumber_body
 * uuid String
 * no response value expected for this operation
 **/
exports.putHttpClientReleaseNumber = function (body, uuid) {
  return new Promise(async function (resolve, reject) {
    try {
      let isUpdated = await httpClientInterface.setReleaseNumberAsync(uuid, body["http-client-interface-1-0:release-number"]);
      if(isUpdated){
        let forwardingAutomationInputList = await prepareForwardingAutomation.OAMLayerRequest(
          uuid
        );
        ForwardingAutomationService.automateForwardingConstructWithoutInputAsync(
          forwardingAutomationInputList
        );
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}
