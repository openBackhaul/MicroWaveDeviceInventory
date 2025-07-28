const configConstants = require('./ConfigConstants');
const logicalTerminationPointServices = require("onf-core-model-ap/applicationPattern/onfModel/services/LogicalTerminationPointServices");
const LogicalTerminationPointConfigurationInput = require("onf-core-model-ap/applicationPattern/onfModel/services/models/logicalTerminationPoint/ConfigurationInput");
const TcpObject = require("onf-core-model-ap/applicationPattern/onfModel/services/models/TcpObject");
const forwardingConstruct = require("onf-core-model-ap/applicationPattern/onfModel/models/ForwardingConstruct");
const forwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const httpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpClientInterface');
const individualServicesOperationsMapping = require('./IndividualServicesOperationsMapping');
const notificationStreamManagement = require('./NotificationStreamManagement');
const fcPort = require('onf-core-model-ap/applicationPattern/onfModel/models/FcPort');
const controlConstructUtils = require('./ControlConstructUtil');
const FcPort = require("onf-core-model-ap/applicationPattern/onfModel/models/FcPort");
const controlConstruct = require("onf-core-model-ap/applicationPattern/onfModel/models/ControlConstruct");
const tcpClientInterface = require("onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpClientInterface");

/**
 * @param nameOfFc fcport name
 * @param applicationHttpClientUuid
 * @return list of operation names for fc port (input direction)
 */
async function getOperationUUIDsForFcPort(nameOfFc, applicationHttpClientUuid) {

    let operationNameList = [];
    switch (nameOfFc) {
        case configConstants.OPERATION_SUB_NOTIF_CONTROLLER_CHANGED_ATTR:
        case configConstants.OPERATION_SUB_NOTIF_CONTROLLER_OBJ_CREATION:
        case configConstants.OPERATION_SUB_NOTIF_CONTROLLER_OBJ_DELETION:
            //"np-1-0-0-op-c-is-odl1-4-0-2-002" -> "/rests/notif/data-change-event-subscription/network-topology:network-topology/datastore=CONFIGURATION/scope=SUBTREE/JSON"
            //"np-1-0-0-op-c-is-odl1-4-0-2-004" -> "/rests/notif/data-change-event-subscription/network-topology:network-topology/datastore=OPERATIONAL/scope=SUBTREE/JSON"
            operationNameList.push("/rests/notif/data-change-event-subscription/network-topology:network-topology/datastore=CONFIGURATION/scope=SUBTREE/JSON");
            operationNameList.push("/rests/notif/data-change-event-subscription/network-topology:network-topology/datastore=OPERATIONAL/scope=SUBTREE/JSON");
            break;
        case configConstants.OPERATION_SUB_NOTIF_DEVICE_ALARMS:
        case configConstants.OPERATION_SUB_NOTIF_DEVICE_CHANGED_ATTR:
        case configConstants.OPERATION_SUB_NOTIF_DEVICE_OBJ_CREATION:
        case configConstants.OPERATION_SUB_NOTIF_DEVICE_OBJ_DELETION:
            //"np-1-0-0-op-c-is-odl1-4-0-2-005" -> "/rests/notif/device?notificationType=device"
            operationNameList.push(configConstants.PATH_STREAM_DEVICE);
            break;
        default:
            break;
    }

    let operationUUIDs = [];
    for (const operationNameListElement of operationNameList) {
        //get operation-ids by name
        let operationLTPs = await controlConstructUtils.getLogicalTerminationPointsAsync(operationNameListElement, applicationHttpClientUuid);
        for (const operationLTP of operationLTPs) {
            operationUUIDs.push(operationLTP.uuid);
        }
    }

    return operationUUIDs;
}

async function logActiveControllers() {
    let uniqueControllerUUIDs = await exports.findRelevantControllers();
    let listOfActiveControllers = await exports.fetchControllerData(uniqueControllerUUIDs);
    let activeControllerLog = "";
    for (const activeController of listOfActiveControllers) {
        activeControllerLog += activeController.name + "/" + activeController.release + ", ";
    }
    console.info("active controllers: " + activeControllerLog);
}

/**
 * Add a controller which will be source for notifications which can be subscribed to.
 * The same controller can only be registered once.
 *
 * "Creates Tcp-, Http- and OperationClients of additional ODLn from OdlTemplate and adds FcPorts to the FCs of the callbacks section"
 *
 * @param inputControllerName name of controller to register
 * @param inputControllerRelease release of controller
 * @param controllerProtocol target url protocol
 * @param controllerAddress address for target url
 * @param controllerPort port for target url
 * @returns {Promise<Boolean|boolean>} indicates if subscriber was added to database
 */
