
const { readRecords } = require('./elasticService');
const individualServices = require('../../../IndividualServicesService');
const RandExp = require('randexp');

async function getCachedControlConstruct(mountName) {
  // retrieval from local cache
  let cachedControlConstruct = await readRecords(mountName);
  return cachedControlConstruct;
}

async function getLiveControlConstruct(mountName) {
  // live fetch from device
  try{
  let url = "/core-model-1-4:network-control-domain=live/control-construct=" + mountName;
  let user = "CacheQualityMeasurementProcess";
  let originator = "MicroWaveDeviceInventory";
  let xCorrelator = getRandomXCorrelator();
  let traceIndicator = "1";
  let customerJourney = "CacheQualityMeasurementProcess";
  let liveControlConstruct = await individualServices.getLiveControlConstruct(url, 
    user, 
    originator, 
    xCorrelator, 
    traceIndicator, 
    customerJourney, 
    mountName);
  return liveControlConstruct;
  }catch(error){
    console.log(error);
  }
}

function getRandomXCorrelator() {
    let randomXCorrelatorString;
    try {
        randomXCorrelatorString = new RandExp(/^[0-9A-Fa-f]{8}(?:-[0-9A-Fa-f]{4}){3}-[0-9A-Fa-f]{12}$/).gen();
    } catch (error) {
        console.log("error");
        console.log(error);
    }
    return randomXCorrelatorString;
}

module.exports = {
  getCachedControlConstruct,
  getLiveControlConstruct
};