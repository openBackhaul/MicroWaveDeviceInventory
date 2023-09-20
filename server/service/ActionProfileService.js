'use strict';


/**
 * Returns the reference on the consequent operation
 *
 * uuid String 
 * returns inline_response_200_76
 **/
exports.getActionProfileConsequentOperationReference = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "action-profile-1-0:consequent-operation-reference" : "/core-model-1-4:control-construct/logical-termination-point=ro-1-0-0-op-s-bs-002/layer-protocol=0/operation-server-interface-1-0:operation-server-interface-pac/operation-server-interface-capability/operation-name"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns whether to be presented in new browser window
 *
 * uuid String 
 * returns inline_response_200_75
 **/
exports.getActionProfileDisplayInNewBrowserWindow = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "action-profile-1-0:display-in-new-browser-window" : false
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns the list of input values
 *
 * uuid String 
 * returns inline_response_200_74
 **/
exports.getActionProfileInputValueListt = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "action-profile-1-0:input-value-list" : [ {
    "field-name" : "Label of input field",
    "unit" : "Unit at input field"
  }, {
    "field-name" : "Label of input field",
    "unit" : "Unit at input field"
  } ]
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns the Label of the Action
 *
 * uuid String 
 * returns inline_response_200_73
 **/
exports.getActionProfileLabel = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "action-profile-1-0:label" : "Inform about Application"
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
 * returns inline_response_200_72
 **/
exports.getActionProfileOperationName = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "action-profile-1-0:operation-name" : "/v1/start-application-in-generic-representation"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Configures the reference on the consequent operation
 *
 * body Actionprofileconfiguration_consequentoperationreference_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putActionProfileConsequentOperationReference = function(body,uuid) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}

