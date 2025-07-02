
const logger = require('../LoggingService.js').getLogger();

// Constants Definition
const CURRENT_ALARM_ID = "current-alarm-identifier";
const ALARMS_PAC = "alarms-1-0:alarm-pac";
const CURRENT_ALARMS = "current-alarms";
const ALARM_TYPE_ID = "alarm-type-id";
const N_OF_CURRENT_ALARMS = "number-of-current-alarms";

exports.updateAlarmByTypeAndResource = function (json, alarmTypeId, resource, alarmStatus, updatedAttributes) {
    let resourceToUpdate = resource.replace(/core-model-1-4:network-control-domain=live\/control-construct=.+?\//g, 'core-model-1-4:control-construct/');
    resourceToUpdate = modifyResource(resourceToUpdate);
    let objectKey = Object.keys(json)[0];

    // Get the current alarms list
    let alarms = json[objectKey][ALARMS_PAC][CURRENT_ALARMS]["current-alarm-list"];
    logger.info("Get List of current alarms, size is: " + alarms.length);
    logger.debug(alarms);
    let found = false;

    // Iterate on the list
    for (let i = 0; i < alarms.length; i++) {
        let resourceToCompare = modifyResource(alarms[i]["resource"]);
        if (alarms[i][ALARM_TYPE_ID] === alarmTypeId && resourceToCompare === resourceToUpdate) {
            if (!alarmStatus.toUpperCase().includes("CLEAR")) {
                logger.info("Alarm id: " + alarmTypeId + " - on resource: " + resourceToUpdate + " - UPDATE");
                for (let attr in updatedAttributes) {
                    if (attr == "resource") {
                        logger.debug("Skip Element: " + attr);
                        continue;
                    }
                    alarms[i][attr] = updatedAttributes[attr];
                }
                found = true;
                break; // once is found, no needs to iterate..
            } else {
                logger.info("Alarm id: " + alarmTypeId + " - on resource: " + resourceToUpdate + " - CLEARED");
                alarms.splice(i, 1);
                // No More used
                // alarms.forEach((item, index) => {
                //     item[CURRENT_ALARM_ID] = (index + 1).toString();
                // });
                let numberOfCurrentAlarms = alarms.length;
                json[objectKey][ALARMS_PAC][CURRENT_ALARMS][N_OF_CURRENT_ALARMS] = numberOfCurrentAlarms;
                //json["core-model-1-4:control-construct"][0][ALARMS_PAC][CURRENT_ALARMS]["time-of-latest-change"] = newAlarm["timestamp"];
                found = true;
                break; // once is found, no needs to iterate..
            }
        }
    }

    if (!found) {
        logger.debug("Alarm not found in the list");
        // No More used
        // let maxIdentifier = Math.max(...alarms.map(alarm => parseInt(alarm[CURRENT_ALARM_ID])));
        // logger.debug("Alarm Max Identifier: " + maxIdentifier);
        logger.info("Alarm id: " + alarmTypeId + " - on resource: " + resourceToUpdate + " - to be added");
        if (alarmStatus.toUpperCase().includes("CLEAR")) {
            logger.warn("This is a CLEAR alarm type. Will not add to the list");
        } else {
            logger.info("Add to the list - Alarm id: " + alarmTypeId);
            let resourceBuild = rebuildResource(updatedAttributes.resource);

            let newAlarm = {
                // "current-alarm-identifier": (maxIdentifier + 1).toString(),
                "alarm-type-id": updatedAttributes[ALARM_TYPE_ID],
                "alarm-type-qualifier": updatedAttributes["alarm-type-qualifier"],
                "resource": resourceBuild,
                "timestamp": updatedAttributes.timestamp,
                "alarm-severity": updatedAttributes["alarm-severity"]
            };

            alarms.push(newAlarm);
            let numberOfCurrentAlarms = alarms.length;
            json[objectKey][ALARMS_PAC][CURRENT_ALARMS][N_OF_CURRENT_ALARMS] = numberOfCurrentAlarms;
            json[objectKey][ALARMS_PAC][CURRENT_ALARMS]["time-of-latest-change"] = newAlarm["timestamp"];
            logger.debug("New Alarm added in the list");
        }
    } else {
        logger.debug("Alarm found in the list");
    }
}

function modifyResource(resource) {
    let outputString = resource.replace(/\[uuid='(.*?)'\]/g, '=$1').replace(/\[local-id='(.*?)'\]/g, '=$1');
    return outputString;
}

function rebuildResource(resource) {
    let step1 = resource.replace(/core-model-1-4:network-control-domain=live\/control-construct=.+?\//g, 'core-model-1-4:control-construct/');
    let regex = /logical-termination-point=([A-Za-z0-9]+(-[A-Za-z0-9]+)+)/i; // regex for logical termination point
    let step2 = step1.replace(regex, "logical-termination-point[uuid='" + '$1' + "']");
    let regex2 = /layer-protocol=([A-Za-z0-9]+(-[A-Za-z0-9]+)+)/i; // regex for layer-protocol
    let step3 = step2.replace(regex2, "layer-protocol[local-id='" + '$1' + "']");
    let regex3 = /equipment=([A-Za-z0-9]+(-[A-Za-z0-9]+)+)/i // regex for equipment
    let step4 = step3.replace(regex3, "equipment[uuid='" + '$1' + "']");

    return step4;
}