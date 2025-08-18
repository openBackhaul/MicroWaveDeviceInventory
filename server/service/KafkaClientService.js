'use strict';
const fileOperation = require('onf-core-model-ap/applicationPattern/databaseDriver/JSONDriver');

/**
 * Returns client id (Identifier of the application)
 *
 * uuid String
 * returns inline_response_200_142
 **/
exports.getKafkaClientClientId = function (url) {
  return new Promise(async function (resolve, reject) {
    var value = await fileOperation.readFromDatabaseAsync(url);
    var response = {};
    response['application/json'] = {
      "kafka-client-interface-1-0:client-id": value
    };
    if (Object.keys(response).length > 0) {
      resolve(response[Object.keys(response)[0]]);
    }
  });
}


/**
 * Returns group id (Identifier for consumers consuming a topic)
 *
 * uuid String
 * returns inline_response_200_143
 **/
exports.getKafkaClientGroupId = function (url) {
  return new Promise(async function (resolve, reject) {
    var value = await fileOperation.readFromDatabaseAsync(url);
    var response = {};
    response['application/json'] = {
      "kafka-client-interface-1-0:client-id": value
    };
    if (Object.keys(response).length > 0) {
      resolve(response[Object.keys(response)[0]]);
    }
  });
}


/**
 * Returns life cycle state of the connection towards Kafka
 *
 * uuid String
 * returns inline_response_200_145
 **/
exports.getKafkaClientLifeCycleState = function (url) {
  return new Promise(async function (resolve, reject) {
    var value = await fileOperation.readFromDatabaseAsync(url);
    var response = {};
    response['application/json'] = {
      "kafka-client-interface-1-0:client-id": value
    };
    if (Object.keys(response).length > 0) {
      resolve(response[Object.keys(response)[0]]);
    }
  });
}


/**
 * Returns operational state of the connection towards Kafka
 *
 * uuid String
 * returns inline_response_200_144
 **/
exports.getKafkaClientOperationalState = function (url) {
  return new Promise(async function (resolve, reject) {
    var value = await fileOperation.readFromDatabaseAsync(url);
    var response = {};
    response['application/json'] = {
      "kafka-client-interface-1-0:client-id": value
    };
    if (Object.keys(response).length > 0) {
      resolve(response[Object.keys(response)[0]]);
    }
  });
}


/**
 * Returns Password
 *
 * uuid String
 * returns inline_response_200_140
 **/
exports.getKafkaClientPassword = function (url) {
  return new Promise(async function (resolve, reject) {
    var value = await fileOperation.readFromDatabaseAsync(url);
    var response = {};
    response['application/json'] = {
      "kafka-client-interface-1-0:client-id": value
    };
    if (Object.keys(response).length > 0) {
      resolve(response[Object.keys(response)[0]]);
    }
  });
}


/**
 * Returns topic name
 *
 * uuid String
 * returns inline_response_200_141
 **/
exports.getKafkaClientTopicName = function (url) {
  return new Promise(async function (resolve, reject) {
    var value = await fileOperation.readFromDatabaseAsync(url);
    var response = {};
    response['application/json'] = {
      "kafka-client-interface-1-0:client-id": value
    };
    if (Object.keys(response).length > 0) {
      resolve(response[Object.keys(response)[0]]);
    }
  });
}

/**
 * Returns UserName
 *
 * uuid String
 * returns inline_response_200_139
 **/
exports.getKafkaClientUserName = function (url) {
  return new Promise(async function (resolve, reject) {
    var value = await fileOperation.readFromDatabaseAsync(url);
    var response = {};
    response['application/json'] = {
      "kafka-client-interface-1-0:client-id": value
    };
    if (Object.keys(response).length > 0) {
      resolve(response[Object.keys(response)[0]]);
    }
  });
}


/**
 * Configures client id
 *
 * body Body_55
 * uuid String
 * no response value expected for this operation
 **/
exports.putKafkaClientClientId = async function (url, body) {
    await fileOperation.writeToDatabaseAsync(url, body, false);
}


/**
 * Configures group id
 *
 * body Body_56
 * uuid String
 * no response value expected for this operation
 **/
exports.putKafkaClientGroupId = async function (url, body) {
    await fileOperation.writeToDatabaseAsync(url, body, false);
}

/**
 * Configures Password
 *
 * body Body_53
 * uuid String
 * no response value expected for this operation
 **/
exports.putKafkaClientPassword = async function (url, body) {
    await fileOperation.writeToDatabaseAsync(url, body, false);
}


/**
 * Configures topic name
 *
 * body Body_54
 * uuid String
 * no response value expected for this operation
 **/
exports.putKafkaClientTopicName = async function (url, body) {
    await fileOperation.writeToDatabaseAsync(url, body, false);
}


/**
 * Configures UserName
 *
 * body Body_52
 * uuid String
 * no response value expected for this operation
 **/
exports.putKafkaClientUserName = async function (url, body) {
    await fileOperation.writeToDatabaseAsync(url, body, false);
}

