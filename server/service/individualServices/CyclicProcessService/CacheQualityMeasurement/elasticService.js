
'use strict';

const elkUtils = require('../../ElasticSearchUtility');

exports.writeCacheQualityListToElasticsearch = function (qualityList) {
  return new Promise(async function (resolve, reject) {
    try {
      let qualityListToWrite = '{"cache-quality-statistics":' + qualityList + '}';
      let result = await elkUtils.recordRequest(qualityListToWrite, "cache-quality-statistics");
      if (result.took !== undefined) {
        resolve(true);
      } else {
        reject("Error in writing CacheQuality list to elasticsearch.")
      }
    } catch (error) {
      reject(error);
    }
  })
}

exports.readCacheQualityListFromElasticsearch = function () {
  return new Promise(async function (resolve, reject) {
    try {
      let esCacheQualityList = [];
      let result = await elkUtils.readRecords("cache-quality-statistics");
      if (result != undefined) {
        esCacheQualityList = result["cache-quality-statistics"];
      }
      resolve(esCacheQualityList);
    } catch (error) {
      reject(error);
    }
  })
}