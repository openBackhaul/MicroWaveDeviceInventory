const ForwardingConstructAutomationInput = require('onf-core-model-ap/applicationPattern/onfModel/services/models/forwardingConstruct/AutomationInput');
const TcpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpServerInterface');
const onfFormatter = require('onf-core-model-ap/applicationPattern/onfModel/utility/OnfAttributeFormatter');
const HttpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpServerInterface');
const prepareALTForwardingAutomation = require('onf-core-model-ap-bs/basicServices/services/PrepareALTForwardingAutomation');

exports.regardApplication = function (applicationLayerTopologyForwardingInputList, applicationName, releaseNumber) {
    return new Promise(async function (resolve, reject) {
        let forwardingConstructAutomationList = [];
        try {
            /********************************************************************************************************
             * NewApplicationCausesRequestForredirectServiceRequestApprovals /v1/redirect-service-request-information
             ********************************************************************************************************/
            let redirectServiceRequestForwardingName = "ApprovedApplicationCausesRequestForServiceRequestInformation";
            let redirectServiceRequestContext = applicationName + releaseNumber;
            let redirectServiceRequestRequestBody = {};
            redirectServiceRequestRequestBody.serviceLogApplication = await HttpServerInterface.getApplicationNameAsync();
            redirectServiceRequestRequestBody.serviceLogApplicationReleaseNumber = await HttpServerInterface.getReleaseNumberAsync();
            redirectServiceRequestRequestBody.serviceLogOperation = "/v1/record-service-request";
            redirectServiceRequestRequestBody.serviceLogAddress = await TcpServerInterface.getLocalAddressForForwarding();
            redirectServiceRequestRequestBody.serviceLogPort = await TcpServerInterface.getLocalPort();
            redirectServiceRequestRequestBody.serviceLogProtocol = await TcpServerInterface.getLocalProtocol();
            redirectServiceRequestRequestBody = onfFormatter.modifyJsonObjectKeysToKebabCase(redirectServiceRequestRequestBody);
            let forwardingAutomation = new ForwardingConstructAutomationInput(
                redirectServiceRequestForwardingName,
                redirectServiceRequestRequestBody,
                redirectServiceRequestContext
            );
            forwardingConstructAutomationList.push(forwardingAutomation);
            resolve(forwardingConstructAutomationList.concat(applicationLayerTopologyForwardingInputList));
        } catch (error) {
            reject(error);
        }
    });
}

exports.OAMLayerRequest = function (uuid) {
    return new Promise(async function (resolve, reject) {
        try {
            let applicationLayerTopologyForwardingInputList = await prepareALTForwardingAutomation.getALTForwardingAutomationInputForOamRequestAsync(
                uuid
            );
            if (applicationLayerTopologyForwardingInputList) {
                resolve(applicationLayerTopologyForwardingInputList);
            }
        } catch (error) {
            reject(error);
        }
    });
}