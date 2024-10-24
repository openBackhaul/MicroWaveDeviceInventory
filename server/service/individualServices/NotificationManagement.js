const axios = require('axios');
const executionAndTraceService = require("onf-core-model-ap/applicationPattern/services/ExecutionAndTraceService");
const configConstants = require('./ConfigConstants');
const notificationConverter = require("./NotificationConverter");
const forwardingDomain = require("onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain");
const FcPort = require('onf-core-model-ap/applicationPattern/onfModel/models/FcPort');
const controlConstruct = require("onf-core-model-ap/applicationPattern/onfModel/models/ControlConstruct");
const tcpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpClientInterface');
const notificationStreamManagement = require('./NotificationStreamManagement');
const process = require('process');
const BasicServices = require("onf-core-model-ap-bs/basicServices/BasicServicesService");
const RequestHeader = require("onf-core-model-ap/applicationPattern/rest/client/RequestHeader");
const responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
const controllerManagement = require('./ControllerManagement');
const notificationManagement = require("./NotificationManagement");
const crypto = require("crypto");

const CONTROLLER_SUB_MODE_CONFIGURATION = "CONFIGURATION";
const CONTROLLER_SUB_MODE_OPERATIONAL = "OPERATIONAL";

let appInformation = null;

let lastSentMessages = [];

/**
 * Query and cache app information from the load file.
 * @returns appInformation with application-name and release-number
 */
exports.getAppInformation = async function() {
    if (!appInformation) {
        appInformation = {};

        try {
            appInformation = await BasicServices.informAboutApplication();
        } catch (exception) {
            console.log.error(exception, "no application information found, using fallback");
            appInformation["application-name"] = "MicroWaveDeviceInventory";
            appInformation["release-number"] = "1.0.0";
        }
    }

    return appInformation;
}

/**
 * Create a new request header.
 * @returns {RequestHeader}
 */
exports.createRequestHeader = function () {
    return new RequestHeader("MicroWaveDeviceInventory", "MicroWaveDeviceInventory", undefined, "1");
}

function cleanupOutboundNotificationCache() {
    let toRemoveElements = [];

    for (const lastSentMessage of lastSentMessages) {
        let differenceInTimestampMs = Date.now() - lastSentMessage.timeMs;

        //timeout from env - use 5 seconds as fallback
        let timespanMs = process.env['NOTIFICATION_DUPLICATE_TIMESPAN_MS'] ? process.env['NOTIFICATION_DUPLICATE_TIMESPAN_MS'] : 5000;

        if (differenceInTimestampMs > timespanMs) {
            toRemoveElements.push(lastSentMessage)
        }
    }

    //remove timed out elements
    lastSentMessages = lastSentMessages.filter((element) => toRemoveElements.includes(element) === false);
}

function checkNotificationDuplicate(notificationType, targetOperationURL, notificationMessage) {

    // "clone"
    let newComparisonNotificationMessage = JSON.parse(JSON.stringify(notificationMessage));
    //ignore timestamp and counter for comparison
    delete newComparisonNotificationMessage[Object.keys(newComparisonNotificationMessage)[0]]["timestamp"];
    delete newComparisonNotificationMessage[Object.keys(newComparisonNotificationMessage)[0]]["counter"];
    let newNotificationString = JSON.stringify(newComparisonNotificationMessage);

    for (const lastSentMessage of lastSentMessages) {
        // "clone"
        let oldComparisonNotificationMessage = JSON.parse(JSON.stringify(lastSentMessage.notification));
        //ignore timestamp and counter for comparison
        delete oldComparisonNotificationMessage[Object.keys(oldComparisonNotificationMessage)[0]]["timestamp"];
        delete oldComparisonNotificationMessage[Object.keys(oldComparisonNotificationMessage)[0]]["counter"];
        let oldNotificationString = JSON.stringify(oldComparisonNotificationMessage);

        if (newNotificationString === oldNotificationString &&
            lastSentMessage.type === notificationType &&
            lastSentMessage.targetOperationURL === targetOperationURL) {
            return true;
        }
    }

    return false;
}

/**
 * Trigger notification to subscriber with data
 * @param notificationType type of notification
 * @param targetOperationURL target url with endpoint where subscriber expects arrival of notifications
 * @param notificationMessage converted notification to send
 * @param operationKey
 */
