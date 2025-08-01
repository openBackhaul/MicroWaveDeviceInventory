const { diff } = require('deep-diff');
const { getCandidateDevice } = require('./deviceSelector');
const {
  getCachedControlConstruct,
  getLiveControlConstruct
} = require('./controlConstructService');
const { logResult } = require('./elasticService');
const updatePeriodMs  = 60000;

// device metadata list
const deviceMetadataList = [
{
	"mount-name" : "513250010",
	"connection-status" : "connected",
	"changed-to-disconnected-time": "2025-07-15T12:44:21.010Z",
	"added-to-device-list-time" : "2025-07-15T12:44:21.010Z",
	"last-complete-control-construct-update-time-attempt": "2025-07-15T12:44:21.010Z",
	"last-successful-complete-control-construct-update-time" : "2025-07-15T12:44:21.010Z",
	"last-control-construct-notification-update-time" : "2025-07-15T12:44:21.010Z",
	"number-of-partial-updates-since-last-complete-update" : 3,
	"schema-cache-directory": "schema cache directory",
	"device-type":"MLTN",
	"vendor":"Ericsson",
	"locked-status":false,
	"exclude-from-qm":false
},
{
	"mount-name" : "513250006",
	"connection-status" : "connected",
	"changed-to-disconnected-time": "2025-07-15T12:44:21.010Z",
	"added-to-device-list-time" : "2025-07-15T12:44:21.010Z",
	"last-complete-control-construct-update-time-attempt": "2025-07-15T12:44:21.010Z",
	"last-successful-complete-control-construct-update-time" : "2025-07-15T12:44:21.010Z",
	"last-control-construct-notification-update-time" : "2025-07-15T12:44:21.010Z",
	"number-of-partial-updates-since-last-complete-update" : 3,
	"schema-cache-directory": "schema cache directory",
	"device-type":"ALCP2E",
	"vendor":"SIAE",
	"locked-status":false,
	"exclude-from-qm":false
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

async function performQualityMeasurement() {
  const device = getCandidateDevice(deviceMetadataList);

  if (!device) {
    console.log('No eligible device for quality measurement');
    return;
  }

  const cached = await getCachedControlConstruct(device["mount-name"]);
  const live = await getLiveControlConstruct(device["mount-name"]);

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
  //await logResult(result);
}

//setInterval(performQualityMeasurement, updatePeriodMs);

module.exports = {
  performQualityMeasurement
};


