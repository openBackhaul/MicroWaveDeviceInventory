const configConstants = require("./ConfigConstants");

const callbackCounters = [
    {
        'callback': configConstants.OAM_PATH_CONTROLLER_ATTRIBUTE_VALUE_CHANGES,
        'counter': 0,
    },
    {
        'callback': configConstants.OAM_PATH_CONTROLLER_ATTRIBUTE_OBJECT_CREATIONS,
        'counter': 0,
    },
    {
        'callback': configConstants.OAM_PATH_CONTROLLER_ATTRIBUTE_OBJECT_DELETIONS,
        'counter': 0,
    },
    {
        'callback': configConstants.OAM_PATH_DEVICE_ALARMS,
        'counter': 0,
    },
    {
        'callback': configConstants.OAM_PATH_DEVICE_OBJECT_CREATIONS,
        'counter': 0,
    },
    {
        'callback': configConstants.OAM_PATH_DEVICE_OBJECT_DELETIONS,
        'counter': 0,
    },
    {
        'callback': configConstants.OAM_PATH_DEVICE_ATTR_VALUE_CHANGES,
        'counter': 0,
    },
];

/**
 * Convert a notification from ODL format to REST notification data.
 * ODL=>ONF or IETF=>ONF
 *
 * @param controllerNotification original message from controller which concerns controllers or device events
 * @param notificationType
 * @param controllerName
 * @param controllerRelease
 * @param eventTime
 * @returns converted Notification, notification in ONF-format for subscribers
 */
exports.convertNotification = function (controllerNotification, notificationType, controllerName, controllerRelease, eventTime) {

    let isDeviceTypeNotification = [
        configConstants.OAM_PATH_DEVICE_ATTR_VALUE_CHANGES,
        configConstants.OAM_PATH_DEVICE_OBJECT_DELETIONS,
        configConstants.OAM_PATH_DEVICE_OBJECT_CREATIONS,
        configConstants.OAM_PATH_DEVICE_ALARMS
    ].includes(notificationType);

    if (isDeviceTypeNotification) {
        return convertDeviceNotification(controllerNotification, controllerName, controllerRelease, notificationType);
    } else {
        return convertControllerNotificationEvent(controllerNotification, controllerName, controllerRelease, eventTime, notificationType);
    }
}

function cleanupResource(resource) {
    let cleanedResource = resource;
    cleanedResource = cleanedResource.replaceAll('[uuid=\'', "=");
    cleanedResource = cleanedResource.replaceAll('[local-id=\'', "=");
    cleanedResource = cleanedResource.replaceAll("']", "");
    return cleanedResource;
}

/**
 * Callbacks
 *  SubscriptionCausesNotifyingOfDeviceAlarms
 *  SubscriptionCausesNotifyingOfChangedDeviceAttributeValue
 *  SubscriptionCausesNotifyingOfDeviceObjectCreation
 *  SubscriptionCausesNotifyingOfDeviceObjectDeletion
 *
 * @param controllerNotification
 * @param controllerName
 * @param controllerRelease
 * @param notificationType
 * @return {{[p: string]: {}}}
 */