async function sendMessageToSubscriber(notificationType, targetOperationURL, operationKey, notificationMessage) {

    cleanupOutboundNotificationCache();

    //check if same notification was sent more than once in certain timespan
    let isDuplicate = checkNotificationDuplicate(notificationType, targetOperationURL, notificationMessage);

    if (isDuplicate) {
        console.log.debug("notification duplicate ignored");
    } else {
        let sendingTimestampMs = Date.now();

        // "clone"
        let comparisonNotificationMessage = JSON.parse(JSON.stringify(notificationMessage));
        //ignore timestamp and counter for comparison
        delete comparisonNotificationMessage[Object.keys(comparisonNotificationMessage)[0]]["timestamp"];
        delete comparisonNotificationMessage[Object.keys(comparisonNotificationMessage)[0]]["counter"];

        let messageCacheEntry = {
            "targetOperationURL": targetOperationURL,
            "type": notificationType,
            "notification": comparisonNotificationMessage,
            "timeMs": sendingTimestampMs
        }
        lastSentMessages.push(messageCacheEntry);

        let appInformation = await exports.getAppInformation();

        let requestHeader = exports.createRequestHeader();

        let uniqueSendingID = crypto.randomUUID();

        //send notification
        console.log.debug("sending subscriber notification to: " + targetOperationURL + " with content: " + JSON.stringify(notificationMessage) + " - debugId: '" + uniqueSendingID + "'");

        axios.post(targetOperationURL, notificationMessage, {
            // axios.post("http://localhost:1237", notificationMessage, {
            headers: {
                'x-correlator': requestHeader.xCorrelator,
                'trace-indicator': requestHeader.traceIndicator,
                'user': requestHeader.user,
                'originator': requestHeader.originator,
                'customer-journey': requestHeader.customerJourney,
                'operation-key': operationKey
            }
        })
            .then((response) => {
                console.log.debug("subscriber-notification success, notificationType " + notificationType + ", target url: " + targetOperationURL + ", result status: " + response.status + " - debugId: '" + uniqueSendingID + "'");

                executionAndTraceService.recordServiceRequestFromClient(
                    appInformation["application-name"],
                    appInformation["release-number"],
                    requestHeader.xCorrelator,
                    requestHeader.traceIndicator,
                    requestHeader.user,
                    requestHeader.originator,
                    notificationType, //for example "notifications/device-alarms"
                    response.status,
                    notificationMessage,
                    response.data);
            })
            .catch(e => {
                console.log.error(e, "error during subscriber-notification for " + notificationType + " - debugId: '" + uniqueSendingID + "'");

                executionAndTraceService.recordServiceRequestFromClient(
                    appInformation["application-name"],
                    appInformation["release-number"],
                    requestHeader.xCorrelator,
                    requestHeader.traceIndicator,
                    requestHeader.user,
                    requestHeader.originator,
                    notificationType,
                    responseCodeEnum.code.INTERNAL_SERVER_ERROR,
                    notificationMessage,
                    e);
            });
    }
}

/**
 * @param oamPath path to subscribers for this use case, for example "notifications/device-alarms"
 * @returns list of subscriber objects or empty array
 */
