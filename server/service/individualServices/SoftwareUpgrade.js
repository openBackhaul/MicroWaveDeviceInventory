/**
 * @file This module provides functionality to migrate the data from the current version to the next version. 
 * @module SoftwareUpgrade
 **/

const operationClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationClientInterface');
const logicalTerminationPoint = require('onf-core-model-ap/applicationPattern/onfModel/models/LogicalTerminationPoint');
const httpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpServerInterface');
const httpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpClientInterface');
const tcpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpClientInterface');
const ForwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const ForwardingConstruct = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingConstruct');
const onfAttributeFormatter = require('onf-core-model-ap/applicationPattern/onfModel/utility/OnfAttributeFormatter');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const FcPort = require('onf-core-model-ap/applicationPattern/onfModel/models/FcPort');
const eventDispatcher = require('onf-core-model-ap/applicationPattern/rest/client/eventDispatcher');
const logger = require('../LoggingService.js').getLogger();

const NOTIFY_APPROVALS_FD_NAME = 'PromptForBequeathingDataCausesRObeingRequestedToNotifyApprovalsOfNewApplicationsToNewRelease';
const NOTIFY_WITHDRAWN_APPROVALS_FD_NAME = 'PromptForBequeathingDataCausesRObeingRequestedToNotifyWithdrawnApprovalsToNewRelease';
var traceIndicatorIncrementer = 1;

/**
 * This method performs the set of procedure to transfer the data from this version to next version 
 * of the application and bring the new release official
 * @param {boolean} isdataTransferRequired represents true if data transfer is required
 * @param {String} newReleaseUuid UUID of new Release
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * @returns {Promise} Promise is resolved if the operation succeeded else the Promise is rejected
 * **/
exports.upgradeSoftwareVersion = async function (isdataTransferRequired, newReleaseUuid, user, xCorrelator, traceIndicator, customerJourney, _traceIndicatorIncrementer) {
    return new Promise(async function (resolve, reject) {
        try {
            if (_traceIndicatorIncrementer !== 0) {
                traceIndicatorIncrementer = _traceIndicatorIncrementer;
            }
            if (isdataTransferRequired) {
                await PromptForBequeathingDataCausesTransferOfListOfApplications(user, xCorrelator, traceIndicator, customerJourney);
            }
            await redirectNotificationNewRelease(newReleaseUuid, user, xCorrelator, traceIndicator, customerJourney);
            await replaceOldReleaseWithNewRelease(newReleaseUuid, user, xCorrelator, traceIndicator, customerJourney);
            resolve();
        } catch (error) {
            logger.error(error);
            reject(error);
        }
    });
}

/**
 * This method performs the set of procedure to redirect the notification to the new release
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * The following are the list of forwarding-construct that will be automated to redirect the notification 
 * to the new release and to end the existing subscription
 * 1. PromptForBequeathingDataCausesRObeingRequestedToNotifyApprovalsOfNewApplicationsToNewRelease
 * 2. PromptForBequeathingDataCausesRObeingRequestedToNotifyWithdrawnApprovalsToNewRelease
 * 3. PromptForBequeathingDataCausesRObeingRequestedToStopNotificationsToOldRelease
 */
async function redirectNotificationNewRelease(newReleaseUuid, user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            await PromptForBequeathingDataCausesRObeingRequestedToNotifyApprovalsOfNewApplicationsToNewRelease(newReleaseUuid, user, xCorrelator, traceIndicator, customerJourney);
            await PromptForBequeathingDataCausesRObeingRequestedToNotifyWithdrawnApprovalsToNewRelease(newReleaseUuid, user, xCorrelator, traceIndicator, customerJourney);
            await PromptForBequeathingDataCausesRObeingRequestedToStopNotificationsToOldRelease(user, xCorrelator, traceIndicator, customerJourney);
            resolve();
        } catch (error) {
            logger.error(error);
            reject(error);
        }
    });
}

/**
 * This method performs the set of procedure to replace the old release with the new release
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * The following are the list of forwarding-construct that will be automated to replace the old release with the new release
 * 1. PromptForBequeathingDataCausesRequestForBroadcastingInfoAboutServerReplacement
 * 2. PromptForBequeathingDataCausesRequestForDeregisteringOfOldRelease
 */
async function replaceOldReleaseWithNewRelease(newReleaseUuid, user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            await promptForBequeathingDataCausesRequestForBroadcastingInfoAboutServerReplacement(newReleaseUuid, user, xCorrelator, traceIndicator, customerJourney);
            await promptForBequeathingDataCausesRequestForDeregisteringOfOldRelease(newReleaseUuid, user, xCorrelator, traceIndicator, customerJourney);
            resolve();
        } catch (error) {
            logger.error(error);
            reject(error);
        }
    });
}

