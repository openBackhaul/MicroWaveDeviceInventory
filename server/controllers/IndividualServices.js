'use strict';

var utils = require('../utils/writer.js');
var IndividualServices = require('../service/IndividualServicesService');

module.exports.bequeathYourDataAndDie = function bequeathYourDataAndDie (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.bequeathYourDataAndDie(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedActualEquipment = function getCachedActualEquipment (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getCachedActualEquipment(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedAirInterfaceCapability = function getCachedAirInterfaceCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedAirInterfaceCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedAirInterfaceConfiguration = function getCachedAirInterfaceConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedAirInterfaceConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedAirInterfaceHistoricalPerformances = function getCachedAirInterfaceHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedAirInterfaceHistoricalPerformances(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedAirInterfaceStatus = function getCachedAirInterfaceStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedAirInterfaceStatus(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedAlarmCapability = function getCachedAlarmCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  IndividualServices.getCachedAlarmCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedAlarmConfiguration = function getCachedAlarmConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  IndividualServices.getCachedAlarmConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedAlarmEventRecords = function getCachedAlarmEventRecords (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  IndividualServices.getCachedAlarmEventRecords(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedCoChannelProfileCapability = function getCachedCoChannelProfileCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getCachedCoChannelProfileCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedCoChannelProfileConfiguration = function getCachedCoChannelProfileConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getCachedCoChannelProfileConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedConnector = function getCachedConnector (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedConnector(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedContainedHolder = function getCachedContainedHolder (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedContainedHolder(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedControlConstruct = function getCachedControlConstruct (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  IndividualServices.getCachedControlConstruct(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedCurrentAlarms = function getCachedCurrentAlarms (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  IndividualServices.getCachedCurrentAlarms(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedEquipment = function getCachedEquipment (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getCachedEquipment(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedEthernetContainerCapability = function getCachedEthernetContainerCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedEthernetContainerCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedEthernetContainerConfiguration = function getCachedEthernetContainerConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedEthernetContainerConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedEthernetContainerHistoricalPerformances = function getCachedEthernetContainerHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedEthernetContainerHistoricalPerformances(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedEthernetContainerStatus = function getCachedEthernetContainerStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedEthernetContainerStatus(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedExpectedEquipment = function getCachedExpectedEquipment (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedExpectedEquipment(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedFirmwareCollection = function getCachedFirmwareCollection (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  IndividualServices.getCachedFirmwareCollection(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedFirmwareComponentCapability = function getCachedFirmwareComponentCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields) {
  IndividualServices.getCachedFirmwareComponentCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedFirmwareComponentList = function getCachedFirmwareComponentList (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields) {
  IndividualServices.getCachedFirmwareComponentList(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedFirmwareComponentStatus = function getCachedFirmwareComponentStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields) {
  IndividualServices.getCachedFirmwareComponentStatus(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedHybridMwStructureCapability = function getCachedHybridMwStructureCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedHybridMwStructureCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedHybridMwStructureConfiguration = function getCachedHybridMwStructureConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedHybridMwStructureConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedHybridMwStructureHistoricalPerformances = function getCachedHybridMwStructureHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedHybridMwStructureHistoricalPerformances(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedHybridMwStructureStatus = function getCachedHybridMwStructureStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedHybridMwStructureStatus(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedLogicalTerminationPoint = function getCachedLogicalTerminationPoint (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getCachedLogicalTerminationPoint(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedLtpAugment = function getCachedLtpAugment (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getCachedLtpAugment(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedMacInterfaceCapability = function getCachedMacInterfaceCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedMacInterfaceCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedMacInterfaceConfiguration = function getCachedMacInterfaceConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedMacInterfaceConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedMacInterfaceHistoricalPerformances = function getCachedMacInterfaceHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedMacInterfaceHistoricalPerformances(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedMacInterfaceStatus = function getCachedMacInterfaceStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedMacInterfaceStatus(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedPolicingProfileCapability = function getCachedPolicingProfileCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getCachedPolicingProfileCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedPolicingProfileConfiguration = function getCachedPolicingProfileConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getCachedPolicingProfileConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedProfile = function getCachedProfile (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getCachedProfile(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedProfileCollection = function getCachedProfileCollection (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  IndividualServices.getCachedProfileCollection(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedPureEthernetStructureCapability = function getCachedPureEthernetStructureCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedPureEthernetStructureCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedPureEthernetStructureConfiguration = function getCachedPureEthernetStructureConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedPureEthernetStructureConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedPureEthernetStructureHistoricalPerformances = function getCachedPureEthernetStructureHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedPureEthernetStructureHistoricalPerformances(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedPureEthernetStructureStatus = function getCachedPureEthernetStructureStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedPureEthernetStructureStatus(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedQosProfileCapability = function getCachedQosProfileCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getCachedQosProfileCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedQosProfileConfiguration = function getCachedQosProfileConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getCachedQosProfileConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedSchedulerProfileCapability = function getCachedSchedulerProfileCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getCachedSchedulerProfileCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedSchedulerProfileConfiguration = function getCachedSchedulerProfileConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getCachedSchedulerProfileConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedVlanInterfaceCapability = function getCachedVlanInterfaceCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedVlanInterfaceCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedVlanInterfaceConfiguration = function getCachedVlanInterfaceConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedVlanInterfaceConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedVlanInterfaceHistoricalPerformances = function getCachedVlanInterfaceHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedVlanInterfaceHistoricalPerformances(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedVlanInterfaceStatus = function getCachedVlanInterfaceStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedVlanInterfaceStatus(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedWireInterfaceCapability = function getCachedWireInterfaceCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedWireInterfaceCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedWireInterfaceConfiguration = function getCachedWireInterfaceConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedWireInterfaceConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedWireInterfaceHistoricalPerformances = function getCachedWireInterfaceHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedWireInterfaceHistoricalPerformances(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedWireInterfaceStatus = function getCachedWireInterfaceStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getCachedWireInterfaceStatus(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedWredProfileCapability = function getCachedWredProfileCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getCachedWredProfileCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCachedWredProfileConfiguration = function getCachedWredProfileConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getCachedWredProfileConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getChachedLogicalTerminationPoint = function getChachedLogicalTerminationPoint (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getChachedLogicalTerminationPoint(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getChachedLtpAugment = function getChachedLtpAugment (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getChachedLtpAugment(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveActualEquipment = function getLiveActualEquipment (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getLiveActualEquipment(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveAirInterfaceCapability = function getLiveAirInterfaceCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveAirInterfaceCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveAirInterfaceConfiguration = function getLiveAirInterfaceConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveAirInterfaceConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveAirInterfaceCurrentPerformance = function getLiveAirInterfaceCurrentPerformance (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveAirInterfaceCurrentPerformance(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveAirInterfaceHistoricalPerformances = function getLiveAirInterfaceHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveAirInterfaceHistoricalPerformances(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveAirInterfaceStatus = function getLiveAirInterfaceStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveAirInterfaceStatus(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveAlarmCapability = function getLiveAlarmCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  IndividualServices.getLiveAlarmCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveAlarmConfiguration = function getLiveAlarmConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  IndividualServices.getLiveAlarmConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveAlarmEventRecords = function getLiveAlarmEventRecords (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  IndividualServices.getLiveAlarmEventRecords(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveCoChannelProfileCapability = function getLiveCoChannelProfileCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getLiveCoChannelProfileCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveCoChannelProfileConfiguration = function getLiveCoChannelProfileConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getLiveCoChannelProfileConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveConnector = function getLiveConnector (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveConnector(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveContainedHolder = function getLiveContainedHolder (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveContainedHolder(req.url, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveControlConstruct = function getLiveControlConstruct (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountname, fields) {
  IndividualServices.getLiveControlConstruct(req.url, user, originator, xCorrelator, traceIndicator, customerJourney, mountname, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveCurrentAlarms = function getLiveCurrentAlarms (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  IndividualServices.getLiveCurrentAlarms(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveEquipment = function getLiveEquipment (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getLiveEquipment(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveEthernetContainerCapability = function getLiveEthernetContainerCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveEthernetContainerCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveEthernetContainerConfiguration = function getLiveEthernetContainerConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveEthernetContainerConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveEthernetContainerCurrentPerformance = function getLiveEthernetContainerCurrentPerformance (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveEthernetContainerCurrentPerformance(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveEthernetContainerHistoricalPerformances = function getLiveEthernetContainerHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveEthernetContainerHistoricalPerformances(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveEthernetContainerStatus = function getLiveEthernetContainerStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveEthernetContainerStatus(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveExpectedEquipment = function getLiveExpectedEquipment (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveExpectedEquipment(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveFirmwareCollection = function getLiveFirmwareCollection (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  IndividualServices.getLiveFirmwareCollection(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveFirmwareComponentCapability = function getLiveFirmwareComponentCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields) {
  IndividualServices.getLiveFirmwareComponentCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveFirmwareComponentList = function getLiveFirmwareComponentList (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields) {
  IndividualServices.getLiveFirmwareComponentList(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveFirmwareComponentStatus = function getLiveFirmwareComponentStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields) {
  IndividualServices.getLiveFirmwareComponentStatus(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveHybridMwStructureCapability = function getLiveHybridMwStructureCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveHybridMwStructureCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveHybridMwStructureConfiguration = function getLiveHybridMwStructureConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveHybridMwStructureConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveHybridMwStructureCurrentPerformance = function getLiveHybridMwStructureCurrentPerformance (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveHybridMwStructureCurrentPerformance(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveHybridMwStructureHistoricalPerformances = function getLiveHybridMwStructureHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveHybridMwStructureHistoricalPerformances(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveHybridMwStructureStatus = function getLiveHybridMwStructureStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveHybridMwStructureStatus(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveMacInterfaceCapability = function getLiveMacInterfaceCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveMacInterfaceCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveMacInterfaceConfiguration = function getLiveMacInterfaceConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveMacInterfaceConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveMacInterfaceCurrentPerformance = function getLiveMacInterfaceCurrentPerformance (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveMacInterfaceCurrentPerformance(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveMacInterfaceHistoricalPerformances = function getLiveMacInterfaceHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveMacInterfaceHistoricalPerformances(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveMacInterfaceStatus = function getLiveMacInterfaceStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveMacInterfaceStatus(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLivePolicingProfileCapability = function getLivePolicingProfileCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getLivePolicingProfileCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLivePolicingProfileConfiguration = function getLivePolicingProfileConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getLivePolicingProfileConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveProfile = function getLiveProfile (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getLiveProfile(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveProfileCollection = function getLiveProfileCollection (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields) {
  IndividualServices.getLiveProfileCollection(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLivePureEthernetStructureCapability = function getLivePureEthernetStructureCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLivePureEthernetStructureCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLivePureEthernetStructureConfiguration = function getLivePureEthernetStructureConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLivePureEthernetStructureConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLivePureEthernetStructureCurrentPerformance = function getLivePureEthernetStructureCurrentPerformance (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLivePureEthernetStructureCurrentPerformance(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLivePureEthernetStructureHistoricalPerformances = function getLivePureEthernetStructureHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLivePureEthernetStructureHistoricalPerformances(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLivePureEthernetStructureStatus = function getLivePureEthernetStructureStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLivePureEthernetStructureStatus(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveQosProfileCapability = function getLiveQosProfileCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getLiveQosProfileCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveQosProfileConfiguration = function getLiveQosProfileConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getLiveQosProfileConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveSchedulerProfileCapability = function getLiveSchedulerProfileCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getLiveSchedulerProfileCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveSchedulerProfileConfiguration = function getLiveSchedulerProfileConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getLiveSchedulerProfileConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveVlanInterfaceCapability = function getLiveVlanInterfaceCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveVlanInterfaceCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveVlanInterfaceConfiguration = function getLiveVlanInterfaceConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveVlanInterfaceConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveVlanInterfaceCurrentPerformance = function getLiveVlanInterfaceCurrentPerformance (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveVlanInterfaceCurrentPerformance(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveVlanInterfaceHistoricalPerformances = function getLiveVlanInterfaceHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveVlanInterfaceHistoricalPerformances(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveVlanInterfaceStatus = function getLiveVlanInterfaceStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveVlanInterfaceStatus(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveWireInterfaceCapability = function getLiveWireInterfaceCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveWireInterfaceCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveWireInterfaceConfiguration = function getLiveWireInterfaceConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveWireInterfaceConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveWireInterfaceCurrentPerformance = function getLiveWireInterfaceCurrentPerformance (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveWireInterfaceCurrentPerformance(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveWireInterfaceHistoricalPerformances = function getLiveWireInterfaceHistoricalPerformances (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveWireInterfaceHistoricalPerformances(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveWireInterfaceStatus = function getLiveWireInterfaceStatus (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields) {
  IndividualServices.getLiveWireInterfaceStatus(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, localId, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveWredProfileCapability = function getLiveWredProfileCapability (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getLiveWredProfileCapability(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLiveWredProfileConfiguration = function getLiveWredProfileConfiguration (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields) {
  IndividualServices.getLiveWredProfileConfiguration(user, originator, xCorrelator, traceIndicator, customerJourney, mountName, uuid, fields)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.notifyAttributeValueChanges = function notifyAttributeValueChanges (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.notifyAttributeValueChanges(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.notifyObjectCreations = function notifyObjectCreations (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.notifyObjectCreations(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.notifyObjectDeletions = function notifyObjectDeletions (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.notifyObjectDeletions(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.provideListOfActualDeviceEquipment = function provideListOfActualDeviceEquipment (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.provideListOfActualDeviceEquipment(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.provideListOfConnectedDevices = function provideListOfConnectedDevices (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.provideListOfConnectedDevices(user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.provideListOfDeviceInterfaces = function provideListOfDeviceInterfaces (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.provideListOfDeviceInterfaces(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.regardControllerAttributeValueChange = function regardControllerAttributeValueChange (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.regardControllerAttributeValueChange(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.regardDeviceAlarm = function regardDeviceAlarm (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.regardDeviceAlarm(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.regardDeviceAttributeValueChange = function regardDeviceAttributeValueChange (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.regardDeviceAttributeValueChange(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.regardDeviceObjectCreation = function regardDeviceObjectCreation (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.regardDeviceObjectCreation(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.regardDeviceObjectDeletion = function regardDeviceObjectDeletion (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  IndividualServices.regardDeviceObjectDeletion(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