function convertDeviceNotification(controllerNotification, controllerName, controllerRelease, notificationType) {

    let innerElement = Object.values(controllerNotification["ietf-restconf:notification"])[0];
    let eventType = Object.keys(controllerNotification["ietf-restconf:notification"])[0].split(':')[1];
    let nodeId = controllerNotification['node-id'];
    let controlConstruct = "/core-model-1-4:network-control-domain=live/control-construct=" + nodeId;
    let ltpPart = "/logical-termination-point";
    let outputInnerElement = {};

    if (notificationType === configConstants.OAM_PATH_DEVICE_ALARMS) {

        //input
        //                                   alarms-1-0:alarm-event-notification:
        //                                     type: object
        //                                     properties:
        //                                       alarm-event-sequence-number:
        //                                         type: integer
        //                                       alarm-type-id:
        //                                         type: string
        //                                       alarm-type-qualifier:
        //                                         type: string
        //                                       resource:
        //                                         type: string
        //                                       problem-severity:
        //                                         type: string
        //                                       timestamp:
        //                                         type: string

        let alarmEventSequenceNumber = innerElement["alarm-event-sequence-number"];
        let alarmTypeId = innerElement["alarm-type-id"];
        let alarmTypeQualifier = innerElement["alarm-type-qualifier"];
        let resource = innerElement["resource"];
        let problemSeverity = innerElement["problem-severity"];
        let timestamp = innerElement["timestamp"];

        //output
        //                        notification-proxy-1-0:alarm-event-notification:
        //                           type: object
        //                           required:
        //                             - alarm-event-sequence-number
        //                             - timestamp
        //                             - resource
        //                             - alarm-type-id
        //                             - alarm-type-qualifier
        //                             - problem-severity
        //                           properties:
        //                             alarm-event-sequence-number:
        //                               type: integer
        //                               description: >
        //                                 'Sequence number of the notification at the device
        //                                 from {$/v1/add-controller.callbacks.PromptForListenToControllersCausesSubscribingForDeviceNotifications.response.body#ietf-restconf:notification/alarms-1-0:alarm-event-notification/alarm-event-sequence-number}'
        //                             timestamp:
        //                               type: string
        //                               pattern: '^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})((\.[0-9]{1,}){0,1})(Z|[\+\-][0-9]{2}:[0-9]{2})$'
        //                               description: >
        //                                 'The time according to Section 5.6 of RFC 3339 at which the device created the notification
        //                                 from {$/v1/add-controller.callbacks.PromptForListenToControllersCausesSubscribingForDeviceNotifications.response.body#ietf-restconf:notification/alarms-1-0:alarm-event-notification/timestamp}'
        //                             resource:
        //                               type: string
        //                               description: >
        //                                 'Path to the object where the error occurred
        //                                 from [/core-model-1-4:network-control-domain=live/control-construct=][{$/v1/add-controller.callbacks.PromptForListenToControllersCausesSubscribingForDeviceNotifications.response.body#node-id}][path to the class derived from {$/v1/add-controller.callbacks.PromptForListenToControllersCausesSubscribingForDeviceNotifications.response.body#ietf-restconf:notification/alarms-1-0:alarm-event-notification/resource}, but cornered brackets and their content being replaced by an equal sign and the string inside quotes inside the cornered brackets]
        //                                 example: '[/core-model-1-4:network-control-domain=live/control-construct=][{mount-name}][/logical-termination-point={uuid}/layer-protocol={local-id}/air-interface-2-0:air-interface-pac]'
        //                             alarm-type-id:
        //                               type: string
        //                               description: >
        //                                 'Identifier of the type of alarm
        //                                 from {$/v1/add-controller.callbacks.PromptForListenToControllersCausesSubscribingForDeviceNotifications.response.body#ietf-restconf:notification/alarms-1-0:alarm-event-notification/alarm-type-id}'
        //                             alarm-type-qualifier:
        //                               type: string
        //                               description: >
        //                                 'Part 2 of the identifier of the type of alarm
        //                                 from {$/v1/add-controller.callbacks.PromptForListenToControllersCausesSubscribingForDeviceNotifications.response.body#ietf-restconf:notification/alarms-1-0:alarm-event-notification/alarm-type-qualifier}'
        //                             problem-severity:
        //                               type: string
        //                               enum:
        //                                 - 'indeterminate'
        //                                 - 'warning'
        //                                 - 'minor'
        //                                 - 'major'
        //                                 - 'critical'
        //                                 - 'cleared'
        //                                 - 'not-yet-defined'
        //                               description: >
        //                                 'Severity of the alarm as configured on the device
        //                                 from selected according to {$/v1/add-controller.callbacks.PromptForListenToControllersCausesSubscribingForDeviceNotifications.response.body#ietf-restconf:notification/alarms-1-0:alarm-event-notification/problem-severity}'

        outputInnerElement["alarm-event-sequence-number"] = alarmEventSequenceNumber;
        outputInnerElement["timestamp"] = timestamp;

        let outputResource = resource.substring(resource.indexOf(ltpPart));
        outputResource = cleanupResource(outputResource);
        //for example /core-model-1-4:network-control-domain=live/control-construct=][{mount-name}][/logical-termination-point={uuid}/layer-protocol={local-id}/air-interface-2-0:air-interface-pac
        outputInnerElement["resource"] = controlConstruct + outputResource;

        outputInnerElement["alarm-type-id"] = alarmTypeId;
        outputInnerElement["alarm-type-qualifier"] = alarmTypeQualifier;

        //map severity enum values
        switch (problemSeverity) {
            case "alarms-1-0:SEVERITY_AND_CLEARED_TYPE_INDETERMINATE" :
                outputInnerElement["problem-severity"] = "indeterminate";
                break;
            case "alarms-1-0:SEVERITY_AND_CLEARED_TYPE_WARNING" :
                outputInnerElement["problem-severity"] = "warning";
                break;
            case "alarms-1-0:SEVERITY_AND_CLEARED_TYPE_MINOR" :
                outputInnerElement["problem-severity"] = "minor";
                break;
            case "alarms-1-0:SEVERITY_AND_CLEARED_TYPE_MAJOR" :
                outputInnerElement["problem-severity"] = "major";
                break;
            case "alarms-1-0:SEVERITY_AND_CLEARED_TYPE_CRITICAL" :
                outputInnerElement["problem-severity"] = "critical";
                break;
            case "alarms-1-0:SEVERITY_AND_CLEARED_TYPE_CLEARED" :
                outputInnerElement["problem-severity"] = "cleared";
                break;
            case "alarms-1-0:SEVERITY_AND_CLEARED_TYPE_NOT_YET_DEFINED" :
                outputInnerElement["problem-severity"] = "not_yet_defined";
                break;
        }


    } else if (notificationType === configConstants.OAM_PATH_DEVICE_ATTR_VALUE_CHANGES) {

        //input
        //                                  notifications-1-0:attribute-value-changed-notification:
        //                                     type: object
        //                                     properties:
        //                                       counter:
        //                                         type: integer
        //                                         description: 'Counts attribute value changed notifications.'
        //                                       timestamp:
        //                                         type: string
        //                                         description: 'Time when the notification got created on the device.'
        //                                       object-path:
        //                                         type: string
        //                                         description: 'Path from the top level element (e.g ControlConstruct) to the object that holds the attribute that changed its value. In YANG, it would be the parent data node e.g. container or list that contains the leaf.'
        //                                       attribute-name:
        //                                         type: string
        //                                         description: 'Name of the attribute that has changed its value. In YANG, it would be the name of the leaf or leaflist that changed its value.'
        //                                       new-value:
        //                                         type: string
        //                                         description: 'Attribute value converted to a string (xml, json, ...).'

        let counter = innerElement['counter'];
        let timestamp = innerElement['timestamp'];
        let objectPath = innerElement['object-path'];
        let attributeName = innerElement['attribute-name'];
        let newValue = innerElement['new-value'];

        //outbound
        //                         notification-proxy-1-0:attribute-value-changed-notification:
        //                           required:
        //                           - attribute-name
        //                           - counter
        //                           - new-value
        //                           - object-path
        //                           - timestamp
        //                           type: object
        //                           properties:
        //                             counter:
        //                               type: integer
        //                               description: |
        //                                 'Sequence number of the notification at the device from {$/v1/add-controller.callbacks.PromptForListenToControllersCausesSubscribingForDeviceNotifications.response.body#ietf-restconf:notification/notifications-1-0:attribute-value-changed-notification/counter}'
        //                             timestamp:
        //                               type: string
        //                               description: |
        //                                 'The time according to Section 5.6 of RFC 3339 at which the device created the notification from {$/v1/add-controller.callbacks.PromptForListenToControllersCausesSubscribingForDeviceNotifications.response.body#ietf-restconf:notification/notifications-1-0:attribute-value-changed-notification/timestamp}'
        //                             object-path:
        //                               type: string
        //                               description: |
        //                                 'Path to the object that holds the attribute that changed its value from [/core-model-1-4:network-control-domain=live/control-construct=][{$/v1/add-controller.callbacks.PromptForListenToControllersCausesSubscribingForDeviceNotifications.response.body#node-id}][string behind /core-model-1-4:control-construct in value of {$/v1/add-controller.callbacks.PromptForListenToControllersCausesSubscribingForDeviceNotifications.response.body#ietf-restconf:notification/notifications-1-0:attribute-value-changed-notification/object-path}, but cornered brackets and their content being replaced by an equal sign and the string inside quotes inside the cornered brackets] example: [/core-model-1-4:network-control-domain=live/control-construct=][{mount-name}][/logical-termination-point={uuid}/layer-protocol={local-id}/air-interface-2-0:air-interface-pac/air-interface-configuration]'
        //                             attribute-name:
        //                               type: string
        //                               description: |
        //                                 'Name of the attribute that changed its value from {$/v1/add-controller.callbacks.PromptForListenToControllersCausesSubscribingForDeviceNotifications.response.body#ietf-restconf:notification/notifications-1-0:attribute-value-changed-notification/attribute-name}'
        //                             new-value:
        //                               type: string
        //                               description: |
        //                                 'New value of the attribute from {$/v1/add-controller.callbacks.PromptForListenToControllersCausesSubscribingForDeviceNotifications.response.body#ietf-restconf:notification/notifications-1-0:attribute-value-changed-notification/new-value}'

        outputInnerElement['counter'] = counter;
        outputInnerElement['timestamp'] = timestamp;

        let outputResource = objectPath.substring(objectPath.indexOf(ltpPart));
        outputResource = cleanupResource(outputResource);
        //for example /core-model-1-4:network-control-domain=live/control-construct=][{mount-name}][/logical-termination-point={uuid}/layer-protocol={local-id}/air-interface-2-0:air-interface-pac/air-interface-configuration
        outputInnerElement["object-path"] = controlConstruct + outputResource;

        outputInnerElement['attribute-name'] = attributeName;
        outputInnerElement['new-value'] = newValue;

    } else if (notificationType === configConstants.OAM_PATH_DEVICE_OBJECT_CREATIONS ||
        notificationType === configConstants.OAM_PATH_DEVICE_OBJECT_DELETIONS) {

        //input
        //                                  notifications-1-0:object-creation-notification:
        //                                     type: object
        //                                     properties:
        //                                       counter:
        //                                         type: integer
        //                                         description: 'Counts object creation notifications.'
        //                                       timestamp:
        //                                         type: string
        //                                         description: 'Time when the notification got created on the device.'
        //                                       object-path:
        //                                         type: string
        //                                         description: 'Path from the top level element (e.g. ControlConstruct) to the object that got created. In YANG, it would be the container or list that got created.'

        let counter = innerElement['counter'];
        let timestamp = innerElement['timestamp'];
        let objectPath = innerElement['object-path'];

        // outbound
        //                         notification-proxy-1-0:object-creation-notification:
        //                           required:
        //                           - counter
        //                           - object-path
        //                           - timestamp
        //                           type: object
        //                           properties:
        //                             counter:
        //                               type: integer
        //                               description: |
        //                                 'Sequence number of the notification at the device from {$/v1/add-controller.callbacks.PromptForListenToControllersCausesSubscribingForDeviceNotifications.response.body#ietf-restconf:notification/notifications-1-0:object-creation-notification/counter}'
        //                             timestamp:
        //                               type: string
        //                               description: |
        //                                 'The time according to Section 5.6 of RFC 3339 at which the device created the notification from {$/v1/add-controller.callbacks.PromptForListenToControllersCausesSubscribingForDeviceNotifications.response.body#ietf-restconf:notification/notifications-1-0:object-creation-notification/timestamp}'
        //                             object-path:
        //                               type: string
        //                               description: |
        //                                 'Path to the object that has been created from [/core-model-1-4:network-control-domain=live/control-construct=][{$/v1/add-controller.callbacks.PromptForListenToControllersCausesSubscribingForDeviceNotifications.response.body#node-id}][string behind /core-model-1-4:control-construct in value of {$/v1/add-controller.callbacks.PromptForListenToControllersCausesSubscribingForDeviceNotifications.response.body#ietf-restconf:notification/notifications-1-0:object-creation-notification/object-path}, but cornered brackets and their content being replaced by an equal sign and the string inside quotes inside the cornered brackets]'

        outputInnerElement['counter'] = counter;
        outputInnerElement['timestamp'] = timestamp;

        let forwardingDomainObjectCreationPath = "/forwarding-domain";
        let outputResource = objectPath.substring(objectPath.indexOf(forwardingDomainObjectCreationPath));
        outputResource = cleanupResource(outputResource);
        outputInnerElement["object-path"] = controlConstruct + outputResource;
    }

    let innerLabel = "notification-proxy-1-0:" + eventType;
    let resultNotification = {
        [innerLabel]: outputInnerElement
    };

    return resultNotification;
}

