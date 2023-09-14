'use strict';


/**
 * Returns the enumeration values of the String
 *
 * uuid String 
 * returns inline_response_200_88
 **/
exports.getStringProfileEnumeration = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "string-profile-1-0:enumeration" : [ "string-profile-1-0:STRING_VALUE_TYPE_REACTIVE", "string-profile-1-0:STRING_VALUE_TYPE_PROTECTION", "string-profile-1-0:STRING_VALUE_TYPE_OFF" ]
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns the pattern of the String
 *
 * uuid String 
 * returns inline_response_200_89
 **/
exports.getStringProfilePattern = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "string-profile-1-0:pattern" : "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns the name of the String
 *
 * uuid String 
 * returns inline_response_200_87
 **/
exports.getStringProfileStringName = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "string-profile-1-0:string-name" : "operationMode"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns the configured value of the String
 *
 * uuid String 
 * returns inline_response_200_90
 **/
exports.getStringProfileStringValue = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "string-profile-1-0:string-value" : "string-profile-1-0:STRING_VALUE_TYPE_OFF"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Configures value of the String
 *
 * body Stringprofileconfiguration_stringvalue_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putStringProfileStringValue = function(body,uuid) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}

