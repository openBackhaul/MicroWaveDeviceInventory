const Profile = require('onf-core-model-ap/applicationPattern/onfModel/models/Profile');
const ProfileCollection = require('onf-core-model-ap/applicationPattern/onfModel/models/ProfileCollection');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const { createResultArray } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');

/**
 * This function returns the string-value object for given string-name
 * 
 * @param {String} stringProfileName - name of the string-profile
 * @returns {Object} stringValue - returns the integer-profile/configuration/string-value
 */
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

/**
 * This function returns the integer-profile object for given integer-name
 * 
 * @param {String} integerProfileName - name of the integer-profile
 * @returns {Object} integerProfile - returns the integer-profile instance for given integer-name
 */
exports.getIntegerProfileForIntegerName = async function (integerProfileName) {
  let integerProfile = {};
  let profileList = await ProfileCollection.getProfileListAsync();
  for (let i = 0; i < profileList.length; i++) {
    let profileInstance = profileList[i];
    let profileName = profileInstance[onfAttributes.PROFILE.PROFILE_NAME];
    if (profileName == Profile.profileNameEnum.INTEGER_PROFILE) {
      const pac = profileInstance[onfAttributes.INTEGER_PROFILE.PAC];
      const capability = pac?.[onfAttributes.INTEGER_PROFILE.CAPABILITY];
      const integerName = capability?.[onfAttributes.INTEGER_PROFILE.INTEGER_NAME];

      if (integerName == integerProfileName) {
        integerProfile = profileInstance;
        break;
      }
    }
  }
  return integerProfile;
}

/**
 * This function returns the mapping-list of given regex-profile instance
 * 
 * @param {String} expectedMappingName - name of the regex-pattern-mapping-profile
 * @returns {List} mappingList - value given in regex-pattern-mapping-profile/configuration/mapping-list
 */
exports.getMappingListForRegexProfile = async function (expectedMappingName) {
  let mappingList = [];
  let profileList = await ProfileCollection.getProfileListAsync();
  for (let i = 0; i < profileList.length; i++) {
    let profileInstance = profileList[i];
    let profileName = profileInstance[onfAttributes.PROFILE.PROFILE_NAME];
    if (profileName == Profile.profileNameEnum.REGEX_PATTERN_MAPPING_PROFILE) {
      let mappingName = profileInstance[onfAttributes.REGEX_PATTERN_MAPPING_PROFILE.PAC][onfAttributes.REGEX_PATTERN_MAPPING_PROFILE.CAPABILITY][onfAttributes.REGEX_PATTERN_MAPPING_PROFILE.MAPPING_NAME];
      if (mappingName == expectedMappingName) {
        mappingList = profileInstance[onfAttributes.REGEX_PATTERN_MAPPING_PROFILE.PAC][onfAttributes.REGEX_PATTERN_MAPPING_PROFILE.CONFIGURATION][onfAttributes.REGEX_PATTERN_MAPPING_PROFILE.MAPPING_LIST];
        break;
      }
    }
  }
  return mappingList;
}

/**
 * Read from ES
 *
 * response value expected for this operation
 **/
exports.ReadRecords = async function (cc) {
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
    throw (error);
  }
}

/**
* Records a request
*
* body controlconstruct 
* no response value expected for this operation
**/
exports.recordRequest = async function (body, cc) {
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
  return {};
}

/**
* getTime()
* 
* Returns formatted date/time information Ex: ( 25/11/2023 09:43.14 )
*/

exports.getTime = function () {
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

/**
 * returns time in milliseconds for given unit
 */
exports.calculateTimeInMilliSeconds = function (value, unit) {
  let timeInMilliseconds = 0;
  try {
    if (unit.includes("day")) timeInMilliseconds = parseInt(value) * 24 * 60 * 60 * 1000;
    else if (unit.includes("hour")) timeInMilliseconds = parseInt(value) * 60 * 60 * 1000;
    else if (unit.includes("minute")) timeInMilliseconds = parseInt(value) * 60 * 1000;
    else if (unit.includes("second")) timeInMilliseconds = parseInt(value) * 1000;
    else timeInMilliseconds = value;
    return timeInMilliseconds;
  } catch (error) {
    console.log(error);
    return 0;
  }
}


/**
 * Read only _id list from ES
 *
 * response value expected for this operation
 **/
exports.ReadIdsFromEs = async function () {
  /* try {
    let indexAlias = common[1].indexAlias
    let client = await common[1].EsClient;
    const result = await client.search({
      index: indexAlias,
      _source: false,
      from: 0,
      size: 9999
    });
    const resultArray = [];
    if (result.body.hits) {
      result.body.hits.hits.forEach((item) => {
        resultArray.push(item._id);
      });
    }
    return (resultArray)
  } catch (error) {
    console.error(error);
    throw (error);
  } */
  try {
    const indexAlias = common[1].indexAlias;
    const client = await common[1].EsClient;

    const ids = [];
    const batchSize = 2000;  // tune 1000–5000
    const keepAlive = "1m";

    // create scroll context
    let resp = await client.search({
      index: indexAlias,
      _source: false,
      size: batchSize,
      scroll: keepAlive,
      body: {
        query: { match_all: {} },
        // optional: make it slightly lighter by not scoring
        //track_total_hits: false
      }
    });

    let scrollId = resp.body?._scroll_id;

    while (true) {
      const hits = resp.body?.hits?.hits || [];
      if (hits.length === 0) break;

      for (const h of hits) ids.push(h._id);

      resp = await client.scroll({
        scroll_id: scrollId,
        scroll: keepAlive
      });

      scrollId = resp.body?._scroll_id;
    }

    // cleanup
    if (scrollId) {
      await client.clearScroll({ scroll_id: scrollId }).catch(() => {});
    }

    return ids;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * This function returns the string-name for given uuid
 * 
 * @param {String} uuid - uuid of the string-profile
 * @returns {String} stringName - returns the string-profile/capability/string-name
 */
exports.getStringNameForUuidAsync = async function (uuid) {
  let stringName;
  try {
    let profileList = await ProfileCollection.getProfileListForProfileNameAsync(Profile.profileNameEnum.STRING_PROFILE);
    for (let i = 0; i < profileList.length; i++) {
      let profileInstance = profileList[i];
      let stringProfileUuid = profileInstance["uuid"];
      if (stringProfileUuid == uuid) {
        stringName = profileInstance[onfAttributes.STRING_PROFILE.PAC][onfAttributes.STRING_PROFILE.CAPABILITY][onfAttributes.STRING_PROFILE.STRING_NAME];
        break;
      }
    }
    return stringName;
  } catch (error) {
    throw error;
  }

}


