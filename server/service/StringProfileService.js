// @ts-check
'use strict';

const fileOperation = require('onf-core-model-ap/applicationPattern/databaseDriver/JSONDriver');
const createHttpError = require('http-errors');
const utility = require('./individualServices/utility');
const kafkaHandler = require('./individualServices/KafkaHandler');

/**
 * Returns the enumeration values of the String
 *
 * uuid String 
 * returns inline_response_200_18
 **/
exports.getStringProfileEnumeration = async function (url) {
  let value = await fileOperation.readFromDatabaseAsync(url);
  if (!value) {
    value = [];
  }
  return {
    "string-profile-1-0:enumeration": value
  };
}


/**
 * Returns the pattern of the String
 *
 * uuid String 
 * returns inline_response_200_19
 **/
exports.getStringProfilePattern = async function (url) {
  let value = await fileOperation.readFromDatabaseAsync(url);
  if (!value) {
    value = "";
  }
  return {
    "string-profile-1-0:pattern": value
  };
}


/**
 * Returns the name of the String
 *
 * returns inline_response_200_17
 **/
exports.getStringProfileStringName = async function (url) {
  const value = await fileOperation.readFromDatabaseAsync(url);
  return {
    "string-profile-1-0:string-name": value
  };
}


/**
 * Returns the configured value of the String
 *
 * * returns inline_response_200_20
 **/
exports.getStringProfileStringValue = async function (url) {
  const value = await fileOperation.readFromDatabaseAsync(url);
  return {
    "string-profile-1-0:string-value": value
  };
}


/**
 * Configures value of the String
 *
 * body Stringprofileconfiguration_stringvalue_body 
 * no response value expected for this operation
 **/
exports.putStringProfileStringValue = async function (body, url, uuid) {
  try {
    let stringNameForUuid = await utility.getStringNameForUuidAsync(uuid);
    if (stringNameForUuid === "kafkaNotificationReceiptAndProcessingSwitch") {
      let stringValue = body["string-profile-1-0:string-value"];
      if (stringValue === "on" || stringValue === "off") {
        await kafkaHandler.handleKafkaNotificationReceiptAndProcessingSwitch(stringValue);
      } else {
        throw createHttpError(400, "invalid input in request-body");
      }
    }
    await fileOperation.writeToDatabaseAsync(url, body, false);
  } catch (error) {
    return error;
  }
}
