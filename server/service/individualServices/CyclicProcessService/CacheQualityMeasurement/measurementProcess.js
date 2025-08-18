const {
  diff
} = require('deep-diff');
const {
  getCandidateDevice
} = require('./deviceSelector');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const {
  getCachedControlConstruct,
  getLiveControlConstruct
} = require('./controlConstructService');
const {
  writeCacheQualityListToElasticsearch,
  readCacheQualityListFromElasticsearch
} = require('./elasticService');

const utility = require('../../utility');

let iteration = 1;

// Prathiba > Ishu : this needs to be removed after making the metadatalist as global variable
const deviceMetadataList = [{
    "mount-name": "513250010",
    "connection-status": "connected",
    "changed-to-disconnected-time": "2025-07-15T12:44:21.010Z",
    "added-to-device-list-time": "2025-07-15T12:44:21.010Z",
    "last-complete-control-construct-update-time-attempt": "2025-07-15T12:44:21.010Z",
    "last-successful-complete-control-construct-update-time": "2025-07-15T12:44:21.010Z",
    "last-control-construct-notification-update-time": "2025-07-15T12:44:21.010Z",
    "number-of-partial-updates-since-last-complete-update": 3,
    "schema-cache-directory": "schema cache directory",
    "device-type": "MLTN",
    "vendor": "Ericsson",
    "locked-status": false,
    "exclude-from-qm": false
  },
  {
    "mount-name": "513250006",
    "connection-status": "connected",
    "changed-to-disconnected-time": "2025-07-15T12:44:21.010Z",
    "added-to-device-list-time": "2025-07-15T12:44:21.010Z",
    "last-complete-control-construct-update-time-attempt": "2025-07-15T12:44:21.010Z",
    "last-successful-complete-control-construct-update-time": "2025-07-15T12:44:21.010Z",
    "last-control-construct-notification-update-time": "2025-07-15T12:44:21.010Z",
    "number-of-partial-updates-since-last-complete-update": 3,
    "schema-cache-directory": "schema cache directory",
    "device-type": "ALCP2E",
    "vendor": "SIAE",
    "locked-status": false,
    "exclude-from-qm": false
  }
];

function calculateScore(differences) {
  let attributeMismatch = 0;
  let classMismatch = 0;

  if (differences) {
    for (const d of differences) {
      if (['E', 'N', 'D'].includes(d.kind)) {
        if (typeof d.path?.[d.path.length - 1] === 'string') {
          attributeMismatch++;
        } else {
          classMismatch++;
        }
      }
    }
  }

  return {
    attributeMismatch,
    classMismatch,
    weightedScore: attributeMismatch * 1 + classMismatch * 5
  };
}

async function performQualityMeasurementAsPerCycle() {
  let profileInstance = await utility.getIntegerProfileForIntegerName("qualityMeasurementUpdatePeriod");
  let integerValue = profileInstance[onfAttributes.INTEGER_PROFILE.PAC][onfAttributes.INTEGER_PROFILE.CONFIGURATION][onfAttributes.INTEGER_PROFILE.INTEGER_VALUE];
  let valueInSeconds = integerValue * 60;
  setTimeout(performQualityMeasurement, valueInSeconds * 1000);
}

async function performQualityMeasurement() {
  try {
    const result = {
          'mount-name': "513250007",
          'device-type': "ALCP2E",
          'vendor': "SIAE",
          'timestamp': new Date().toISOString(),
          'attribute-mismatches': 5,
          'attribute-class-mismatches': 4,
          'weighted-score': 3
        };

        console.log(result);
        let cacheQualityListFromElasticSearch = await readCacheQualityListFromElasticsearch()
          .catch(error => {
            throw error;
          });

        cacheQualityListFromElasticSearch.push(result);
        let stringifiedResult = JSON.stringify(cacheQualityListFromElasticSearch);
        await writeCacheQualityListToElasticsearch(stringifiedResult);
  } catch (error) {
    console.log(error)
  }
}

/**async function performQualityMeasurement() {
  try {
    
  console.log('*******************************************************************************************************');
  console.log('*        CACHE QUALITY MEASUREMENT PROCESS CYCLE - ITERATION ' + iteration++ + ' STARTED                                *');
  console.log('*                                                                                                     *');
  console.log('*                                 ( ' + utility.getTime() + ' )                                      *');
  console.log('*                                                                                                     *');
  console.log('*******************************************************************************************************');

  // Prathiba > Ishu : "deviceMetadataList" needs to be replaced after making the metadatalist as global variable
  let deviceMetadataListForProcessing = [...deviceMetadataList];
  for (let index = 0; index < deviceMetadataListForProcessing.length; index++) {
    const device = deviceMetadataListForProcessing[index];
    if (device["connection-status"] == "connected" &&
      device["locked-status"] == false &&
      device["exclude-from-qm"] == false) {
      try {
        if (!device) {
          console.log('No eligible device for quality measurement');
          return;
        }
        let cached = await getCachedControlConstruct(device["mount-name"]);
        let live = await getLiveControlConstruct(device["mount-name"]);

        const differences = diff(cached, live);
        const score = calculateScore(differences);

        const result = {
          'mount-name': device.id,
          'device-type': device.type,
          'vendor': device.vendor,
          'timestamp': new Date().toISOString(),
          'attribute-mismatches': score.attributeMismatch,
          'attribute-class-mismatches': score.classMismatch,
          'weighted-score': score.weightedScore
        };

        console.log(result);
        let cacheQualityListFromElasticSearch = await readCacheQualityListFromElasticsearch()
          .catch(error => {
            throw error;
          });

        cacheQualityListFromElasticSearch.push(result);
        let stringifiedResult = JSON.stringify(cacheQualityListFromElasticSearch);
        await writeCacheQualityListToElasticsearch(stringifiedResult);
      } catch (error) {
        console.log(error);
      }
    }
  }
  } catch (error) {
    console.log(error)
  }
}
  **/


module.exports = {
  performQualityMeasurementAsPerCycle
};