'use strict';


/**
 * Returns the Datatype of the Field
 *
 * uuid String 
 * returns inline_response_200_80
 **/
exports.getGenericResponseProfileDatatype = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "response-profile-1-0:datatype" : "string"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns the Description of the Field
 *
 * uuid String 
 * returns inline_response_200_79
 **/
exports.getGenericResponseProfileDescription = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "response-profile-1-0:description" : "Name of this application"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns the name of the Field
 *
 * uuid String 
 * returns inline_response_200_78
 **/
exports.getGenericResponseProfileFieldName = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "response-profile-1-0:field-name" : "{\"static-field-name\":\"applicationName\"}"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns the name of the Operation
 *
 * uuid String 
 * returns inline_response_200_77
 **/
exports.getGenericResponseProfileOperationName = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "response-profile-1-0:operation-name" : "/v1/start-application-in-generic-representation"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns the Value of the Field
 *
 * uuid String 
 * returns inline_response_200_81
 **/
exports.getGenericResponseProfileValue = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "response-profile-1-0:value" : {
    "value-reference" : "/core-model-1-4:control-construct/logical-termination-point=mwdi-1-0-0-http-s-000/layer-protocol=0/http-server-interface-1-0:http-server-interface-pac/http-server-interface-capability/application-name"
  }
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Configures the Value of the Field
 *
 * body Responseprofileconfiguration_value_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putGenericResponseProfileValue = function(body,uuid) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}

