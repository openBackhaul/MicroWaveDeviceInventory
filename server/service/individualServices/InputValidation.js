/**
 * Check for valid input data for subscribing a device notification.
 * @returns true if all mandatory parameters are present
 */
exports.validateSubscriberInput = function (subscribingApplicationName, subscribingApplicationRelease, subscribingApplicationProtocol,
                                            subscribingApplicationAddress, subscribingApplicationPort, notificationsReceivingOperation) {
    let validInput;

    if (subscribingApplicationName && subscribingApplicationRelease && subscribingApplicationProtocol
        && (subscribingApplicationAddress["ip-address"] || subscribingApplicationAddress["domain-name"])
        && subscribingApplicationPort && notificationsReceivingOperation) {
        validInput = true;
    } else {
        validInput = false;
    }

    return validInput;
}

/**
 * Check for valid input data for registering a controller.
 * @returns true if all mandatory parameters are present
 * @param controllerName name of controller
 * @param controllerRelease release number
 * @param controllerProtocol protocol of target url
 * @param controllerAddress target address
 * @param controllerPort target address port
 */
exports.validateControllerRegisterInput = function (controllerName, controllerRelease, controllerProtocol, controllerAddress, controllerPort) {

    let validInput;

    if (controllerName && controllerRelease && controllerProtocol
        && (controllerAddress["ip-address"] || controllerAddress["domain-name"])
        && controllerPort) {
        validInput = true;
    } else {
        validInput = false;
    }

    return validInput;
}
/**
 * Check for valid input data for deregistering a controller.
 * @returns true if all mandatory parameters are present
 * @param controllerName name of controller
 * @param controllerRelease release number
 */
exports.validateControllerDeRegisterInput = function (controllerName, controllerRelease) {

    let validInput;

    if (controllerName && controllerRelease) {
        validInput = true;
    } else {
        validInput = false;
    }

    return validInput;
}
