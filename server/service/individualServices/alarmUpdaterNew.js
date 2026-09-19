const ALARMS_PAC = "alarms-1-0:alarm-pac";
const CURRENT_ALARMS = "current-alarms";
const CURRENT_ALARM_LIST = "current-alarm-list";

const ALARM_TYPE_ID = "alarm-type-id";
const ALARM_TYPE_QUALIFIER = "alarm-type-qualifier";
const ALARM_SEVERITY = "alarm-severity";

const N_OF_CURRENT_ALARMS = "number-of-current-alarms";
const TIME_OF_LATEST_CHANGE = "time-of-latest-change";

const RESOURCE = "resource";
const TIMESTAMP = "timestamp";


// Compile regexes once instead of creating them every call
const NETWORK_CONTROL_DOMAIN_REGEX = /core-model-1-4:network-control-domain=live\/control-construct=.+?\//g;

const UUID_REGEX = /\[uuid='(.*?)'\]/g;
const LOCAL_ID_REGEX = /\[local-id='(.*?)'\]/g;

const LTP_REGEX = /logical-termination-point=([A-Za-z0-9]+(?:-[A-Za-z0-9]+)+)/i;

const LAYER_PROTOCOL_REGEX = /layer-protocol=([A-Za-z0-9]+(?:-[A-Za-z0-9]+)+)/i;

const EQUIPMENT_REGEX = /equipment=([A-Za-z0-9]+(?:-[A-Za-z0-9]+)+)/i;


exports.updateAlarmByTypeAndResource = function (json, alarmTypeId, resource, alarmStatus, updatedAttributes) {
  try {
    // Input validation
    if (!json || !resource || !alarmStatus || !updatedAttributes) {
      logger.warn("Invalid parameters received by updateAlarmByTypeAndResource");
      return;
    }

    const objectKey = Object.keys(json)[0];

    if (!objectKey) {
      logger.warn("Empty JSON object");
      return;
    }

    // Navigate JSON only once
    const root = json[objectKey];
    const alarmPac = root?.[ALARMS_PAC];
    const currentAlarms = alarmPac?.[CURRENT_ALARMS];

    if (!currentAlarms) {
      logger.warn("Current alarms structure not found");
      return;
    }

    // Get/create alarm list
    const alarms = currentAlarms[CURRENT_ALARM_LIST] ?? (currentAlarms[CURRENT_ALARM_LIST] = []);

    // Normalize incoming resource only once
    const resourceToUpdate = modifyResource(
      resource.replace(NETWORK_CONTROL_DOMAIN_REGEX, "core-model-1-4:control-construct/")
    );

    const isClear = alarmStatus.toUpperCase().includes("CLEAR");

    logger.info(`Get List of current alarms, size is: ${alarms.length}`);
    logAlarmNotificationUpdate(`Get List of current alarms, size is: ${alarms.length}`);

    // Search matching alarm
    let alarmIndex = -1;

    for (let i = 0; i < alarms.length; i++) {
      const alarm = alarms[i];

      // Check cheap condition first.
      // Avoid modifyResource() if alarm type is different.
      if (alarm[ALARM_TYPE_ID] !== alarmTypeId) {
        continue;
      }

      if (modifyResource(alarm[RESOURCE]) === resourceToUpdate) {
        alarmIndex = i;
        break;
      }
    }

    // Alarm already exists
    if (alarmIndex !== -1) {
      const alarm = alarms[alarmIndex];

      if (isClear) {
        logger.info(`Alarm id: ${alarmTypeId} - on resource: ${resourceToUpdate} - CLEARED`);

        logAlarmNotificationUpdate(`Alarm id: ${alarmTypeId} - on resource: ${resourceToUpdate} - CLEARED`);

        alarms.splice(alarmIndex, 1);
        currentAlarms[N_OF_CURRENT_ALARMS] = alarms.length;

        logger.info(`List of current alarms after deleting cleared alarm, size is: ${alarms.length}`);

        logAlarmNotificationUpdate(`List of current alarms after deleting cleared alarm, size is: ${alarms.length}`);

        return;
      }

      // Update existing alarm
      logger.info(`Alarm id: ${alarmTypeId} - on resource: ${resourceToUpdate} - UPDATE`);

      logAlarmNotificationUpdate(`Alarm id: ${alarmTypeId} - on resource: ${resourceToUpdate} - UPDATE`);

      for (const [attr, value] of Object.entries(updatedAttributes)) {
        if (attr === RESOURCE) {
          continue;
        }

        alarm[attr] = value;
      }

      logger.debug("Alarm found in the list");
      logAlarmNotificationUpdate("Alarm found in the list");

      return;
    }

    // Alarm doesn't exist
    logger.debug("Alarm not found in the list");
    logAlarmNotificationUpdate("Alarm not found in the list");

    // CLEAR for an alarm that doesn't exist -> nothing to do
    if (isClear) {
      logger.warn("This is a CLEAR alarm type. Will not add to the list");

      logAlarmNotificationUpdate("This is a CLEAR alarm type. Will not add to the list");
      return;
    }

    // Add new alarm
    logger.info(`Alarm id: ${alarmTypeId} - on resource: ${resourceToUpdate} - to be added`);
    logAlarmNotificationUpdate(`Alarm id: ${alarmTypeId} - on resource: ${resourceToUpdate} - to be added`);

    const newAlarm = {
      [ALARM_TYPE_ID]: updatedAttributes[ALARM_TYPE_ID],
      [ALARM_TYPE_QUALIFIER]: updatedAttributes[ALARM_TYPE_QUALIFIER],
      [RESOURCE]: rebuildResource(updatedAttributes[RESOURCE]),
      [TIMESTAMP]: updatedAttributes[TIMESTAMP],
      [ALARM_SEVERITY]: updatedAttributes[ALARM_SEVERITY]
    };

    alarms.push(newAlarm);

    currentAlarms[N_OF_CURRENT_ALARMS] = alarms.length;
    currentAlarms[TIME_OF_LATEST_CHANGE] = newAlarm[TIMESTAMP];
    logger.info(`List of current alarms after adding new alarm, size is: ${alarms.length}`);

    logAlarmNotificationUpdate(`List of current alarms after adding new alarm, size is: ${alarms.length}`);
  } catch (error) {
    logger.error(`updateAlarmByTypeAndResource failed: ${error.message}`, error);
  }
};

function modifyResource(resource) {
  if (!resource) {
    return resource;
  }

  return resource.replace(UUID_REGEX, "=$1").replace(LOCAL_ID_REGEX, "=$1");
}

function rebuildResource(resource) {
  if (!resource) {
    return resource;
  }

  return resource
    .replace(NETWORK_CONTROL_DOMAIN_REGEX, "core-model-1-4:control-construct/")
    .replace(LTP_REGEX, "logical-termination-point[uuid='$1']")
    .replace(LAYER_PROTOCOL_REGEX, "layer-protocol[local-id='$1']")
    .replace(EQUIPMENT_REGEX, "equipment[uuid='$1']");
}
