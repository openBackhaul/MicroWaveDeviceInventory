'use strict';
const forwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const forwardingConstruct = require("onf-core-model-ap/applicationPattern/onfModel/models/ForwardingConstruct");
const operationClient = require("onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationClientInterface");
const operationServer = require("onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationServerInterface");
const RestClient = require('../../rest/client/dispacher');
const utility = require('../../utility');

exports.processControlConstructRequest = async function () {
    try {

    } catch (error) {
        console.error(`Error at node: ${nodeId}`)
        console.log(error);
    }

}

exports.getLiveControlConstructOfDeviceFromController = async function (nodeId) {
    let controlConstructFromController = {};
    try {
        const finalUrl = common[0].tcpConn + await exports.getControlConstructPathForLive(nodeId);
        const Authorization = common[0].key;
        const result = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization);
        if (result.status == 200) {
            controlConstructFromController = result["data"]["network-topology:topology"][0].node;
        } else {
            // handle cache data and return
        }
    } catch (error) {
        console.error(`Error at receiving CC for node: ${nodeId} from live`)
        console.log(error);
    }
}

exports.getControlConstructOfDeviceFromES = async function () {
    try {

    } catch (error) {
        console.error(`Error at receiving CC for node: ${nodeId} from ES`)
        console.log(error);
    }
}

exports.addControlConstructOfDeviceToES = async function () {
    try {

    } catch (error) {
        console.error(`Error at adding CC to ES for node: ${nodeId}`)
        console.log(error);
    }
}

exports.deleteControlConstructOfDeviceFromES = async function () {
    try {

    } catch (error) {
        console.error(`Error at deleting CC from ES for node: ${nodeId}`)
        console.log(error);
    }
}

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
        console.log(error);
        return undefined;
    }
}

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
        console.log(error);
        return undefined;
    }
}