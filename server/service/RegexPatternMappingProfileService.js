'use strict';
var fileOperation = require('onf-core-model-ap/applicationPattern/databaseDriver/JSONDriver');

/**
 * Returns the configured value of the mapping list
 *
 * uuid String 
 * returns inline_response_200_114
 **/
exports.getRegexPatternMappingProfileMappingListValue = function(url) {
return new Promise(async function(resolve, reject) {
    try {
      let value = await fileOperation.readFromDatabaseAsync(url);
      let response = {};
      response['application/json'] = {
        "mapping-profile-1-0:mapping-list" : value
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
 * Returns the configured value of the mapping name
 *
 * uuid String 
 * returns inline_response_200_112
 **/
exports.getRegexPatternMappingProfileMappingNameValue = function(url) {
return new Promise(async function(resolve, reject) {
      try {
    let value = await fileOperation.readFromDatabaseAsync(url);
     let response = {};
      response['application/json'] = {
        "mapping-profile-1-0:mapping-name" : value
      };
      if (Object.keys(response).length > 0) {
        resolve(response[Object.keys(response)[0]]);
      } else {
        resolve();
      }
    }catch (error) {
      reject(error);
    }
    
  });
}


/**
 * Returns the configured value of the purpose
 *
 * uuid String 
 * returns inline_response_200_113
 **/
exports.getRegexPatternMappingProfilePurposeValue = function(url) {
 return new Promise(async function(resolve, reject) {

    try {
    let value = await fileOperation.readFromDatabaseAsync(url);
     let response = {};
      response['application/json'] = {
        "mapping-profile-1-0:purpose" : value
      };
      if (Object.keys(response).length > 0) {
        resolve(response[Object.keys(response)[0]]);
      } else {
        resolve();
      }
    }catch (error) {
      reject(error);
    }
    
  });
}


/**
 * Configures value of the mapping list
 *
 * body Regexpatternmappingprofileconfiguration_mappinglist_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putRegexPatternMappingProfileMappingListValue = function(body,url) {
  return new Promise(async function (resolve, reject) {
      try {
        await fileOperation.writeToDatabaseAsync(url, body, false);
        resolve();
      } catch (error) {
        reject(error);
      }
  });
}


/**
 * Configures value of the mapping name
 *
 * body Regexpatternmappingprofilecapability_mappingname_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putRegexPatternMappingProfileMappingNameValue = function(body,url) {
 return new Promise(async function (resolve, reject) {
     try {
       await fileOperation.writeToDatabaseAsync(url, body, false);
       resolve();
     } catch (error) {
       reject(error);
     }
  });
}


/**
 * Configures value of the purpose
 *
 * body Regexpatternmappingprofilecapability_purpose_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putRegexPatternMappingProfilePurposeValue = function(body,url) {
  return new Promise(async function (resolve, reject) {
      try {
        await fileOperation.writeToDatabaseAsync(url, body, false);
        resolve();
      } catch (error) {
        reject(error);
      }
  });
}

