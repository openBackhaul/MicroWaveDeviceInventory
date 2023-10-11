'use strict';


/**
 * Returns the name of the Integer
 *
 * uuid String 
 * returns inline_response_200_82
 **/
exports.getIntegerProfileIntegerName = async function(uuid) {
    let value = await fileOperation.readFromDatabaseAsync(uuid);
    if (!value) {
      value = [];
    }
    return {
      "integer-profile-1-0:name": value
    };
}


/**
 * Returns the configured value of the Integer
 *
 * uuid String 
 * returns inline_response_200_86
 **/
exports.getIntegerProfileIntegerValue = async function(uuid) {
  let value = await fileOperation.readFromDatabaseAsync(uuid);
  if (!value) {
    value = [];
  }
  return {
    "integer-profile-1-0:integer-value": value
  };
}


/**
 * Returns the maximum value of the Integer
 *
 * uuid String 
 * returns inline_response_200_85
 **/
exports.getIntegerProfileMaximum = async function(uuid) {
  let value = await fileOperation.readFromDatabaseAsync(uuid);
  if (!value) {
    value = [];
  }
  return {
    "integer-profile-1-0:maximum": value
  };
}


/**
 * Returns the minimum value of the Integer
 *
 * uuid String 
 * returns inline_response_200_84
 **/
exports.getIntegerProfileMinimum = async function(uuid) {
  let value = await fileOperation.readFromDatabaseAsync(uuid);
  if (!value) {
    value = [];
  }
  return {
    "integer-profile-1-0:minimum": value
  };
}


/**
 * Returns the unit of the Integer
 *
 * uuid String 
 * returns inline_response_200_83
 **/
exports.getIntegerProfileUnit = async function(uuid) {
  let value = await fileOperation.readFromDatabaseAsync(uuid);
  if (!value) {
    value = [];
  }
  return {
    "integer-profile-1-0:unit": value
  };
}


/**
 * Configures value of the Integer
 *
 * body Integerprofileconfiguration_integervalue_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putIntegerProfileIntegerValue = async function(body,uuid) {
  await fileOperation.writeToDatabaseAsync(uuid, body, false);
}

