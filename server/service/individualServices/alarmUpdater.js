const createHttpError = require("http-errors");

exports.updateAlarmByTypeAndResource = function (json, alarmTypeId, resource, AlarmStatus, updatedAttributes) {
    let resourceToUpdate = resource.replace(/core-model-1-4:network-control-domain=live\/control-construct=.+?\//g, 'core-model-1-4:control-construct/');
    let objectKey = Object.keys(json)[0];
    let alarms = json[objectKey]["alarms-1-0:alarm-pac"]["current-alarms"]["current-alarm-list"];
    let found = false;
    for (let i = 0; i < alarms.length; i++) {
        let resourceToCompare = modifyResource(alarms[i]["resource"]);
        if (alarms[i]["alarm-type-id"] === alarmTypeId && resourceToCompare === resourceToUpdate) {
            if (AlarmStatus.indexOf("cleared") == -1 || AlarmStatus.indexOf("CLEARED") == -1) {
                for (let attr in updatedAttributes) {
                    alarms[i][attr] = updatedAttributes[attr];
                }
                found = true;
            } else {
                alarms.splice(i, 1);
                alarms.forEach((item, index) => {
                    item["current-alarm-identifier"] = (index + 1).toString();
                });
                let numberOfCurrentAlarms = alarms.length;
                json[objectKey]["alarms-1-0:alarm-pac"]["current-alarms"]["number-of-current-alarms"] = numberOfCurrentAlarms;
                //json["core-model-1-4:control-construct"][0]["alarms-1-0:alarm-pac"]["current-alarms"]["time-of-latest-change"] = newAlarm["timestamp"];
                found = true;
            }
        }
    }
    if (!found) {
        let maxIdentifier = Math.max(...alarms.map(alarm => parseInt(alarm["current-alarm-identifier"])));
        let newAlarm = {
            "current-alarm-identifier": (maxIdentifier + 1).toString(),
            "timestamp": updatedAttributes.timestamp,
            "resource": updatedAttributes.resource,
            "alarm-type-id": updatedAttributes["alarm-type-id"],
            "alarm-type-qualifier": updatedAttributes["alarm-type-qualifier"],
            "alarm-severity": "alarms-1-0:SEVERITY_TYPE_" + updatedAttributes["alarm-severity"].toUpperCase()
        };
        alarms.push(newAlarm);
        let numberOfCurrentAlarms = alarms.length;
        json[objectKey]["alarms-1-0:alarm-pac"]["current-alarms"]["number-of-current-alarms"] = numberOfCurrentAlarms;
        json[objectKey]["alarms-1-0:alarm-pac"]["current-alarms"]["time-of-latest-change"] = newAlarm["timestamp"];
    }
}

function modifyResource (resource) {
    let outputString = resource.replace(/\[uuid='(.*?)'\]/g, '=$1').replace(/\[local-id='(.*?)'\]/g, '=$1');
    return outputString;
  }