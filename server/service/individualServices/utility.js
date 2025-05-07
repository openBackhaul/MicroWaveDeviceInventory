const Profile = require('onf-core-model-ap/applicationPattern/onfModel/models/Profile');
const ProfileCollection = require('onf-core-model-ap/applicationPattern/onfModel/models/ProfileCollection');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const { createResultArray } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');

exports.getStringValueForStringProfileNameAsync = async function (stringProfileName) {
    let stringValue;
    let profileList = await ProfileCollection.getProfileListAsync();
    for (let i = 0; i < profileList.length; i++) {
        let profileInstance = profileList[i];
        let profileName = profileInstance[onfAttributes.PROFILE.PROFILE_NAME];
        if (profileName == Profile.profileNameEnum.STRING_PROFILE) {
            let stringName = profileInstance[onfAttributes.STRING_PROFILE.PAC][onfAttributes.STRING_PROFILE.CAPABILITY][onfAttributes.STRING_PROFILE.STRING_NAME];
            if (stringName == stringProfileName) {
                stringValue = profileInstance[onfAttributes.STRING_PROFILE.PAC][onfAttributes.STRING_PROFILE.CONFIGURATION][onfAttributes.STRING_PROFILE.STRING_VALUE];
                break;
            }
        }
    }
    return stringValue;
}


exports.getIntegerProfileForIntegerName = async function (integerProfileName) {
    let integerProfile = {};
    let profileList = await ProfileCollection.getProfileListAsync();
    for (let i = 0; i < profileList.length; i++) {
        let profileInstance = profileList[i];
        let profileName = profileInstance[onfAttributes.PROFILE.PROFILE_NAME];
        if (profileName == Profile.profileNameEnum.INTEGER_PROFILE) {
            let integerName = profileInstance[onfAttributes.INTEGER_PROFILE.PAC][onfAttributes.INTEGER_PROFILE.CAPABILITY][onfAttributes.INTEGER_PROFILE.INTEGER_NAME];
            if (integerName == integerProfileName) {
                integerProfile = profileInstance;
                break;
            }
        }
    }
    return integerProfile;
}

/**
 * Read from ES
 *
 * response value expected for this operation
 **/
exports.ReadRecords = async function(cc) {
    try {
      let size = 100;
      let from = 0;
      let query = {
  
        term: {
          _id: cc
        }
  
      };
      let indexAlias = common[1].indexAlias
      let client = await common[1].EsClient;
      const result = await client.search({
        index: indexAlias,
        body: {
          query: query
        }
      });
      const resultArray = createResultArray(result);
      return (resultArray[0])
    } catch (error) {
      console.error(error);
      throw(error);
    }
  }

  /**
 * Records a request
 *
 * body controlconstruct 
 * no response value expected for this operation
 **/
exports.recordRequest = async function(body, cc) {
    let pipelineExists = false;
    let client = await common[1].EsClient;
    try {
      // Check if the pipeline exists
      await client.ingest.getPipeline({ id: 'mwdi' });
      pipelineExists = true;
    } catch (error) {
      if (error.statusCode === 404) {
        // Pipeline does not exist
        console.warn(`Pipeline mwdi not found. Indexing without the pipeline.`);
      } else {
        // Other errors
        console.error("An error occurred while checking the pipeline:", error);
        throw error; // Re-throw the error if it's not a 404
      }
    }
  
    try {
      let indexAlias = common[1].indexAlias
      let startTime = process.hrtime();
  
      let indexParams = {
        index: indexAlias,
        id: cc,
        body: body
      };
  
      if (pipelineExists) {
        indexParams.pipeline = 'mwdi';
      }
  
      let result = await client.index(indexParams);
      let backendTime = process.hrtime(startTime);
      if (result.body.result == 'created' || result.body.result == 'updated') {
        return { "took": backendTime[0] * 1000 + backendTime[1] / 1000000 };
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
 * getTime()
 * 
 * Returns formatted date/time information Ex: ( 25/11/2023 09:43.14 )
 */

exports.getTime = function() {
  let d = new Date();
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

exports.arraysHaveSameElements = async function (array1, array2) {

  try {

    if (array1.length !== array2.length) {

      return false;

    }

 

    const frequencyMap = {};

    for (const element of array1) {

      frequencyMap[element] = (frequencyMap[element] || 0) + 1;

    }

 

    for (const element of array2) {

      if (!(element in frequencyMap)) {

        return false;

      }

      frequencyMap[element]--;

 

      if (frequencyMap[element] === 0) {

        delete frequencyMap[element];

      }

    }

 

    return Object.keys(frequencyMap).length === 0;

  } catch (error) {

    console.error(error);

  }

}

 