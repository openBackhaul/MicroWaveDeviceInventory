
const OAM_PATH_ATTRIBUTE_VALUE_CHANGES = "/v1/notify-attribute-value-changes";
const OAM_PATH_ATTRIBUTE_OBJECT_CREATIONS = "/v1/notify-object-creations";
const OAM_PATH_ATTRIBUTE_OBJECT_DELETIONS = "/v1/notify-object-deletions";

const OAM_PATH_DEVICE_ALARMS = "/v1/notify-device-alarms";
const OAM_PATH_DEVICE_ATTR_VALUE_CHANGES = "/v1/notify-device-attribute-value-changes";
const OAM_PATH_DEVICE_OBJECT_CREATIONS = "/v1/notify-device-object-creations";
const OAM_PATH_DEVICE_OBJECT_DELETIONS = "/v1/notify-device-object-deletions";

const OPERATION_SUB_NOTIF_CONTROLLER_CHANGED_ATTR = "SubscriptionCausesNotifyingOfChangedControllerAttributeValue";
const OPERATION_SUB_NOTIF_CONTROLLER_OBJ_CREATION = "SubscriptionCausesNotifyingOfControllerObjectCreation";
const OPERATION_SUB_NOTIF_CONTROLLER_OBJ_DELETION = "SubscriptionCausesNotifyingOfControllerObjectDeletion";
const OPERATION_SUB_NOTIF_CHANGED_ATTR = "SubscribingAtMwdiForDeviceAttributeChangesCausesSendingNotifications";
const OPERATION_SUB_NOTIF_OBJ_CREATION = "SubscribingAtMwdiForDeviceObjectCreationsCausesSendingNotifications";
const OPERATION_SUB_NOTIF_OBJ_DELETION = "SubscribingAtMwdiForDeviceObjectDeletionsCausesSendingNotifications";
const OPERATION_SUB_NOTIF_DEVICE_ALARMS = "SubscriptionCausesNotifyingOfDeviceAlarms";
const OPERATION_SUB_NOTIF_DEVICE_CHANGED_ATTR = "SubscriptionCausesNotifyingOfChangedDeviceAttributeValue";
const OPERATION_SUB_NOTIF_DEVICE_OBJ_CREATION = "SubscriptionCausesNotifyingOfDeviceObjectCreation";
const OPERATION_SUB_NOTIF_DEVICE_OBJ_DELETION = "SubscriptionCausesNotifyingOfDeviceObjectDeletion";

const PATH_STREAM_DEVICE = "/rests/notif/device?notificationType=device";
const PATH_STREAM_CONTROLLER_STEP1 = "/rests/operations/sal-remote:create-data-change-event-subscription";
const PATH_STREAM_CONTROLLER_STEP2 = "/rests/data/ietf-restconf-monitoring:restconf-state/streams/stream/";

function getAllForwardConstructNamesToUpdate() {
    return [OPERATION_SUB_NOTIF_CONTROLLER_CHANGED_ATTR,
        OPERATION_SUB_NOTIF_CONTROLLER_OBJ_CREATION,
        OPERATION_SUB_NOTIF_CONTROLLER_OBJ_DELETION,
        OPERATION_SUB_NOTIF_DEVICE_ALARMS,
        OPERATION_SUB_NOTIF_DEVICE_CHANGED_ATTR,
        OPERATION_SUB_NOTIF_DEVICE_OBJ_CREATION,
        OPERATION_SUB_NOTIF_DEVICE_OBJ_DELETION
    ];
}

function getForwardingName(requestUrl) {
    switch (requestUrl) {
        case OAM_PATH_ATTRIBUTE_VALUE_CHANGES:
            return OPERATION_SUB_NOTIF_CHANGED_ATTR;
        case OAM_PATH_ATTRIBUTE_OBJECT_CREATIONS:
            return OPERATION_SUB_NOTIF_OBJ_CREATION;
        case OAM_PATH_ATTRIBUTE_OBJECT_DELETIONS:
            return OPERATION_SUB_NOTIF_OBJ_DELETION;
        case OAM_PATH_DEVICE_ALARMS:
            return OPERATION_SUB_NOTIF_DEVICE_ALARMS;
        case OAM_PATH_DEVICE_ATTR_VALUE_CHANGES:
            return OPERATION_SUB_NOTIF_DEVICE_CHANGED_ATTR;
        case OAM_PATH_DEVICE_OBJECT_CREATIONS:
            return OPERATION_SUB_NOTIF_DEVICE_OBJ_CREATION;
        case OAM_PATH_DEVICE_OBJECT_DELETIONS:
            return OPERATION_SUB_NOTIF_DEVICE_OBJ_DELETION;
    }

    return null;
}

module.exports = {

    OAM_PATH_ATTRIBUTE_VALUE_CHANGES,
    OAM_PATH_ATTRIBUTE_OBJECT_CREATIONS,
    OAM_PATH_ATTRIBUTE_OBJECT_DELETIONS,
    OAM_PATH_DEVICE_ALARMS,
    OAM_PATH_DEVICE_ATTR_VALUE_CHANGES,
    OAM_PATH_DEVICE_OBJECT_CREATIONS,
    OAM_PATH_DEVICE_OBJECT_DELETIONS,

    OPERATION_SUB_NOTIF_CONTROLLER_CHANGED_ATTR,
    OPERATION_SUB_NOTIF_CONTROLLER_OBJ_CREATION,
    OPERATION_SUB_NOTIF_CONTROLLER_OBJ_DELETION,
    OPERATION_SUB_NOTIF_DEVICE_ALARMS,
    OPERATION_SUB_NOTIF_DEVICE_CHANGED_ATTR,
    OPERATION_SUB_NOTIF_DEVICE_OBJ_CREATION,
    OPERATION_SUB_NOTIF_DEVICE_OBJ_DELETION,

    PATH_STREAM_DEVICE,
    PATH_STREAM_CONTROLLER_STEP1,
    PATH_STREAM_CONTROLLER_STEP2,

    getAllForwardConstructNamesToUpdate,
    getForwardingName
}