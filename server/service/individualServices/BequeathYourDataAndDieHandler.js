const notificationManagement = require("./NotificationManagement");
const configConstants = require("./ConfigConstants");
const axios = require('axios');

const HttpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpServerInterface');
const OperationServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationServerInterface');
const forwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const {stopCyclicProcess} = require('./CyclicProcessService/cyclicProcess');
const logger = require('../LoggingService.js').getLogger();

async function addSubscribersToNewRelease(appAddress, appPort) {

    try {
        let subscriberNotificationTypes = [
            configConstants.OAM_PATH_ATTRIBUTE_VALUE_CHANGES,
            configConstants.OAM_PATH_ATTRIBUTE_OBJECT_CREATIONS,
            configConstants.OAM_PATH_ATTRIBUTE_OBJECT_DELETIONS
        ];

        for (const subscriberNotificationType of subscriberNotificationTypes) {
            let activeSubscribers = await notificationManagement.getActiveSubscribers(subscriberNotificationType);

            for (const activeSubscriber of activeSubscribers) {
                let notificationMessage = {
                    "subscriber-application": activeSubscriber.name,
                    "subscriber-release-number": activeSubscriber.release,
                    "subscriber-operation": activeSubscriber.operationName,
                    "subscriber-protocol": activeSubscriber.protocol,
                    "subscriber-address": activeSubscriber.address,
                    "subscriber-port": activeSubscriber.port
                };

                let targetNewReleaseURL = notificationManagement.buildControllerTargetPath("http", appAddress, appPort) + subscriberNotificationType;
                let requestHeader = notificationManagement.createRequestHeader();

                const forwardingName = "RequestForLiveControlConstructCausesReadingFromDeviceAndWritingIntoCache";
                const forwardingConstruct = await forwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
                let prefix = forwardingConstruct.uuid.split('op')[0];
                const operationKey = await OperationServerInterface.getOperationKeyAsync(prefix + "op-s-is-020");

                await axios.post(targetNewReleaseURL, notificationMessage, {
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
                    logger.info("OLD -> NEW RELEASE tranferring ok.  (Type: " + subscriberNotificationType + "   name: " + activeSubscriber.name + ")");
                })
                .catch(e => {
                    logger.error("OLD -> NEW RELEASE tranferring error.  (Type: " + subscriberNotificationType + "   name: " + activeSubscriber.operationName + ")");
                });
            }
        }
        return true;
    } catch (error) {
        return false;
    }
}

async function endSubscriptionToNotificationProxy() {

    try {
        const {GetNotificationProxyData} = require( "../IndividualServicesService.js");
        npData = await GetNotificationProxyData();
        let targetNpURL = npData.tcpConn + npData.operationName;
        let requestHeader = notificationManagement.createRequestHeader();
        let applicationName = await HttpServerInterface.getApplicationNameAsync();
        let releaseNumber = await HttpServerInterface.getReleaseNumberAsync();
        let body = {
            "subscriber-application": applicationName,
            "subscriber-release-number": releaseNumber,
            "subscription": "/v1/subscription-to-be-stopped"
        }
        logger.info("OLD RELEASE --> NP  (URL: " + targetNpURL + "  App. Name: " + applicationName + "  Rel. Num: " + releaseNumber + ")....");
        await axios.post(targetNpURL, body, {
            headers: {
                'x-correlator': requestHeader.xCorrelator,
                'trace-indicator': requestHeader.traceIndicator,
                'user': requestHeader.user,
                'originator': requestHeader.originator,
                'customer-journey': requestHeader.customerJourney,
                'operation-key': npData.operationKey
            }
        })
        .then((response) => {
            logger.info("OLD RELEASE --> END SUBSCRIPTION TO NOTIFICATION-PROXY OK");
        })
        .catch(e => {
            logger.error("OLD RELEASE --> END SUBSCRIPTION TO NOTIFICATION-PROXY ERROR (" + e + ")");
        });
        return true;
    } catch (error) {
        return false;
    }
}

exports.handleRequest = async function (body, requestUrl) {

    let appName = body["new-application-name"];
    let appRelease = body["new-application-release"];
    let appAddress = body["new-application-address"];
    let appPort = body["new-application-port"];

    let success = await addSubscribersToNewRelease(appAddress, appPort);
    if (success) {
        success = await endSubscriptionToNotificationProxy();
        //cyclicProcess.stopCyclicProcess();

        stopCyclicProcess();
    }

    return success;
}

