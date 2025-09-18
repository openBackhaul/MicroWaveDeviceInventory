const LayerProtocol = require('onf-core-model-ap/applicationPattern/onfModel/models/LayerProtocol');
const controlConstruct = require('onf-core-model-ap/applicationPattern/onfModel/models/ControlConstruct');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const TcpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpClientInterface');
const { Worker } = require("worker_threads");
const path = require("path");

let worker;
let workerisLive = false;

exports.handleKafkaNotificationReceiptAndProcessingSwitch = async function (value) {
    try {
        if (value == "on") {
            try {                
            console.log("*************************************************************");
            console.log("Kafka is switched on");
            console.log("*************************************************************");
            console.log("******** Worker thread information is " +worker);
            if(!workerisLive){
                console.log("worker is not live, so starting Kafka");
                exports.connectToKafka();
            }else{
                console.log("worker is live, so could not start Kafka");
            }
            //await worker.postMessage({ action: "start" });
            } catch (error) {
                console.log("*****************************");
                console.log("Problem in executing Worker.postmessage");                
                console.log(error);
                console.log("*****************************");
            }
        } else {
            try {
            console.log("*************************************************************");
            console.log("Kafka is switched off");
            console.log("*************************************************************");
            await worker.postMessage({ action: "stop" });    
            workerisLive = false;            
            } catch (error) {
                console.log("*****************************");
                console.log("Problem in executing Worker.postmessage");               
                console.log(error);
                console.log("*****************************");
            }
        }
    } catch (error) {
        console.log(error);
    }
}

exports.connectToKafka = async function () {
  try {
    let ltpForKafkaClient = await exports.getKafkaClient();
    let groupId = await exports.getKafkaGroupId(ltpForKafkaClient);
    let clientId = await exports.getKafkaClientId(ltpForKafkaClient);
    let brokerList = [].concat(await exports.getBrokerForKafka(ltpForKafkaClient));
    let kafkaClientList = await exports.getKafkaClientList();
    let kafkaTopic = await exports.getKafkaTopicName(kafkaClientList);
    
    worker = new Worker(path.resolve(__dirname, "KafkaWorker.js"), {
      workerData: { groupId, clientId, brokerList, topics: kafkaTopic}
    });
    
    console.log("Worker object : " + worker)
    workerisLive = true;
    worker.on("message", (msg) => {        
        console.log("Worker:", msg);
        console.log("Cruise:", msg);
    });
    worker.on("error", (err) => {
        console.error("Worker error:", err);
        console.error("Worker error: Cruise ", err);
    });
    worker.on("exit", (code) => {
      console.log(`Kafka worker exited with code ${code}`);
      console.error(`Cruise Kafka worker exited with code ${code}`);
      workerisLive = false;
      if(code!==0){
        console.log("Restarting worker...");
        setTimeout(()=>{
            exports.connectToKafka();
        },1000)
      }
    });

    return worker; // if you want to manage it later (pause/resume)
  } catch (error) {
    console.log(error);
    console.error("Error in starting Kafka worker:", error);
  }
};

exports.getBrokerForKafka = async function (kafkaClientLtp) {
    try {
        let broker = "";
        let kafkaHttpClientLtpUuid = kafkaClientLtp[onfAttributes.LOGICAL_TERMINATION_POINT.SERVER_LTP][0];
        let kafkaHttpClientLtp = await controlConstruct.getLogicalTerminationPointAsync(kafkaHttpClientLtpUuid);
        let kafkaTcpClientLtpUuid = kafkaHttpClientLtp[onfAttributes.LOGICAL_TERMINATION_POINT.SERVER_LTP][0];
        let remoteAddress = await TcpClientInterface.getRemoteAddressAsync(kafkaTcpClientLtpUuid);
        let address = "";
        if (remoteAddress.hasOwnProperty(onfAttributes.TCP_CLIENT.IP_ADDRESS)) {
            address = remoteAddress[onfAttributes.TCP_CLIENT.IP_ADDRESS][onfAttributes.TCP_CLIENT.IPV_4_ADDRESS];
        } else if (remoteAddress.hasOwnProperty(onfAttributes.TCP_CLIENT.DOMAIN_NAME)) {
            address = remoteAddress[onfAttributes.TCP_CLIENT.DOMAIN_NAME];
        }
        let remotePort = await TcpClientInterface.getRemotePortAsync(kafkaTcpClientLtpUuid);
        broker = address + ":" + remotePort;
        return broker;
    } catch (error) {
        console.log(error);
        return [];
    }
}

exports.getKafkaClient = async function () {
    try {
        let ltpListForKafkaClient = await controlConstruct.getLogicalTerminationPointListAsync(LayerProtocol.layerProtocolNameEnum.KAFKA_CLIENT);
        let ltpForKafkaClient = ltpListForKafkaClient[0];
        return ltpForKafkaClient;
    } catch (error) {
        console.log(error);
        return undefined;
    }
}

exports.getKafkaClientList = async function () {
    try {
        let ltpListForKafkaClientList = await controlConstruct.getLogicalTerminationPointListAsync(LayerProtocol.layerProtocolNameEnum.KAFKA_CLIENT);
        return ltpListForKafkaClientList;
    } catch (error) {
        console.log(error);
        return [];
    }
}

exports.getKafkaClientId = async function (kafkaClientLtp) {
    try {
        let kafkaConfig = kafkaClientLtp[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0][onfAttributes.LAYER_PROTOCOL.KAFKA_CLIENT_INTERFACE_PAC][onfAttributes.KAFKA_CLIENT.CONFIGURATION];
        let clientId = kafkaConfig[onfAttributes.KAFKA_CLIENT.CLIENT_ID];
        return clientId;
    } catch (error) {
        console.log(error);
        return undefined;
    }
}

exports.getKafkaGroupId = async function (kafkaClientLtp) {
    try {
        let kafkaConfig = kafkaClientLtp[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0][onfAttributes.LAYER_PROTOCOL.KAFKA_CLIENT_INTERFACE_PAC][onfAttributes.KAFKA_CLIENT.CONFIGURATION];
        let groupId = kafkaConfig[onfAttributes.KAFKA_CLIENT.GROUP_ID];
        return groupId;
    } catch (error) {
        console.log(error);
        return undefined;
    }
}

exports.getKafkaTopicName = async function (kafkaClientLtpList) {
    let topics = [];
    try {
        for (let index = 0; index < kafkaClientLtpList.length; index++) {
            const kafkaClientLtp = kafkaClientLtpList[index];
            let kafkaConfig = kafkaClientLtp[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0][onfAttributes.LAYER_PROTOCOL.KAFKA_CLIENT_INTERFACE_PAC][onfAttributes.KAFKA_CLIENT.CONFIGURATION];
            let topicName = kafkaConfig[onfAttributes.KAFKA_CLIENT.TOPIC_NAME];
            topics.push(topicName);
        }
        return topics;
    } catch (error) {
        console.log(error);
        return undefined;
    }
}