function increaseCounter(notificationType) {

    let searchedItem = null;
    for (const callbackCounter of callbackCounters) {
        if (callbackCounter.callback === notificationType) {
            searchedItem = callbackCounter;
            break;
        }
    }

    if (searchedItem) {
        searchedItem.counter = searchedItem.counter + 1;
        return searchedItem.counter;
    } else {
        return -1;
    }
}

/**
 * conversion of controller notifications
 *  callbacks
 *      SubscriptionCausesNotifyingOfChangedControllerAttributeValue
 *      SubscriptionCausesNotifyingOfControllerObjectCreation
 *      SubscriptionCausesNotifyingOfControllerObjectDeletion
 *
 * fields:
 *  counter
 *      Continuous count of all requests sent by this callback
 *
 *  timestamp
 *      event-time from incoming controller notification
 *
 *  resource
 *      path to the target attribute
 *
 *
 * !changed-value!
 *  attribute-name
 *      name of the concerned attribute
 *
 *  new-value
 *      new value of the attribute
 *
 *
 *  !object-creation!
 *  object-type
 *      name of the new object
 *
 * @param controllerEvent
 * @param controllerName
 * @param controllerRelease
 * @param eventTime
 * @param notificationType
 * @return {{[p: string]: {}}}
 */
function convertControllerNotificationEvent(controllerEvent, controllerName, controllerRelease, eventTime, notificationType) {

    let controllerID = controllerName;
    let path = controllerEvent["path"];
    let nodeID = "unknown";
    let nodeIDStartIndex = path.indexOf("node-id=");
    if (nodeIDStartIndex > 0) {
        if (path.charAt(nodeIDStartIndex + 8) === "'") {
            let nodeIDEndIndex = path.substring(nodeIDStartIndex + 9).indexOf("'"); //find ending "'" of node-id string
            nodeID = path.substring(nodeIDStartIndex + 9, nodeIDStartIndex + nodeIDEndIndex + 9);
        } else if (path.charAt(nodeIDStartIndex + 8) === '"') {
            let nodeIDEndIndex = path.substring(nodeIDStartIndex + 9).indexOf('"'); //find ending '"' of node-id string
            nodeID = path.substring(nodeIDStartIndex + 9, nodeIDStartIndex + nodeIDEndIndex + 9);
        } else {
            let nodeIDEndIndex = path.substring(nodeIDStartIndex + 8).indexOf("/"); //find next "/"
            nodeID = path.substring(nodeIDStartIndex + 8, nodeIDStartIndex + nodeIDEndIndex - 1);
        }
    } else {
       console.log("missing node-id for controller " + controllerName + " in path: " + path);
    }

    let dataKey = null;
    let dataValue = null;
    if (controllerEvent["data"]) {
        dataKey = Object.keys(controllerEvent["data"])[0];
        dataValue = Object.values(controllerEvent["data"])[0];
        //if object stringify it
        if (typeof dataValue === 'object') {
            dataValue = JSON.stringify(dataValue);
        } else if (typeof dataValue !== 'string' && !(dataValue instanceof String)) {
            dataValue = String(dataValue);
        }
        dataKey = dataKey.substring(dataKey.lastIndexOf(":") + 1, dataKey.length);
    }

    let controllerTargetPath = null;
    let headerKey = null;

    switch (notificationType) {
        case configConstants.OAM_PATH_CONTROLLER_ATTRIBUTE_VALUE_CHANGES:
            controllerTargetPath = "/layer-protocol=0/mount-point-1-0:mount-point-pac/mount-point-configuration";
            headerKey = "notification-proxy-1-0:attribute-value-changed-notification";
            break;
        case configConstants.OAM_PATH_CONTROLLER_ATTRIBUTE_OBJECT_CREATIONS:
            controllerTargetPath = "/layer-protocol=0/mount-point-1-0:mount-point-pac/mount-point-configuration" + "/" + dataKey;
            headerKey = "notification-proxy-1-0:object-creation-notification";
            break;
        case configConstants.OAM_PATH_CONTROLLER_ATTRIBUTE_OBJECT_DELETIONS:
            let lastPartOfPath = path.substring(path.lastIndexOf(":") + 1, path.length);
            controllerTargetPath = "/layer-protocol=0/mount-point-1-0:mount-point-pac/mount-point-configuration" + "/" + lastPartOfPath;
            headerKey = "notification-proxy-1-0:object-deletion-notification";
            break;
    }

    //build result
    let resourceString = "/core-model-1-4:network-control-domain=live/control-construct=" + controllerID
        + "/logical-termination-point=" + nodeID + controllerTargetPath;

    // let sequenceCounter = notificationStreamManagement.increaseCounter(controllerName, controllerRelease, notificationStreamManagement.STREAM_TYPE_DEVICE);
    let sequenceCounter = increaseCounter(notificationType);

    let innerOutputElement;
    if (dataKey) {
        if (notificationType === configConstants.OAM_PATH_CONTROLLER_ATTRIBUTE_OBJECT_CREATIONS) {
            innerOutputElement = {
                "counter": sequenceCounter,
                "timestamp": eventTime,
                "resource": resourceString,
                "object-type": dataKey
            };
        } else {
            innerOutputElement = {
                "counter": sequenceCounter,
                "timestamp": eventTime,
                "resource": resourceString,
                "attribute-name": dataKey,
                "new-value": dataValue
            };
        }
    } else {
        innerOutputElement = {
            "counter": sequenceCounter,
            "timestamp": eventTime,
            "resource": resourceString
        };
    }

    let convertedNotificationWrapper = {
        [headerKey]: innerOutputElement
    };

    return convertedNotificationWrapper;
}

