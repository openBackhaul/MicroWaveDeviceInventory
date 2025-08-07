const LayerProtocol = require('onf-core-model-ap/applicationPattern/onfModel/models/LayerProtocol');
const controlConstruct = require('onf-core-model-ap/applicationPattern/onfModel/models/ControlConstruct');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const TcpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpClientInterface');
const kafka = require("onf-core-model-ap/applicationPattern/services/KafkaConsumerService");
const individualServices = require("../IndividualServicesService");

const handleNotifications = (receivedMessage) => {
    try {        
    let notification = JSON.parse(receivedMessage);
    console.log(notification);
    let notificationType = getNotificationType(notification);
    if (notificationType == "ALARM") {
        individualServices.regardDeviceAlarm(notification);
    } else if (notificationType == "ATTRIBUTE_VALUE_CHANGED") {
        individualServices.regardDeviceAttributeValueChange(notification);
    } else if (notificationType == "OBJECT_CREATION") {
        individualServices.regardDeviceObjectCreation(notification);
    } else if (notificationType == "OBJECT_DELETION") {
        individualServices.regardDeviceObjectDeletion(notification);
    }
    } catch (error) {
        console.log(error);
    }
}

function getNotificationType(notification) {
    let notificationType = Object.keys(notification)[0];
    if (notificationType.includes("alarm-event")) {
        return "ALARM";
    } else if (notificationType.includes("attribute-value-changed")) {
        return "ATTRIBUTE_VALUE_CHANGED";
    } else if (notificationType.includes("object-creation")) {
        return "OBJECT_CREATION";
    } else if (notificationType.includes("object-deletion")) {
        return "OBJECT_DELETION";
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
        await kafka.connect(groupId, clientId, brokerList);
        kafka.subscribeMessages(kafkaTopic, handleNotifications);
    } catch (error) {
        console.log("Error in connection to kafka");
        console.log(error);
    }
}

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