exports.registerController = async function (inputControllerName, inputControllerRelease, controllerProtocol, controllerAddress, controllerPort) {

    try {

        let operationNamesByAttributes = new Map();
        //PromptForListenToControllersCausesSubscribingForControllerConfigurationNotifications step1
        //PromptForListenToControllersCausesSubscribingForControllerOperationNotifications step1
        operationNamesByAttributes.set(configConstants.PATH_STREAM_CONTROLLER_STEP1, configConstants.PATH_STREAM_CONTROLLER_STEP1);
        //PromptForListenToControllersCausesSubscribingForControllerConfigurationNotifications step2
        operationNamesByAttributes.set("/rests/data/ietf-restconf-monitoring:restconf-state/streams/stream/data-change-event-subscription/network-topology:network-topology/datastore=CONFIGURATION/scope=SUBTREE/JSON?changed-leaf-nodes-only=true",
            "/rests/data/ietf-restconf-monitoring:restconf-state/streams/stream/data-change-event-subscription/network-topology:network-topology/datastore=CONFIGURATION/scope=SUBTREE/JSON?changed-leaf-nodes-only=true");
        //PromptForListenToControllersCausesSubscribingForControllerConfigurationNotifications step3
        operationNamesByAttributes.set("/rests/notif/data-change-event-subscription/network-topology:network-topology/datastore=CONFIGURATION/scope=SUBTREE/JSON",
            "/rests/notif/data-change-event-subscription/network-topology:network-topology/datastore=CONFIGURATION/scope=SUBTREE/JSON");
        //PromptForListenToControllersCausesSubscribingForControllerOperationNotifications step2
        operationNamesByAttributes.set("/rests/data/ietf-restconf-monitoring:restconf-state/streams/stream/data-change-event-subscription/network-topology:network-topology/datastore=OPERATIONAL/scope=SUBTREE/JSON?changed-leaf-nodes-only=true",
            "/rests/data/ietf-restconf-monitoring:restconf-state/streams/stream/data-change-event-subscription/network-topology:network-topology/datastore=OPERATIONAL/scope=SUBTREE/JSON?changed-leaf-nodes-only=true");
        //PromptForListenToControllersCausesSubscribingForControllerOperationNotifications step3
        operationNamesByAttributes.set("/rests/notif/data-change-event-subscription/network-topology:network-topology/datastore=OPERATIONAL/scope=SUBTREE/JSON",
            "/rests/notif/data-change-event-subscription/network-topology:network-topology/datastore=OPERATIONAL/scope=SUBTREE/JSON");
        //PromptForListenToControllersCausesSubscribingForDeviceNotifications
        operationNamesByAttributes.set(configConstants.PATH_STREAM_DEVICE, configConstants.PATH_STREAM_DEVICE);


        let tcpObjectList = [];
        let tcpObject = new TcpObject(controllerProtocol, controllerAddress, controllerPort);
        tcpObjectList.push(tcpObject);

        let httpClientUuid = await httpClientInterface.getHttpClientUuidExcludingOldReleaseAndNewRelease(
            inputControllerName, inputControllerRelease, "not used"
        );
        let logicalTerminationPointConfigurationInput = new LogicalTerminationPointConfigurationInput(
            httpClientUuid,
            inputControllerName,
            inputControllerRelease,
            tcpObjectList,
            "NotificationProxyOperation",
            operationNamesByAttributes,
            individualServicesOperationsMapping.individualServicesOperationsMapping
        );

        let ltpConfigurationStatus = await logicalTerminationPointServices.createOrUpdateApplicationLtpsAsync(
            logicalTerminationPointConfigurationInput, false
        );

        if (httpClientUuid === undefined) {
            //get uuid of newly created application httpclient
            httpClientUuid = ltpConfigurationStatus.httpClientConfigurationStatus.uuid;
        }

        //get all forwardConstructs
        let allForwardingConstructs = await forwardingDomain.getForwardingConstructListAsync();

        let allForwardConstructsToUpdateNames = configConstants.getAllForwardConstructNamesToUpdate();

        //add fcPort for all forwarding constructs that notify subscribers
        for (const allForwardingConstruct of allForwardingConstructs) {
            for (const fcConstructName of allForwardingConstruct.name) {
                if (fcConstructName["value-name"] === "ForwardingName") {
                    let nameOfFC = fcConstructName.value;
                    if (allForwardConstructsToUpdateNames.includes(nameOfFC)) {

                        let forwardingConstructInstance = await forwardingDomain.getForwardingConstructForTheForwardingNameAsync(
                            nameOfFC);

                        let operationUUIDs = await getOperationUUIDsForFcPort(nameOfFC, httpClientUuid);

                        for (const operationUUID of operationUUIDs) {
                            let fcPortExists = forwardingConstruct.isFcPortExists(forwardingConstructInstance, operationUUID);

                            if (fcPortExists === false) {
                                let nextFcPortLocalId = fcPort.generateNextLocalId(forwardingConstructInstance);

                                //add PORT_DIRECTION_TYPE_INPUT fcPort - information should be received from controller for forwardConstruct
                                const newFcPort = {
                                    "local-id": nextFcPortLocalId,
                                    "port-direction": "core-model-1-4:PORT_DIRECTION_TYPE_INPUT",
                                    "logical-termination-point": operationUUID
                                };

                                let successFc = await forwardingConstruct.addFcPortAsync(forwardingConstructInstance.uuid, newFcPort);
                                if (!successFc) {
                                    console.error("addFcPortAsync failed for operationUUID=" + operationUUID);
                                }
                            }
                        }
                    }
                }
            }
        }

        await logActiveControllers();

        return true;

    } catch (exception) {
        console.error(exception);
        return false;
    }
}


