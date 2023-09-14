'use strict';


/**
 * Returns the configured life cycle state of the operation
 *
 * uuid String 
 * returns inline_response_200_92
 **/
exports.getOperationServerLifeCycleState = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "operation-server-interface-1-0:life-cycle-state" : "operation-server-interface-1-0:LIFE_CYCLE_STATE_TYPE_EXPERIMENTAL"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns key for connecting
 *
 * uuid String 
 * returns inline_response_200_93
 **/
exports.getOperationServerOperationKey = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "operation-server-interface-1-0:operation-key" : "Operation key not yet provided."
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns operation name
 *
 * uuid String 
 * returns inline_response_200_91
 **/
exports.getOperationServerOperationName = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "operation-server-interface-1-0:operation-name" : "/v1/register-yourself"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Configures life cycle state
 *
 * body Operationserverinterfaceconfiguration_lifecyclestate_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putOperationServerLifeCycleState = function(body,uuid) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Changes key for connecting
 *
 * body Operationserverinterfaceconfiguration_operationkey_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putOperationServerOperationKey = function(body,uuid) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}