exports.getActiveSubscribers = async function (oamPath) {

    let allForwardingConstructs = await forwardingDomain.getForwardingConstructListAsync();

    let callbackFilterName = configConstants.getForwardingName(oamPath);

    let subscribersForOamPath = [];

    //add fcPort for all forwarding constructs that notify subscribers
    for (const allForwardingConstruct of allForwardingConstructs) {
        let nameOfFC = allForwardingConstruct.name[1].value;
        if (callbackFilterName === nameOfFC) {

            let forwardingConstructInstance = await forwardingDomain.getForwardingConstructForTheForwardingNameAsync(
                nameOfFC);

            for (const singleFcPort of forwardingConstructInstance['fc-port']) {
                if (FcPort.portDirectionEnum.OUTPUT === singleFcPort['port-direction']) {

                    //get http, tcp and operationName of subscriber
                    let operationLTP = await controlConstruct.getLogicalTerminationPointAsync(singleFcPort['logical-termination-point']);
                    let httpUUID = operationLTP['server-ltp'][0];
                    let httpLTP = await controlConstruct.getLogicalTerminationPointAsync(httpUUID);
                    let tcpUUID = httpLTP['server-ltp'][0];
                    let tcpLTP = await controlConstruct.getLogicalTerminationPointAsync(tcpUUID);

                    let enumProtocol = tcpLTP['layer-protocol'][0]['tcp-client-interface-1-0:tcp-client-interface-pac']['tcp-client-interface-configuration']['remote-protocol'];
                    let stringProtocol = tcpClientInterface.getProtocolFromProtocolEnum(enumProtocol)[0];

                    let operation = operationLTP['layer-protocol'][0]['operation-client-interface-1-0:operation-client-interface-pac']['operation-client-interface-configuration']['operation-name'];
                    let port = tcpLTP['layer-protocol'][0]['tcp-client-interface-1-0:tcp-client-interface-pac']['tcp-client-interface-configuration']['remote-port'];
                    let address = tcpLTP['layer-protocol'][0]['tcp-client-interface-1-0:tcp-client-interface-pac']['tcp-client-interface-configuration']['remote-address'];

                    let targetOperationUrl = buildDeviceSubscriberOperationPath(stringProtocol, address, port, operation);
                    let operationKey = operationLTP['layer-protocol'][0]['operation-client-interface-1-0:operation-client-interface-pac']['operation-client-interface-configuration']['operation-key'];
                    let operationUUID = operationLTP['uuid'];
                    let operationName = operationLTP['layer-protocol'][0]['operation-client-interface-1-0:operation-client-interface-pac']['operation-client-interface-configuration']['operation-name'];

                    let subscriberDataWrapper = {
                        "targetOperationURL": targetOperationUrl,
                        "operationKey": operationKey,
                        "operationUUID": operationUUID,
                        "name": httpLTP['layer-protocol'][0]['http-client-interface-1-0:http-client-interface-pac']['http-client-interface-configuration']['application-name'],
                        "release": httpLTP['layer-protocol'][0]['http-client-interface-1-0:http-client-interface-pac']['http-client-interface-configuration']['release-number'],
                        "port": tcpLTP['layer-protocol'][0]['tcp-client-interface-1-0:tcp-client-interface-pac']['tcp-client-interface-configuration']['remote-port'],
                        "address": tcpLTP['layer-protocol'][0]['tcp-client-interface-1-0:tcp-client-interface-pac']['tcp-client-interface-configuration']['remote-address'],
                        "protocol": stringProtocol,
                        "operationName": operationName
                    }
                    subscribersForOamPath.push(subscriberDataWrapper);
                }
            }

            break;
        }
    }

    return subscribersForOamPath;
}

/**
 * Start controller subscribing chain to receive notifications from streams.
 *
 * @param registeredController
 * @param controllerSubscriptionMode
 * @returns {Promise<void>}
 */
async function registerControllerCallbackChain(registeredController, controllerSubscriptionMode) {

    let streamType;
    if (controllerSubscriptionMode === CONTROLLER_SUB_MODE_OPERATIONAL) {
        streamType = notificationStreamManagement.STREAM_TYPE_OPERATIONAL;
    } else {
        streamType = notificationStreamManagement.STREAM_TYPE_CONFIGURATION;
    }
    let streamActive = notificationStreamManagement.checkIfStreamIsActive(registeredController, streamType);

    if (streamActive === false) {
        let controllerAddress = notificationManagement.buildControllerTargetPath(
            registeredController.protocol,
            registeredController.address,
            registeredController.port
        );

        console.log.debug("starting controller stream step1: " + registeredController.name + " " + controllerSubscriptionMode);

        let user = process.env['CONTROLLER_USER'];
        let password = process.env['CONTROLLER_PASSWORD'];

        //step 1
        let streamNameForSubscription = await createControllerNotificationStream(
            controllerAddress,
            registeredController.operationKey,
            controllerSubscriptionMode,
            user, password
        );

        if (!streamNameForSubscription) {
            throw new Error('registerControllerCallbackChain: createControllerNotificationStream failed');
        }

        console.log.debug("starting controller stream step2: " + registeredController.name + " " + controllerSubscriptionMode);

        //step 2
        let streamLocation = await subscribeToControllerNotificationStream(
            controllerAddress,
            registeredController.operationKey,
            streamNameForSubscription,
            user, password
        );

        if (!streamLocation) {
            throw new Error('registerControllerCallbackChain: subscribeToControllerNotificationStream failed');
        }

        try {
            //step 3
            await listenToControllerNotifications(
                streamLocation,
                registeredController,
                controllerSubscriptionMode,
                user, password);

            console.log.debug("controller stream established");
        } catch (exception) {
            console.log.error("controller stream establishing failed");
            throw new Error('registerControllerCallbackChain: listenToControllerNotifications failed');
        }
    } else {
        console.log.warn("controller stream for " + registeredController.name + " already active");
    }
}

