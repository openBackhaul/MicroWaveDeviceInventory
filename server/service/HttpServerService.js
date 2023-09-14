'use strict';


/**
 * Returns application name
 *
 * uuid String 
 * returns inline_response_200_94
 **/
exports.getHttpServerApplicationName = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "http-server-interface-1-0:application-name" : "ApplicationName"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns application purpose
 *
 * uuid String 
 * returns inline_response_200_96
 **/
exports.getHttpServerApplicationPurpose = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "http-server-interface-1-0:application-purpose" : "Brief description of the purpose of the application."
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns update period
 *
 * uuid String 
 * returns inline_response_200_97
 **/
exports.getHttpServerDataUpdatePeriode = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "http-server-interface-1-0:data-update-period" : "http-server-interface-1-0:DATA_UPDATE_PERIOD_TYPE_REAL_TIME"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns owner email address
 *
 * uuid String 
 * returns inline_response_200_99
 **/
exports.getHttpServerOwnerEmailAddress = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "http-server-interface-1-0:owner-email-address" : "Thorsten.Heinze@telefonica.com"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns owner name
 *
 * uuid String 
 * returns inline_response_200_98
 **/
exports.getHttpServerOwnerName = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "http-server-interface-1-0:owner-name" : "Thorsten Heinze"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns list of releases
 *
 * uuid String 
 * returns inline_response_200_100
 **/
exports.getHttpServerReleaseList = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "http-server-interface-1-0:release-list" : [ {
    "local-id" : 0,
    "release-number" : "1.0.0",
    "release-date" : "20.11.2010",
    "changes" : "Initial version."
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
 * Returns release number
 *
 * uuid String 
 * returns inline_response_200_95
 **/
exports.getHttpServerReleaseNumber = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "http-server-interface-1-0:release-number" : "1.0.0"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

