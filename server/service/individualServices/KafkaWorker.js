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

let subscribedTopics = [];
let kafkaPausedByQueue = false;
let kafkaResumeCheckTimer = undefined;
let lastPausedTopic = undefined;
const KAFKA_RESUME_CHECK_INTERVAL_MS = Number(process.env.KAFKA_RESUME_CHECK_INTERVAL_MS) || 1000;

function getPauseTopicList(topic) {
  if (subscribedTopics && subscribedTopics.length > 0) {
    return subscribedTopics.map(t => ({ topic: t }));
  }
  return [{ topic }];
}

function clearKafkaResumeCheckTimer() {
  if (kafkaResumeCheckTimer) {
    clearInterval(kafkaResumeCheckTimer);
    kafkaResumeCheckTimer = undefined;
  }
}

function scheduleKafkaResumeCheck(topic) {
  lastPausedTopic = topic;
  if (kafkaResumeCheckTimer) return;

  kafkaResumeCheckTimer = setInterval(() => {
    try {
      resumeKafkaIfNeeded(lastPausedTopic || topic);

      if (!kafkaPausedByQueue) {
        clearKafkaResumeCheckTimer();
      }
    } catch (error) {
      console.error("Kafka resume check failed:", error);
    }
  }, KAFKA_RESUME_CHECK_INTERVAL_MS);

  if (typeof kafkaResumeCheckTimer.unref === "function") {
    kafkaResumeCheckTimer.unref();
  }
}

function pauseKafkaIfNeeded(topic) {
  if (!consumer || typeof consumer.pause !== "function") return;

  const status = individualServices.getQueueBackpressureStatus
    ? individualServices.getQueueBackpressureStatus()
    : null;

  if (!status) return;

  if (!kafkaPausedByQueue && status.shouldPause) {
    kafkaPausedByQueue = true;
    consumer.pause(getPauseTopicList(topic));
    scheduleKafkaResumeCheck(topic);

    console.log(
      `[KAFKA-BACKPRESSURE] Paused Kafka. globalQueue=${status.globalQueueSize}, activeMounts=${status.activeMountProcessors}, pendingMounts=${status.pendingMounts}`
    );
  }
}

function resumeKafkaIfNeeded(topic) {
  if (!consumer || typeof consumer.resume !== "function") return;

  const status = individualServices.getQueueBackpressureStatus
    ? individualServices.getQueueBackpressureStatus()
    : null;

  if (!status) return;

  if (kafkaPausedByQueue && status.shouldResume) {
    kafkaPausedByQueue = false;
    consumer.resume(getPauseTopicList(topic));
    clearKafkaResumeCheckTimer();

    console.log(
      `[KAFKA-BACKPRESSURE] Resumed Kafka. globalQueue=${status.globalQueueSize}, activeMounts=${status.activeMountProcessors}, pendingMounts=${status.pendingMounts}`
    );
  }
}

async function subscribeMessagesWithBackpressure(topics) {
  for (const topic of topics) {
    await consumer.subscribe({ topic });
    console.log(`consumer now connected to topic: ${topic} and listening to latest-messages`);
  }

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const receivedMessage = message.value.toString();
      console.log(
        `message received from topic: ${topic} and partition: ${partition}, bytes=${receivedMessage.length}`
      );

      let parsedMessage = receivedMessage;
      try {
        parsedMessage = JSON.parse(receivedMessage);
      } catch (error) {
        // Keep the original behavior for non-JSON messages.
      }

      await handleNotifications(parsedMessage, topic);
    }
  });
}

async function handleNotifications(receivedMessage, topic) {
  try {
    pauseKafkaIfNeeded(topic);

    let notificationType = getNotificationType(receivedMessage);
    console.log(`Kafka notification routed: topic=${topic}, type=${notificationType}`);

    switch (notificationType) {
      case "ALARM":
        await individualServices.regardDeviceAlarm(receivedMessage);
        break;

      case "ATTRIBUTE_VALUE_CHANGED":
        await individualServices.regardDeviceAttributeValueChange(receivedMessage);
        break;

      case "OBJECT_CREATION":
        await individualServices.regardDeviceObjectCreation(receivedMessage);
        break;

      case "OBJECT_DELETION":
        await individualServices.regardDeviceObjectDeletion(receivedMessage);
        break;

      default:
        console.log(`improper notification received for topic: ${topic}`);
    }

    resumeKafkaIfNeeded(topic);

  } catch (error) {
    console.error("Error handling notification:", error);
    resumeKafkaIfNeeded(topic);
  }
}

// workerData contains connection info passed from main thread
(async () => {  
  try {    
    
      const { groupId, clientId, brokerList, topics } = workerData;
      subscribedTopics = topics;
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
      if (!consumer || typeof consumer.subscribe !== "function" || typeof consumer.run !== "function") {
        throw new Error("Kafka consumer is not available after connect");
      }
      subscribeMessagesWithBackpressure(topics).catch(error => {
        console.error("Kafka subscription failed:", error);
        parentPort.postMessage({ error: error.message });
        process.exit(1);
      });
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
    process.exit(1);
  }
})();

parentPort.on("message", async (msg) => {
  if (msg.action === "stop") {
    try {
    clearKafkaResumeCheckTimer();
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