async function registerDeviceCallbackChain(registeredController) {

    console.log.debug("starting controller device stream: " + registeredController.name);

    let streamActive = notificationStreamManagement.checkIfStreamIsActive(registeredController, notificationStreamManagement.STREAM_TYPE_DEVICE);

    if (streamActive === false) {
        let controllerAddress = notificationManagement.buildControllerTargetPath(registeredController.protocol, registeredController.address, registeredController.port);

        let controllerTargetUrl = controllerAddress + configConstants.PATH_STREAM_DEVICE;
        let user = process.env['DEVICE_USER'];
        let password = process.env['DEVICE_PASSWORD'];

        await notificationStreamManagement.startStream(controllerTargetUrl, registeredController, handleDeviceNotification,
            notificationStreamManagement.STREAM_TYPE_DEVICE, user, password);
    } else {
        console.log.warn("device stream for " + registeredController.name + " already active");
    }
}

/**
 * @param registeredController contains all relevant controller
 * @param streamTypeArray contains all stream types which are to be connected
 * @return {Promise<boolean>} success of all connections
 */
exports.buildStreamsForController = async function (registeredController, streamTypeArray) {
    let success = true;

    console.log.debug("starting establishment of streams for controller: " + registeredController.name);

    //start registering for controller subscriptions (config, operation) and devices

    if (streamTypeArray.includes(notificationStreamManagement.STREAM_TYPE_CONFIGURATION)) {
        try {
            await registerControllerCallbackChain(registeredController, CONTROLLER_SUB_MODE_CONFIGURATION);
        } catch (exception) {
            console.log.error(exception, "error during registering CONFIGURATION callback");
            success = false;
        }
    }

    if (streamTypeArray.includes(notificationStreamManagement.STREAM_TYPE_OPERATIONAL)) {
        if (success) {
            try {
                await registerControllerCallbackChain(registeredController, CONTROLLER_SUB_MODE_OPERATIONAL);
            } catch (exception) {
                console.log.error(exception, "error during registering OPERATIONAL callback");
                success = false;
            }
        }
    }

    if (streamTypeArray.includes(notificationStreamManagement.STREAM_TYPE_DEVICE)) {
        if (success) {
            try {
                await registerDeviceCallbackChain(registeredController);
            } catch (exception) {
                console.log.error(exception, "error during registering DEVICE callback");
                success = false;
            }
        }
    }

    if (!success) {
        //shutdown all created streams for this controller
        await notificationStreamManagement.removeAllStreamsForController(registeredController.name, registeredController.release);
        console.log.debug("removed streams for controller " + registeredController.name);
    }

    return success;
}

/**
 * Start callback chain to subscribe to controller configurations, controller operations and device notifications
 *
 * PromptForListenToControllersCausesSubscribingForControllerConfigurationNotifications
 * PromptForListenToControllersCausesSubscribingForControllerOperationNotifications
 * PromptForListenToControllersCausesSubscribingForDeviceNotifications
 */



exports.buildControllerTargetPath = function (controllerProtocol, controllerAddress, controllerPort) {
    let addressPart;
    if (controllerAddress["domain-name"]) {
        addressPart = controllerAddress["domain-name"];
    } else {
        addressPart = controllerAddress["ip-address"]["ipv-4-address"];
    }

    return controllerProtocol
        + "://" + addressPart
        + ":" + controllerPort;
}

/**
 * Callback PromptForListenToControllersCausesSubscribingForControllerConfigurationNotifications – STEP1
 * Request stream-name for configuration subscriptions from controller
 *
 * @param controllerAddress base controller address, {protocol}://{url}:{port}
 * @param operationKey
 * @param controllerSubscriptionMode CONFIGURATION or OPERATIONAL
 * @param user controller login account
 * @param password controller login password
 * @return string: URL for subscription or null
 */
