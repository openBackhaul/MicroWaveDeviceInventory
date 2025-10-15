const { Kafka } = require("kafkajs");
const process = require('process');

const clientId = "microwave-device-inventory";
const brokers = [process.env['KAFKA_BROKER'] || "localhost:9092"]; // Default to localhost if not set

let consumer = null;

exports.connect = async function () {
  const groupId = `group-1`;

  const kafka = new Kafka({
    clientId,
    brokers,
  });

  consumer = kafka.consumer({ groupId });
  await consumer.connect();

  console.info(
    `Kafka consumer connected to brokers: ${brokers.join(
      ", "
    )} with groupId: ${groupId}`
  );
};

exports.subscribe = async function (topics) {
  if (!consumer) {
    console.error("Kafka consumer is not connected. Call connect() first.");
    return;
  }
  try {
    await consumer.subscribe({ topics });
    console.info(`Subscribed to topics: ${topics.join(", ")}`);
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log({
          partition,
          offset: message.offset,
          value: message.value.toString(),
        });
      },
    });
  } catch (error) {
    console.error(`Error subscribing to topics: ${error}`);
  }
};