/**
 * produces list of outbound notifications for input notifications with x events
 *
 * @param notification incoming notification as json object
 * @param controllerName
 * @param controllerRelease
 * @return list of notifications to send
 */
exports.convertControllerNotification = function (notification, controllerName, controllerRelease) {
    let notificationsToSend = [];

    if (notification["urn-ietf-params-xml-ns-netconf-notification-1.0:notification"]) {
        let events = notification["urn-ietf-params-xml-ns-netconf-notification-1.0:notification"]["urn-opendaylight-params-xml-ns-yang-controller-md-sal-remote:data-changed-notification"]["data-change-event"];
        let eventTime = notification["urn-ietf-params-xml-ns-netconf-notification-1.0:notification"]["event-time"];

        for (const event of events) {
            let inboundNotificationType = event["operation"];

            let subscriberNotificationType;
            switch (inboundNotificationType) {
                case "created":
                    subscriberNotificationType = configConstants.OAM_PATH_CONTROLLER_ATTRIBUTE_OBJECT_CREATIONS;
                    break;
                case "updated":
                    subscriberNotificationType = configConstants.OAM_PATH_CONTROLLER_ATTRIBUTE_VALUE_CHANGES;
                    break;
                case "deleted":
                    subscriberNotificationType = configConstants.OAM_PATH_CONTROLLER_ATTRIBUTE_OBJECT_DELETIONS;
                    break;
                default:
                    console.log("notificationType unknown: " + inboundNotificationType);
                    break;
            }

            if (subscriberNotificationType) {
                //build one notification for all subscribers
                let notificationMessage = exports.convertNotification(event, subscriberNotificationType, controllerName, controllerRelease, eventTime);

                if (notificationMessage) {
                    let outboundNotification = {
                        "subscriberNotificationType": subscriberNotificationType,
                        "notificationMessage": notificationMessage
                    };

                    notificationsToSend.push(outboundNotification);
                }
            }
        }
    }

    return notificationsToSend;
}

exports.resetAllCounters = function () {
    for (const callbackCounter of callbackCounters) {
        callbackCounter.counter = 0;
    }
}