async function createControllerNotificationStream(controllerAddress, operationKey,
                                                  controllerSubscriptionMode,
                                                  user, password) {

    //for example http://{odlAddress}:{odlPort}/rests/operations/sal-remote:create-data-change-event-subscription
    let controllerTargetUrl = controllerAddress + configConstants.PATH_STREAM_CONTROLLER_STEP1;

    let payload;
    if (controllerSubscriptionMode === CONTROLLER_SUB_MODE_CONFIGURATION) {
        payload = {
            "input": {
                "path": "/network-topology:network-topology",
                "sal-remote-augment:datastore": "CONFIGURATION",
                "sal-remote-augment:scope": "SUBTREE",
                "sal-remote-augment:notification-output-type": "JSON"
            }
        };
    } else {
        //OPERATIONAL
        payload = {
            "input": {
                "path": "/network-topology:network-topology",
                "sal-remote-augment:datastore": "OPERATIONAL",
                "sal-remote-augment:scope": "SUBTREE",
                "sal-remote-augment:notification-output-type": "JSON"
            }
        };
    }


    console.log.debug("creating controller configuration stream on controller: " + controllerTargetUrl);

    let base64encodedData = Buffer.from(user + ':' + password).toString('base64');

    let appInformation = await exports.getAppInformation();

    let requestHeader = exports.createRequestHeader();

    //return streamName from post call
    // return await axios.post("http://localhost:1234", payload, {
    return await axios.post(controllerTargetUrl, payload, {
        headers: {
            'x-correlator': requestHeader.xCorrelator,
            'trace-indicator': requestHeader.traceIndicator,
            'user': requestHeader.user,
            'originator': requestHeader.originator,
            'customer-journey': requestHeader.customerJourney,
            'Authorization': 'Basic ' + base64encodedData
            // 'operation-key': operationKey,
        }
    })
        .then((response) => {
            console.log.debug("result " + response.status + " for controller configuration stream creation on url " + controllerTargetUrl);

            executionAndTraceService.recordServiceRequestFromClient(
                appInformation["application-name"],
                appInformation["release-number"],
                requestHeader.xCorrelator,
                requestHeader.traceIndicator,
                requestHeader.user,
                requestHeader.originator,
                "SubscribeToControllerNotificationsStep1",
                response.status,
                payload,
                response.data);

            try {
                // for example "{\"sal-remote:output\": {\"stream-name\": \"data-change-event-subscription/network-topology:network-topology/datastore=CONFIGURATION/scope=SUBTREE/JSON\"} }"
                return response.data["sal-remote:output"]["stream-name"];
            } catch (e) {
                console.log.error(e, "Getting stream-name from payload failed for target url " + controllerTargetUrl);
                return null;
            }
        })
        .catch(e => {
            console.log.error(e, "error during axios call for target url " + controllerTargetUrl);

            executionAndTraceService.recordServiceRequestFromClient(
                appInformation["application-name"],
                appInformation["release-number"],
                requestHeader.xCorrelator,
                requestHeader.traceIndicator,
                requestHeader.user,
                requestHeader.originator,
                "SubscribeToControllerNotificationsStep1",
                responseCodeEnum.code.INTERNAL_SERVER_ERROR,
                payload,
                e);

            return null;
        });
}

/**
 * @param controllerAddress
 * @param operationKey
 * @param streamNameForSubscription
 * @param user controller login account
 * @param password controller login password
 * @returns string URL for stream-location or null
 */
