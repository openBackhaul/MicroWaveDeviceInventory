'use strict';
const forwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const forwardingConstruct = require("onf-core-model-ap/applicationPattern/onfModel/models/ForwardingConstruct");
const operationClient = require("onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationClientInterface");
const operationServer = require("onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationServerInterface");
const RestClient = require('../../rest/client/dispacher');
const utility = require('../../utility');

/**
 * This function fetches control-construct of a device from live controller and updates the ES cache
 * @param {String} nodeId - mount-name
 * @param {Number} responseTimeOut - maximum time a request should wait for response
 * @param {Number} maxRetries - maximum number a time CC retrieval could be repeated in case of failure 
 * 
 * @returns {Boolean} true - in case of successful sync between live and cache for given nodeId
 */
exports.syncControllerCcToEs = async function (nodeId, responseTimeOut, maxRetries) {
    let isSyncSuccess = false;
    try {
        let ccObjectFromLive = await exports.fetchControlConstructFromLive(nodeId, responseTimeOut, maxRetries);
        let modifiedCc = {};
        if (Object.keys(ccObjectFromLive).length != 0) {
            modifiedCc = await exports.modifyCCWithModifiedKeys(ccObjectFromLive, nodeId);
            modifiedCc['last-complete-control-construct-update-time'] = new Date().toJSON();
            isSyncSuccess = await exports.updateControlConstructToEs(nodeId, modifiedCc, maxRetries);
        }
    } catch (error) {
    }
    return isSyncSuccess;
}

/**
 * This function fetches control-construct of a device from live controller 
 * @param {String} nodeId - mount-name
 * @param {Number} responseTimeOut - maximum time a request should wait for response
 * @param {Number} maxRetries - maximum number a time CC retrieval could be repeated in case of failure 
 * 
 * @returns {Object} controlConstructFromController - cc of device from live
 */
exports.fetchControlConstructFromLive = async function (nodeId, responseTimeOut, maxRetries) {
    let controlConstructFromController = {};
    try {
        //const finalUrl = common[0].tcpConn + await exports.getControlConstructPathForLive(nodeId);
        let finalUrl = common[0].tcpConn + "/rests/data/network-topology:network-topology/topology=topology-netconf/node={mountName}/yang-ext:mount/core-model-1-4:control-construct";
        finalUrl = finalUrl.replace("{mountName}", nodeId);
        const Authorization = common[0].key;
        const result = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization, responseTimeOut);
        if (!result) {
            console.log(`********************************CC retrieval failed for ${nodeId} - network error `);
        } else {
            if (result.status == 200) {
                controlConstructFromController = result["data"];
                console.log(`********************************CC retrieved for ${nodeId} *************************** `);
                return controlConstructFromController;

            }else {
                 if (maxRetries > 0) {
                    await sleep(2000);
                    console.log(`******************************** CC retrieval for ${nodeId} - ${maxRetries - 1}`);
                    return await exports.fetchControlConstructFromLive(nodeId, responseTimeOut, maxRetries - 1);
                } else {
                    console.log(`******************************** CC retrieval failed for ${nodeId} `);
                } 
            }
        }
    } catch (error) {
        console.error(`Error at receiving CC for node: ${nodeId} from live`)
    }
    return controlConstructFromController;
}

/**
 * This function updates Elasticsearch cache of a device with live cc
 * @param {String} nodeId - mount-name
 * @param {Object} ccObject - cc of device from live
 * 
 * @returns {Boolean} true - incase of successful update
 */
exports.updateControlConstructToEs = async function (nodeId, ccObject, maxRetries) {
    try {
        let result = await utility.recordRequest(ccObject, nodeId);
        if (result.took) {
            console.log(`********************************CC updated to ES for ${nodeId} *************************** `);
            return true;
        } else {
            if (maxRetries > 0) {
                await sleep(2000);
                console.log(`******************************** CC update to ES for ${nodeId} - ${maxRetries - 1}`);
                await exports.updateControlConstructToEs(nodeId, ccObject, maxRetries - 1);
            } else {
                console.log(`Error in writing control-construct of ${nodeId} to elasticsearch.`);
            }
        }
    } catch (error) {
    }
    return false;
}

// Function to modify UUID to mountName+UUID
exports.modifyCCWithModifiedKeys = function (obj, mountName) {
    try {
        if (Array.isArray(obj)) {
            return obj.map(item => exports.modifyCCWithModifiedKeys(item, mountName));
        } else if (typeof obj === 'object' && obj !== null) {
            let newObj = {};
            for (const key in obj) {
                if (key === 'uuid' || key === 'local-id') {
                    newObj[key] = mountName + "+" + obj[key];
                } else {
                    newObj[key] = exports.modifyCCWithModifiedKeys(obj[key], mountName);
                }
            }
            return newObj;
        }
        return obj;
    } catch (error) {
        return obj;
    }
};

// This function modies modified CC to actual uuid and local-id
exports.modifyCCToActualKeys = function (obj, mountName) {
    try {
        if (Array.isArray(obj)) {
            return obj.map(item => exports.modifyCCToActualKeys(item, mountName));
        } else if (typeof obj === 'object' && obj !== null) {
            let newObj = {};
            for (const key in obj) {
                if (key === 'uuid' || key === 'local-id') {
                    if (typeof obj[key] === 'string' && obj[key].startsWith(mountName + "+")) {
                        newObj[key] = obj[key].substring((mountName + "+").length);
                    } else {
                        newObj[key] = obj[key];
                    }
                } else {
                    newObj[key] = exports.modifyCCToActualKeys(obj[key], mountName);
                }
            }
            return newObj;
        }
        return obj;
    } catch (error) {
        return obj;
    }
};

// formulate and return CC path of device for live
exports.getControlConstructPathForLive = async function (nodeId) {
    try {
        let controllerInternalPathToMountPoint = await utility.getStringValueForStringProfileNameAsync("controllerInternalPathToMountPoint");
        const forwardingName = "RequestForLiveControlConstructCausesReadingFromDeviceAndWritingIntoCache";
        const fc = await forwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
        let ccRetrievalFcPort = await forwardingConstruct.getFcPortAsync(fc["uuid"], '2000');
        if (ccRetrievalFcPort != undefined) {
            let operationName = await operationClient.getOperationNameAsync(ccRetrievalFcPort["logical-termination-point"]);
            let urlToGetCCFromController = operationName.replace("{controllerInternalPathToMountPoint}", controllerInternalPathToMountPoint).replace("{mountName}", nodeId);
            return urlToGetCCFromController;
        } else { return undefined }
    } catch (error) {
        console.error(`Error at retrieving live CC path from config file`);
        return undefined;
    }
}

// formulate and return CC path of device for cache
exports.getControlConstructPathForCache = async function (nodeId) {
    try {
        //let controllerInternalPathToMountPoint = await utility.getStringValueForStringProfileNameAsync("controllerInternalPathToMountPoint");
        const forwardingName = "RequestForCachedControlConstructCausesReadingFromCache";
        const fc = await forwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
        let ccRetrievalFcPort = await forwardingConstruct.getFcPortAsync(fc["uuid"], '1000');
        if (ccRetrievalFcPort != undefined) {
            let operationName = await operationServer.getOperationNameAsync(ccRetrievalFcPort["logical-termination-point"]);
            let finalUrl = operationName.replace("{mountName}", nodeId);
            return finalUrl;
        } else { return undefined }
    } catch (error) {
        console.error(`Error at retrieving cache CC path from config file`);
        return undefined;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