/**
 * Prepare attributes and automate PromptForBequeathingDataCausesTransferOfListOfApplications
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * @returns {Promise<boolean>} return true if the operation is success or else return false
 */
async function PromptForBequeathingDataCausesTransferOfListOfApplications(user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            let result = true;
            let forwardingKindNameOfTheBequeathOperation = "PromptForBequeathingDataCausesTransferOfListOfApplications";
            let inquiryForApplicationTypeApprovalFCName = "ApprovedApplicationCausesRequestForServiceRequestInformation";
            let forwardingConstructInstance = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(inquiryForApplicationTypeApprovalFCName);
            let operationClientUuidList = getFcPortOutputLogicalTerminationPointList(forwardingConstructInstance);

            for (let operationClientUuid of operationClientUuidList) {
                try {
                    let httpClientUuid = (await logicalTerminationPoint.getServerLtpListAsync(operationClientUuid))[0];
                    let tcpClientUuid = (await logicalTerminationPoint.getServerLtpListAsync(httpClientUuid))[0];
                    let requestBody = {};
                    requestBody.applicationName = await httpClientInterface.getApplicationNameAsync(httpClientUuid);
                    requestBody.releaseNumber = await httpClientInterface.getReleaseNumberAsync(httpClientUuid);
                    requestBody.address = await tcpClientInterface.getRemoteAddressAsync(tcpClientUuid);
                    requestBody.port = await tcpClientInterface.getRemotePortAsync(tcpClientUuid);
                    requestBody.protocol = await tcpClientInterface.getRemoteProtocolAsync(tcpClientUuid);
                    requestBody = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(requestBody);
                    result = await forwardRequest(
                        forwardingKindNameOfTheBequeathOperation,
                        requestBody,
                        user,
                        xCorrelator,
                        traceIndicator + "." + traceIndicatorIncrementer++,
                        customerJourney
                    );
                    if (!result) {
                        throw forwardingKindNameOfTheBequeathOperation + "forwarding is not success for the input" + JSON.stringify(requestBody);
                    }

                } catch (error) {
                    logger.error(error);
                    throw "operation is not success";
                }
            }
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Prepare attributes and automate PromptForBequeathingDataCausesRObeingRequestedToNotifyApprovalsOfNewApplicationsToNewRelease
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * @returns {Promise<boolean>} return true if the operation is success or else return false
 */
async function PromptForBequeathingDataCausesRObeingRequestedToNotifyApprovalsOfNewApplicationsToNewRelease(newReleaseUuid, user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            let result = true;
            try {
                let newReleaseTcpClientUuid = (await logicalTerminationPoint.getServerLtpListAsync(newReleaseUuid))[0];
                let requestBody = {};
                requestBody.subscriberApplication = await httpClientInterface.getApplicationNameAsync(newReleaseUuid);
                requestBody.subscriberReleaseNumber = await httpClientInterface.getReleaseNumberAsync(newReleaseUuid);
                requestBody.subscriberOperation = "/v1/regard-application";
                requestBody.subscriberProtocol = await tcpClientInterface.getRemoteProtocolAsync(newReleaseTcpClientUuid);
                requestBody.subscriberAddress = await tcpClientInterface.getRemoteAddressAsync(newReleaseTcpClientUuid);
                requestBody.subscriberPort = await tcpClientInterface.getRemotePortAsync(newReleaseTcpClientUuid);

                requestBody = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(requestBody);
                result = await forwardRequest(
                    NOTIFY_APPROVALS_FD_NAME,
                    requestBody,
                    user,
                    xCorrelator,
                    traceIndicator + "." + traceIndicatorIncrementer++,
                    customerJourney
                );
                if (!result) {
                    throw NOTIFY_APPROVALS_FD_NAME + "forwarding is not success for the input" + JSON.stringify(requestBody);
                }
            } catch (error) {
                logger.error(error);
                throw "operation is not success";
            }

            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Prepare attributes and automate PromptForBequeathingDataCausesRObeingRequestedToNotifyWithdrawnApprovalsToNewRelease<br>
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * @returns {Promise<boolean>} return true if the operation is success or else return false
 */
async function PromptForBequeathingDataCausesRObeingRequestedToNotifyWithdrawnApprovalsToNewRelease(newReleaseUuid, user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            let result = true;
            try {
                let newReleaseTcpClientUuid = (await logicalTerminationPoint.getServerLtpListAsync(newReleaseUuid))[0];
                let requestBody = {};
                requestBody.subscriberApplication = await httpClientInterface.getApplicationNameAsync(newReleaseUuid);
                requestBody.subscriberReleaseNumber = await httpClientInterface.getReleaseNumberAsync(newReleaseUuid);
                requestBody.subscriberOperation =  "/v1/disregard-application";
                requestBody.subscriberProtocol = await tcpClientInterface.getRemoteProtocolAsync(newReleaseTcpClientUuid);
                requestBody.subscriberAddress = await tcpClientInterface.getRemoteAddressAsync(newReleaseTcpClientUuid);
                requestBody.subscriberPort = await tcpClientInterface.getRemotePortAsync(newReleaseTcpClientUuid);
                requestBody = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(requestBody);
                result = await forwardRequest(
                    NOTIFY_WITHDRAWN_APPROVALS_FD_NAME,
                    requestBody,
                    user,
                    xCorrelator,
                    traceIndicator + "." + traceIndicatorIncrementer++,
                    customerJourney
                );
                if (!result) {
                    throw NOTIFY_WITHDRAWN_APPROVALS_FD_NAME + "forwarding is not success for the input" + JSON.stringify(requestBody);
                }
            } catch (error) {
                logger.error(error);
                throw "operation is not success";
            }

            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Prepare attributes and automate PromptForBequeathingDataCausesRObeingRequestedToStopNotificationsToOldRelease
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * @returns {Promise<boolean>} return true if the operation is success or else return false
 */
async function PromptForBequeathingDataCausesRObeingRequestedToStopNotificationsToOldRelease(user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            let result = true;
            let forwardingKindNameOfTheBequeathOperation = "PromptForBequeathingDataCausesRObeingRequestedToStopNotificationsToOldRelease";

            let listOfOperationToBeUnsubscribed = [];
            listOfOperationToBeUnsubscribed.push((await getOperationNamesOutOfForwardingKindNameAsync(NOTIFY_APPROVALS_FD_NAME))[0]);
            listOfOperationToBeUnsubscribed.push((await getOperationNamesOutOfForwardingKindNameAsync(NOTIFY_WITHDRAWN_APPROVALS_FD_NAME))[0]);
            try {
                for (let subscriptionName of listOfOperationToBeUnsubscribed) {
                    let requestBody = {};
                    requestBody.subscriberApplication = await httpServerInterface.getApplicationNameAsync();
                    requestBody.subscriberReleaseNumber = await httpServerInterface.getReleaseNumberAsync();
                    requestBody.subscription = subscriptionName;
                    requestBody = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(requestBody);
                    result = await forwardRequest(
                        forwardingKindNameOfTheBequeathOperation,
                        requestBody,
                        user,
                        xCorrelator,
                        traceIndicator + "." + traceIndicatorIncrementer++,
                        customerJourney
                    );
                    if (!result) {
                        throw forwardingKindNameOfTheBequeathOperation + "forwarding is not success for the input" + JSON.stringify(requestBody);
                    }
                }

            } catch (error) {
                logger.error(error);
                throw "operation is not success";
            }

            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Prepare attributes and automate PromptForBequeathingDataCausesRequestForBroadcastingInfoAboutServerReplacement<br>
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * @returns {Promise<boolean>} return true if the operation is success or else return false
 */
async function promptForBequeathingDataCausesRequestForBroadcastingInfoAboutServerReplacement(newReleaseUuid, user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            let result = true;
            let forwardingKindNameOfTheBequeathOperation = "PromptForBequeathingDataCausesRequestForBroadcastingInfoAboutServerReplacement";
            try {
                let newReleaseTcpClientUuid = (await logicalTerminationPoint.getServerLtpListAsync(newReleaseUuid))[0];
                let requestBody = {};
                requestBody.currentApplicationName = await httpServerInterface.getApplicationNameAsync();
                requestBody.currentReleaseNumber = await httpServerInterface.getReleaseNumberAsync();
                requestBody.futureApplicationName = await httpClientInterface.getApplicationNameAsync(newReleaseUuid);
                requestBody.futureReleaseNumber = await httpClientInterface.getReleaseNumberAsync(newReleaseUuid);
                requestBody.futureProtocol = await tcpClientInterface.getRemoteProtocolAsync(newReleaseTcpClientUuid);
                requestBody.futureAddress = await tcpClientInterface.getRemoteAddressAsync(newReleaseTcpClientUuid);
                requestBody.futurePort = await tcpClientInterface.getRemotePortAsync(newReleaseTcpClientUuid);
                requestBody = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(requestBody);
                result = await forwardRequest(
                    forwardingKindNameOfTheBequeathOperation,
                    requestBody,
                    user,
                    xCorrelator,
                    traceIndicator + "." + traceIndicatorIncrementer++,
                    customerJourney
                );
                if (!result) {
                    throw forwardingKindNameOfTheBequeathOperation + "forwarding is not success for the input" + JSON.stringify(requestBody);
                }

            } catch (error) {
                logger.error(error);
                throw "operation is not success";
            }

            resolve(result);
        } catch (error) {
            logger.error(error);
            reject(error);
        }
    });
}

/**
 * Prepare attributes and automate PromptForBequeathingDataCausesRequestForDeregisteringOfOldRelease<br>
 * @param {String} user User identifier from the system starting the service call
 * @param {String} xCorrelator UUID for the service execution flow that allows to correlate requests and responses
 * @param {String} traceIndicator Sequence of request numbers along the flow
 * @param {String} customerJourney Holds information supporting customer’s journey to which the execution applies
 * @returns {Promise<boolean>} return true if the operation is success or else return false
 */
async function promptForBequeathingDataCausesRequestForDeregisteringOfOldRelease(newReleaseUuid, user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            let result = true;
            let forwardingKindNameOfTheBequeathOperation = "PromptForBequeathingDataCausesRequestForDeregisteringOfOldRelease";
            try {
                let oldReleaseNumber = await httpServerInterface.getReleaseNumberAsync();
                let newReleaseNumber = await httpClientInterface.getReleaseNumberAsync(newReleaseUuid);
                if (oldReleaseNumber != newReleaseNumber) {
                    let requestBody = {};
                    requestBody.applicationName = await httpServerInterface.getApplicationNameAsync();
                    requestBody.releaseNumber = oldReleaseNumber;
                    requestBody = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(requestBody);
                    result = await forwardRequest(
                        forwardingKindNameOfTheBequeathOperation,
                        requestBody,
                        user,
                        xCorrelator,
                        traceIndicator + "." + traceIndicatorIncrementer++,
                        customerJourney
                    );
                    if (!result) {
                        throw forwardingKindNameOfTheBequeathOperation + "forwarding is not success for the input" + JSON.stringify(requestBody);
                    }
                }
            } catch (error) {
                logger.error(error);
                throw "operation is not success";
            }

            resolve(result);
        } catch (error) {
            logger.error(error);
            reject(error);
        }
    });
}