async function subscribeToControllerNotificationStream(
    controllerAddress,
    operationKey,
    streamNameForSubscription,
    user,
    password
) {

    //for example http://{odlAddress}:{odlPort}/rests/data/ietf-restconf-monitoring:restconf-state/streams/stream/{stream-name}
    let controllerTargetUrl =
        controllerAddress + configConstants.PATH_STREAM_CONTROLLER_STEP2 + streamNameForSubscription + "?changed-leaf-nodes-only=true";

    console.log.debug("subscribing to change-event stream of controller with path: " + controllerTargetUrl);

    let base64encodedData = Buffer.from(user + ':' + password).toString('base64');

    let appInformation = await exports.getAppInformation();

    let requestHeader = exports.createRequestHeader();

    //return streamLocation from get call
    // return await axios.get("http://localhost:1235" + "/rests/data/ietf-restconf-monitoring:restconf-state/streams/stream/" + streamNameForSubscription, { //local testing
    return await axios.get(controllerTargetUrl, {
        headers: {
            'x-correlator': requestHeader.xCorrelator,
            'trace-indicator': requestHeader.traceIndicator,
            'user': requestHeader.user,
            'originator': requestHeader.originator,
            'customer-journey': requestHeader.customerJourney,
            'Authorization': 'Basic ' + base64encodedData
        }
    })
        .then((response) => {
            console.log.debug("result " + response.status + " for controller configuration stream subscription on path " + controllerTargetUrl);

            executionAndTraceService.recordServiceRequestFromClient(
                appInformation["application-name"],
                appInformation["release-number"],
                requestHeader.xCorrelator,
                requestHeader.traceIndicator,
                requestHeader.user,
                requestHeader.originator,
                "SubscribeToControllerNotificationsStep2",
                response.status,
                null,
                response.data);

            try {
                // for example "{subscribe-to-notification:location": "/rests/notif/data-change-event-subscription/network-topology:network-topology/datastore=CONFIGURATION/scope=SUBTREE/JSON"}"
                return response.data["subscribe-to-notification:location"];
            } catch (e) {
                console.log.error(e, "Getting stream-name from payload failed for path " + controllerTargetUrl);
                return null;
            }
        })
        .catch(e => {
            console.log.error(e, "error during axios call for target path " + controllerTargetUrl);

            executionAndTraceService.recordServiceRequestFromClient(
                appInformation["application-name"],
                appInformation["release-number"],
                requestHeader.xCorrelator,
                requestHeader.traceIndicator,
                requestHeader.user,
                requestHeader.originator,
                "SubscribeToControllerNotificationsStep2",
                responseCodeEnum.code.INTERNAL_SERVER_ERROR,
                null,
                e);

            return null;
        });
}

/**
 * Handle inbound controller notification - message about status of controllers
 *
 * @param message inbound notification
 * @param controllerName
 * @param controllerRelease
 * @param controllerTargetUrl
 */
function handleControllerNotification(message, controllerName, controllerRelease, controllerTargetUrl) {

    let notificationString = message.toString();
    try {
        let notification = JSON.parse(notificationString);

        let notificationsToSend = notificationConverter.convertControllerNotification(notification, controllerName, controllerRelease);

        sendControllerNotification(notificationsToSend, controllerName, controllerTargetUrl);
    } catch (exception) {
        console.log.warn("count not parse notification - not json: '" + notificationString + "'")
    }
}

async function sendControllerNotification(notificationsToSend, controllerName, controllerTargetUrl) {
    for (const notificationsToSendElement of notificationsToSend) {
        let notificationType = notificationsToSendElement.subscriberNotificationType;
        let notificationMessage = notificationsToSendElement.notificationMessage;

        let activeSubscribers = await exports.getActiveSubscribers(notificationType);

        if (activeSubscribers.length > 0) {
            console.log.debug("starting notification of " + activeSubscribers.length + " subscribers for '" + notificationType
                + "', source-stream is " + controllerName + ": " + controllerTargetUrl);

            for (let subscriber of activeSubscribers) {
                sendMessageToSubscriber(notificationType, subscriber.targetOperationURL, subscriber.operationKey, notificationMessage);
            }
        } else {
            console.log.debug("no subscribers for " + notificationType + ", message discarded");
        }
    }
}

/**
 *  Start listening to registered stream for notifications from controllers.
 *
 * Callbacks:
 * PromptForListenToControllersCausesSubscribingForControllerConfigurationNotifications – STEP3
 * PromptForListenToControllersCausesSubscribingForControllerOperationNotifications – STEP3
 *
 * @param streamLocation stream location URL returned in step 2
 * @param registeredController
 * @param controllerSubscriptionMode
 * @param user
 * @param password
 */
