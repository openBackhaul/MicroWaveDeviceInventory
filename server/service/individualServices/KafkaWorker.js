const { parentPort, workerData } = require("worker_threads");
const kafka = require("onf-core-model-ap/applicationPattern/services/KafkaConsumerService");
const individualServices = require("../IndividualServicesService");
const notificationManagement = require('../individualServices/NotificationManagement');
const prepareElasticsearch = require('../individualServices/ElasticsearchPreparation');
const utility = require('./utility');
let kafkaConnection = require('./KafkaHandler');

function getNotificationType(notification) {
  let notificationType = Object.keys(notification)[0];
  if (notificationType.includes("alarm-event")) return "ALARM";
  if (notificationType.includes("attribute-value-changed")) return "ATTRIBUTE_VALUE_CHANGED";
  if (notificationType.includes("object-creation")) return "OBJECT_CREATION";
  if (notificationType.includes("object-deletion")) return "OBJECT_DELETION";
  return "undefined";
}

let consumer = undefined;

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
      let kafkaNotificationReceiptAndProcessingSwitch = await utility.getStringValueForStringProfileNameAsync(
    "kafkaNotificationReceiptAndProcessingSwitch");
        if(kafkaNotificationReceiptAndProcessingSwitch == "on"){
      consumer = await kafka.connect(groupId, clientId, brokerList);
      kafka.subscribeMessages(topics, handleNotifications);
      console.log("*************************************************************");
      console.log("kafkaNotificationReceiptAndProcessingSwitch is "+kafkaNotificationReceiptAndProcessingSwitch);
      console.log("kafka started");
      console.log("*************************************************************");
    }else{
      console.log("*************************************************************");
      console.log("kafkaNotificationReceiptAndProcessingSwitch is "+kafkaNotificationReceiptAndProcessingSwitch);
      console.log("*************************************************************");
    }
  } catch (err) {
    console.log(err)
    parentPort.postMessage({ error: err.message });
  }
})();

parentPort.on("message", async (msg) => {
  if (msg.action === "stop") {
    try {
    await kafka.disconnectKafka(consumer);
    consumer = undefined;
    console.log("*****************************");
    parentPort.postMessage("Kafka stopped");   
    console.log("*****************************");       
    } catch (error) {
      console.log("*****************************");
      console.log("Problem in executing in parentPort");
      console.log(error);
      console.log("*****************************");      
    }
  }
  if (msg.action === "start") {
    try {
    if(consumer == undefined){
    await kafkaConnection.connectToKafka();
    }
    parentPort.postMessage("Kafka resumed");      
    } catch (error) {
      console.log("*****************************");
      console.log("Problem in executing in parentPort");
      console.log(error);
      console.log("*****************************");
    }
  }
});