/****************************************************************************************
 * Functions utilized by software upgrade
 ****************************************************************************************/
async function getOperationNamesOutOfForwardingKindNameAsync(forwardingKindNameOfTheBequeathOperation) {
    let operationNamesList = [];
    let forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingKindNameOfTheBequeathOperation);
    let filteredFcPorts = await ForwardingConstruct.getOutputFcPortsAsync(forwardingConstruct.uuid);
    for (let fcOutputPort of filteredFcPorts) {
        let operationName = await operationClientInterface.getOperationNameAsync(fcOutputPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
        operationNamesList.push(operationName);
    }
    return operationNamesList;
}

function getFcPortOutputLogicalTerminationPointList(forwardingConstructInstance) {
    let fcPortOutputLogicalTerminationPointList = [];
    let fcPortList = forwardingConstructInstance[
        onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
    for (let i = 0; i < fcPortList.length; i++) {
        let fcPort = fcPortList[i];
        let fcPortPortDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
        if (fcPortPortDirection == FcPort.portDirectionEnum.OUTPUT) {
            let fclogicalTerminationPoint = fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT];
            fcPortOutputLogicalTerminationPointList.push(fclogicalTerminationPoint);
        }
    }
    return fcPortOutputLogicalTerminationPointList;
}

/**
 * @description This function automates the forwarding construct by calling the appropriate call back operations based on the fcPort input and output directions.
 * @param {String} forwardingKindName
 * @param {list}   attributeList list of attributes required during forwarding construct automation(to send in the request body)
 * @param {String} user user who initiates this request
 * @param {string} originator originator of the request
 * @param {string} xCorrelator flow id of this request
 * @param {string} traceIndicator trace indicator of the request
 * @param {string} customerJourney customer journey of the request
 **/
function forwardRequest(forwardingKindName, attributeList, user, xCorrelator, traceIndicator, customerJourney) {
    return new Promise(async function (resolve, reject) {
        try {
            let forwardingConstructInstance = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingKindName);
            let operationClientUuid = (getFcPortOutputLogicalTerminationPointList(forwardingConstructInstance))[0];
            let result = await eventDispatcher.dispatchEvent(
                operationClientUuid,
                attributeList,
                user,
                xCorrelator,
                traceIndicator,
                customerJourney
            );
            resolve(result);
        } catch (error) {
            logger.error(error);
            reject(error);
        }
    });
}
