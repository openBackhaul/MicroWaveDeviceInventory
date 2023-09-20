'use strict';


/**
 * Returns Description of TcpServer
 *
 * uuid String 
 * returns inline_response_200_101
 **/
exports.getTcpServerDescription = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "tcp-server-interface-1-0:description" : "tcp-server-interface-1-0:description"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns address of the server
 *
 * uuid String 
 * returns inline_response_200_103
 **/
exports.getTcpServerLocalAddress = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "tcp-server-interface-1-0:local-address" : {
    "ipv-4-address" : "1.1.4.1"
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
 * Returns TCP port of the server
 *
 * uuid String 
 * returns inline_response_200_104
 **/
exports.getTcpServerLocalPort = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "tcp-server-interface-1-0:local-port" : 1000
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns Protocol of TcpServer
 *
 * uuid String 
 * returns inline_response_200_102
 **/
exports.getTcpServerLocalProtocol = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "tcp-server-interface-1-0:local-protocol" : "tcp-server-interface-1-0:PROTOCOL_TYPE_HTTP"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Documents Description of TcpServer
 *
 * body Tcpserverinterfaceconfiguration_description_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putTcpServerDescription = function(body,uuid) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Documents address of the server
 *
 * body Tcpserverinterfaceconfiguration_localaddress_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putTcpServerLocalAddress = function(body,uuid) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Documents TCP port of the server
 *
 * body Tcpserverinterfaceconfiguration_localport_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putTcpServerLocalPort = function(body,uuid) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Documents Protocol of TcpServer
 *
 * body Tcpserverinterfaceconfiguration_localprotocol_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putTcpServerLocalProtocol = function(body,uuid) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}

