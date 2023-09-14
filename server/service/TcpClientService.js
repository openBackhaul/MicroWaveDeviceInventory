'use strict';


/**
 * Returns remote address
 *
 * uuid String 
 * returns inline_response_200_118
 **/
exports.getTcpClientRemoteAddress = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "tcp-client-interface-1-0:remote-address" : {
    "ip-address" : {
      "ipv-4-address" : "1.1.4.1"
    }
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
 * Returns target TCP port at server
 *
 * uuid String 
 * returns inline_response_200_119
 **/
exports.getTcpClientRemotePort = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "tcp-client-interface-1-0:remote-port" : 1000
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Returns protocol for addressing remote side
 *
 * uuid String 
 * returns inline_response_200_117
 **/
exports.getTcpClientRemoteProtocol = function(uuid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "tcp-client-interface-1-0:remote-protocol" : "tcp-client-interface-1-0:PROTOCOL_TYPE_HTTP"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Configures remote address
 *
 * body Tcpclientinterfaceconfiguration_remoteaddress_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putTcpClientRemoteAddress = function(body,uuid) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Configures target TCP port at server
 *
 * body Tcpclientinterfaceconfiguration_remoteport_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putTcpClientRemotePort = function(body,uuid) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Configures protocol for addressing remote side
 *
 * body Tcpclientinterfaceconfiguration_remoteprotocol_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putTcpClientRemoteProtocol = function(body,uuid) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}

