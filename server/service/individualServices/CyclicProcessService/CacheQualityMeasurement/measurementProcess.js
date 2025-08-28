const {
  diff
} = require('deep-diff');

const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const {
  getCachedControlConstruct,
  getLiveControlConstruct
} = require('./controlConstructService');

const {
  writeCacheQualityListToElasticsearch,
  readCacheQualityListFromElasticsearch
} = require('./elasticService');

const deviceMetaDataPriorityList = require('../DeviceMetaDataProcess/DeviceMetaDataPriorityList');
const utility = require('../../utility');
const deviceMetadataCacheUpdate = require('../DeviceMetaDataProcess/DeviceMetaDataCacheUpdate');
let iteration = 1;


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
  setInterval(performQualityMeasurement, valueInSeconds * 1000);
}


async function performQualityMeasurement() {
  try {    
  console.log('*******************************************************************************************************');
  console.log('*        CACHE QUALITY MEASUREMENT PROCESS CYCLE - ITERATION ' + iteration++ + ' STARTED                                *');
  console.log('*                                                                                                     *');
  console.log('*                                 ( ' + utility.getTime() + ' )                                      *');
  console.log('*                                                                                                     *');
  console.log('*******************************************************************************************************');
  
  let device = deviceMetaDataPriorityList.getNextDeviceMetaDataForQm(); 
  if (device != undefined) {
    try {
      if (!device) {
        console.log('No eligible device for quality measurement');
        return;
      }
      let cached = await getCachedControlConstruct(device["mount-name"]);
      let live = await getLiveControlConstruct(device["mount-name"]);

      const differences = diff(cached, live);
      const score = calculateScore(differences);
      let deviceType = deviceMetadataCacheUpdate.getDeviceTypeAndVendorForDevice(device["mount-name"]);
      const result = {
        'mount-name': device["mount-name"],
        'device-type': deviceType.deviceType,
        'vendor': deviceType.vendor,
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
      
      let qualityMeasurementSampleNumber = (await getQualityMeasurementSampleNumber()) - 1;
      if(cacheQualityListFromElasticSearch.length >= (qualityMeasurementSampleNumber)){
        let difference = cacheQualityListFromElasticSearch.length - qualityMeasurementSampleNumber;
        for (let index = 0; index < difference; index++) {
          cacheQualityListFromElasticSearch.shift();
        }
      }
      cacheQualityListFromElasticSearch.push(result);
      let stringifiedResult = JSON.stringify(cacheQualityListFromElasticSearch);
      await writeCacheQualityListToElasticsearch(stringifiedResult);
    } catch (error) {
      console.log(error);
    }
  }
  
  } catch (error) {
    console.log(error)
  }
}

async function getQualityMeasurementSampleNumber(){
  let profileInstance = await utility.getIntegerProfileForIntegerName("qualityMeasurementSampleNumber");
  let qualityMeasurementSampleNumber = profileInstance[onfAttributes.INTEGER_PROFILE.PAC][onfAttributes.INTEGER_PROFILE.CONFIGURATION][onfAttributes.INTEGER_PROFILE.INTEGER_VALUE];
  return qualityMeasurementSampleNumber;
}


module.exports = {
  performQualityMeasurementAsPerCycle
};