async function listenToControllerNotifications(streamLocation, registeredController, controllerSubscriptionMode, user, password) {

    let streamType;
    if (controllerSubscriptionMode === CONTROLLER_SUB_MODE_CONFIGURATION) {
        streamType = notificationStreamManagement.STREAM_TYPE_CONFIGURATION;
    } else {
        streamType = notificationStreamManagement.STREAM_TYPE_OPERATIONAL;
    }

    await notificationStreamManagement.startStream(streamLocation, registeredController, handleControllerNotification,
        streamType, user, password);
}

/**
 * Handle inbound controller notification - message about status of device
 *
 * @param message inbound notification
 * @param controllerName
 * @param controllerRelease
 * @param controllerTargetUrl
 */
function handleDeviceNotification(message, controllerName, controllerRelease, controllerTargetUrl) {
    let notificationString = message.toString();
    try {
        let notification = JSON.parse(notificationString);

        if (notification["ietf-restconf:notification"]) {
            //get first key of sub-object
            let inboundNotificationTypeRaw = Object.keys(notification["ietf-restconf:notification"])[0];

            let subscriberNotificationType = null;
            if (inboundNotificationTypeRaw.includes("alarm-event-notification")) {
                subscriberNotificationType = configConstants.OAM_PATH_DEVICE_ALARMS;
            } else if (inboundNotificationTypeRaw.includes("attribute-value-changed-notification")) {
                subscriberNotificationType = configConstants.OAM_PATH_DEVICE_ATTR_VALUE_CHANGES;
            } else if (inboundNotificationTypeRaw.includes("object-creation-notification")) {
                subscriberNotificationType = configConstants.OAM_PATH_DEVICE_OBJECT_CREATIONS;
            } else if (inboundNotificationTypeRaw.includes("object-deletion-notification")) {
                subscriberNotificationType = configConstants.OAM_PATH_DEVICE_OBJECT_DELETIONS;
            } else {
                console.log.warn("notificationType unknown: " + inboundNotificationTypeRaw);
            }

            if (subscriberNotificationType) {
                notifyAllDeviceSubscribers(subscriberNotificationType, notification, controllerName, controllerRelease, controllerTargetUrl);
            }
        }
    } catch (exception) {
        console.log.warn("count not parse notification - not json: '" + notificationString + "'")
    }
}

/**
 * Notify subscribers of any NP subscription service of a new controller-notification
 *
 * @param deviceNotificationType type of subscription
 * @param controllerNotification inbound notification from controller
 * @param controllerName
 * @param controllerRelease
 * @param controllerTargetUrl
 */
async function notifyAllDeviceSubscribers(deviceNotificationType, controllerNotification, controllerName, controllerRelease, controllerTargetUrl) {
    let activeSubscribers = await exports.getActiveSubscribers(deviceNotificationType);

    if (activeSubscribers.length > 0) {
        console.log.debug("starting notification of " + activeSubscribers.length + " subscribers for '" + deviceNotificationType + "', source-stream is " + controllerName + " -> " + controllerTargetUrl);

        //build one notification for all subscribers
        let notificationMessage = notificationConverter.convertNotification(controllerNotification, deviceNotificationType, controllerName, controllerRelease);

        for (let subscriber of activeSubscribers) {
            sendMessageToSubscriber(deviceNotificationType, subscriber.targetOperationURL, subscriber.operationKey, notificationMessage);
        }
    } else {
        console.log.debug("no subscribers for " + deviceNotificationType + ", message discarded");
    }
}


/**
 * Builds operation path which is called when a notification is sent to subscribers
 * @returns {string} target url for callbacks provided by subscriber
 * @param subscribingApplicationProtocol protocol of application
 * @param subscribingApplicationAddress address of application
 * @param subscribingApplicationPort application port
 * @param notificationsReceivingOperation target url operation part
 */
function buildDeviceSubscriberOperationPath(subscribingApplicationProtocol,
                                            subscribingApplicationAddress,
                                            subscribingApplicationPort,
                                            notificationsReceivingOperation) {

    let addressPart;
    if (subscribingApplicationAddress["domain-name"]) {
        addressPart = subscribingApplicationAddress["domain-name"];
    } else {
        addressPart = subscribingApplicationAddress["ip-address"]["ipv-4-address"];
    }

    return subscribingApplicationProtocol
        + "://" + addressPart
        + ":" + subscribingApplicationPort
        + notificationsReceivingOperation;
}