/**
 * Removes a controller.
 *
 * @param inputControllerName name of controller to register
 * @param inputControllerRelease release of controller
 */
exports.deregisterController = async function (inputControllerName, inputControllerRelease) {
    try {
        //find controller
        let httpClientUuid = await httpClientInterface.getHttpClientUuidExcludingOldReleaseAndNewRelease(
            inputControllerName, inputControllerRelease, "not used"
        );

        if (httpClientUuid) {
            //stop active notification handling streams for this application
            await notificationStreamManagement.removeAllStreamsForController(inputControllerName, inputControllerRelease);

            //remove all FcPorts still in database for this application
            let success = await controlConstructUtils.deleteAllFcPortsForApplication(httpClientUuid);

            if (!success) {
                throw new Error("FcPort cleaning failed");
            }

            //delete all linked LTPs from config
            await logicalTerminationPointServices.deleteApplicationLtpsAsync(httpClientUuid);
        }

        await logActiveControllers();

        return true;
    } catch (exception) {
        console.error(exception, "deregisterController failed with name " + inputControllerName);
        return false;
    }
}

exports.findRelevantControllers = async function() {

    let allForwardingConstructs = await forwardingDomain.getForwardingConstructListAsync();

    let forwardConstructsToStartStreamsFor = configConstants.getAllForwardConstructNamesToUpdate();

    let relevantControllersUUIDList = [];

    //identify relevant controllers by fcPorts that notify subscribers
    for (const allForwardingConstruct of allForwardingConstructs) {
        let nameOfFC = allForwardingConstruct.name[1].value;
        if (forwardConstructsToStartStreamsFor.includes(nameOfFC)) {
            for (const singleFcPort of allForwardingConstruct["fc-port"]) {
                if (FcPort.portDirectionEnum.INPUT === singleFcPort['port-direction']) {
                    relevantControllersUUIDList.push(singleFcPort['logical-termination-point']);
                }
            }
        }
    }

    let uniqueControllerUUIDs = [...new Set(relevantControllersUUIDList)];
    return uniqueControllerUUIDs;
}

exports.fetchControllerData = async function(uniqueControllerUUIDs) {
    let controllers = [];
    for (const uniqueControllerUUID of uniqueControllerUUIDs) {
        let controllerDataWrapper = await requestControllerConfigData(uniqueControllerUUID);

        //prevent duplicate controllers in list
        let found = false;
        for (const controllerDataWrapperElement of controllers) {
            if (controllerDataWrapperElement.name === controllerDataWrapper.name &&
                controllerDataWrapperElement.release === controllerDataWrapper.release) {
                found = true;
            }
        }

        if (found === false) {
            controllers.push(controllerDataWrapper);
        }
    }
    return controllers;
}

async function requestControllerConfigData(uniqueControllerUUID) {
    let operationLTP = await controlConstruct.getLogicalTerminationPointAsync(uniqueControllerUUID);
    let httpUUID = operationLTP['server-ltp'][0];
    let httpLTP = await controlConstruct.getLogicalTerminationPointAsync(httpUUID);
    let tcpUUID = httpLTP['server-ltp'][0];
    let tcpLTP = await controlConstruct.getLogicalTerminationPointAsync(tcpUUID);

    let enumProtocol = tcpLTP['layer-protocol'][0]['tcp-client-interface-1-0:tcp-client-interface-pac']['tcp-client-interface-configuration']['remote-protocol'];
    let stringProtocol = tcpClientInterface.getProtocolFromProtocolEnum(enumProtocol)[0];

    let operationKey = operationLTP['layer-protocol'][0]['operation-client-interface-1-0:operation-client-interface-pac']['operation-client-interface-configuration']['operation-key'];
    let operationUUID = operationLTP['uuid'];

    let controllerDataWrapper = {
        "name": httpLTP['layer-protocol'][0]['http-client-interface-1-0:http-client-interface-pac']['http-client-interface-configuration']['application-name'],
        "release": httpLTP['layer-protocol'][0]['http-client-interface-1-0:http-client-interface-pac']['http-client-interface-configuration']['release-number'],
        "port": tcpLTP['layer-protocol'][0]['tcp-client-interface-1-0:tcp-client-interface-pac']['tcp-client-interface-configuration']['remote-port'],
        "address": tcpLTP['layer-protocol'][0]['tcp-client-interface-1-0:tcp-client-interface-pac']['tcp-client-interface-configuration']['remote-address'],
        "protocol": stringProtocol,
        "operationKey": operationKey,
        "operationUUID": operationUUID
    }
    return controllerDataWrapper;
}