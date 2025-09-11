const { parentPort, workerData } = require("worker_threads");
const kafka = require("onf-core-model-ap/applicationPattern/services/KafkaConsumerService");
const individualServices = require("../IndividualServicesService");
const notificationManagement = require('../individualServices/NotificationManagement');
const prepareElasticsearch = require('../individualServices/ElasticsearchPreparation');

function getNotificationType(notification) {
  let notificationType = Object.keys(notification)[0];
  if (notificationType.includes("alarm-event")) return "ALARM";
  if (notificationType.includes("attribute-value-changed")) return "ATTRIBUTE_VALUE_CHANGED";
  if (notificationType.includes("object-creation")) return "OBJECT_CREATION";
  if (notificationType.includes("object-deletion")) return "OBJECT_DELETION";
  return "undefined";
}

function handleNotifications(receivedMessage, topic) {
  try {
    let notificationType = getNotificationType(receivedMessage);

    switch (notificationType) {
      case "ALARM":
        individualServices.regardDeviceAlarm(receivedMessage);
        break;
      case "ATTRIBUTE_VALUE_CHANGED":
        individualServices.regardDeviceAttributeValueChange(receivedMessage);
        break;
      case "OBJECT_CREATION":
        individualServices.regardDeviceObjectCreation(receivedMessage);
        break;
      case "OBJECT_DELETION":
        individualServices.regardDeviceObjectDeletion(receivedMessage);
        break;
      default:
        console.log(`improper notification received: ${receivedMessage} for topic: ${topic}`);
    }
  } catch (error) {
    console.error("Error handling notification:", error);
  }
}

// workerData contains connection info passed from main thread
(async () => {
  try {
    const { groupId, clientId, brokerList, topics } = workerData;
    global.applicationDataPath = './application-data/';
    global.databasePath = './database/config.json';
    global.common = await individualServices.resolveApplicationNameAndHttpClientLtpUuidFromForwardingName();
    global.notify = await individualServices.NotifiedDeviceAlarmCausesUpdatingTheEntryInCurrentAlarmListOfCache();
    global.proxy = await notificationManagement.getAppInformation();
    await prepareElasticsearch(false);
    console.log("****************Global variables in worker thread**************");
    console.log(common);
    console.log("****************End**************");
    await kafka.connect(groupId, clientId, brokerList);
    kafka.subscribeMessages(topics, handleNotifications);

    parentPort.postMessage("Kafka worker started");
  } catch (err) {
    parentPort.postMessage({ error: err.message });
  }
})();

parentPort.on("message", async (msg) => {
  if (msg.action === "pause") {
    await kafka.pauseKafkaConnection();
    parentPort.postMessage("Kafka paused");
  }
  if (msg.action === "resume") {
    await kafka.resumeKafkaConnection();
    parentPort.postMessage("Kafka resumed");
  }
});
