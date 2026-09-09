
// const { createResultArray } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const logger = require('../LoggingService.js').getLogger();

/**
 * Read data from ES
 *
 * response value expected for this operation
 **/
export async function readRecords(cc) {
  try {
    const indexAlias = common[1].indexAlias
    const client = common[1].EsClient;

    const result = await client.get({
      'index': indexAlias, //"my-index-000001",
      'id': cc // mountname
    });

    const src = result?.body?._source;
    if (!src) {
      return undefined;
    }
    return src;
  } catch (error) {
    logger.error(`[READ-ERROR] Error reading ES for Mountname=${cc}: ${error.message}`);
    throw (error);
  }
}

// async function ReadRecordsMountName(cc) {
//   try {
//     const indexAlias = common[1].indexAlias;
//     const client = common[1].EsClient;

//     const start = Date.now();
//     //logAlarmNotificationUpdate(`Mountname=${cc} - Reading ES record`);

//     const result = await client.get({ index: indexAlias, id: cc });

//     const duration = (Date.now() - start) / 1000;
//     //logAlarmNotificationUpdate(`Mountname=${cc} - Completed ES read in ${duration}s`);

//     const src = result?.body?._source;
//     if (!src) {
//       return undefined;
//     }
//     return src;
//   } catch (error) {
//     //logAlarmNotificationUpdate(`[READ-ERROR] Error reading ES for Mountname=${cc} - ${error.message}`);
//     logger.error(`[READ-ERROR] Error reading ES for Mountname=${cc}: ${error.message}`);
//     return undefined;
//   }
// }

/**
 * Records a request
 *
 * body controlconstruct 
 * no response value expected for this operation
 **/
export async function recordRequest(body, cc) {
  let pipelineExists = false;
  const client = common[1].EsClient;
  try {
    // Check if the pipeline exists
    await client.ingest.getPipeline({ 'id': 'mwdi' });
    pipelineExists = true;
  } catch (error) {
    if (error.statusCode === 404) {
      // Pipeline does not exist
      logger.warn(`Pipeline mwdi not found. Indexing without the pipeline.`);
      //logAlarmNotificationUpdate(`Pipeline mwdi not found. Indexing without the pipeline for ${cc}`);
    } else {
      // Other errors
      logger.error(error, "An error occurred while checking the pipeline:");
      //logAlarmNotificationUpdate(`An error occurred while checking the pipeline for ${cc}. Error: ${error.message}`);
      throw error; // Re-throw the error if it's not a 404
    }
  }

  try {
    const indexAlias = common[1].indexAlias
    const startTime = process.hrtime();

    const indexParams = {
      'index': indexAlias,
      'id': cc,
      'body': body,
    };

    if (pipelineExists) {
      indexParams['pipeline'] = 'mwdi';
    }

    const start = Date.now();
    //logAlarmNotificationUpdate(`Mountname=${cc} - Writing to ES`);

    const result = await client.index(indexParams);
    const backendTime = process.hrtime(startTime);

    const duration = (Date.now() - start) / 1000;
    //logAlarmNotificationUpdate(`Mountname=${cc} - Completed ES write in ${duration}s`);


    if (result == undefined || result.body == undefined) {
      logger.warn("result is undefined, ELK not updated")
      //logAlarmNotificationUpdate(`result is undefined, ELK not updated for ${cc}`);
      //return { "took": -1, ok: false, retry: true };
      return { ok: false, retry: true, reason: "empty_response", "took": -1 };
    }

    if (result.body.result == 'created' || result.body.result == 'updated') {
      logger.debug(`ELK - Result is: ${result.body.result}`);
      //logAlarmNotificationUpdate(`ELK - Result is: ${result.body.result} for ${cc}`);
      return { "took": backendTime[0] * 1000 + backendTime[1] / 1000000, ok: true, retry: false };
    } else {
      logger.warn(`ELK - result is: ${result.body.result}`);
      //logAlarmNotificationUpdate(`ELK - result is: ${result.body.result} for ${cc}`);
      return { "took": -1, ok: false, retry: true, reason: `unexpected_result_${result.body.result}` };
    }
  } catch (error) {
    //logAlarmNotificationUpdate(`[WRITE-ERROR] Mountname=${cc} - ${error.message}`);
    logger.error("ELK - Something goes wrong in recordRequest, check the DEBUG level");
    //logAlarmNotificationUpdate(`ELK - Something goes wrong in recordRequest for ${cc}, check the DEBUG level`);
    logger.trace(error);
    //logAlarmNotificationUpdate(`Error for ${cc}: ${error}`);
    return { ok: false, retry: true, error: error.message, reason: error.message };
  }
}

/**
 * delete a request
 *
 * body controlconstruct 
 * no response value expected for this operation
 **/
export async function deleteRequest(cc) {
  try {
    const indexAlias = common[1].indexAlias
    const client = common[1].EsClient;
    const startTime = process.hrtime();
    const result = await client.delete({
      'id': cc,
      'index': indexAlias
    });
    const backendTime = process.hrtime(startTime);
    if (result.body.result == 'created' || result.body.result == 'updated') {
      return { "took": backendTime[0] * 1000 + backendTime[1] / 1000000 };
    }
  } catch (error) {
    logger.error(error);
  }
}


// To be optimized

/**
 * Read only _id list from ES
 *
 * response value expected for this operation
 **/
export async function readIdsFromEs() {
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
    const client = common[1].EsClient;

    const ids = [];
    const batchSize = 2000;  // tune 1000–5000
    const keepAlive = "1m";

    // create scroll context
    let resp = await client.search({
      'index': indexAlias,
      _source: false,
      'size': batchSize,
      'scroll': keepAlive,
      'body': {
        query: { match_all: {} },
        // optional: make it slightly lighter by not scoring
        //track_total_hits: false
      }
    });

    let scrollId = resp.body?._scroll_id;

    while (true) {
      const hits = resp.body?.hits?.hits || [];
      if (hits.length === 0) {
        break;
      }

      for (const h of hits) {
        ids.push(h._id);
      }

      resp = await client.scroll({
        'scroll_id': scrollId,
        'scroll': keepAlive
      });

      scrollId = resp.body?._scroll_id;
    }

    // cleanup
    if (scrollId) {
      await client.clearScroll({ scroll_id: scrollId }).catch(() => { });
    }

    return ids;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}


/**
* Records a request
*
* body controlconstruct 
* no response value expected for this operation
**/
const _recordRequest = async function (body, cc, isAddPropertyToMapping = false) {
  let pipelineExists = false;
  let client = common[1].EsClient;
  try {
    // Check if the pipeline exists
    await client.ingest.getPipeline({ id: 'mwdi' });
    pipelineExists = true;
  } catch (error) {
    if (error.statusCode === 404) {
      // Pipeline does not exist
      logger.warn(`Pipeline mwdi not found. Indexing without the pipeline.`);
    } else {
      // Other errors
      logger.error("An error occurred while checking the pipeline:", error);
      throw error; // Re-throw the error if it's not a 404
    }
  }

  try {
    let indexAlias = common[1].indexAlias;
    let startTime = process.hrtime();

    /* if (isAddPropertyToMapping) {
      await ensureLastCompleteCcUpdateTimeFieldMapping(client, indexAlias);
    } */
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
    logger.error(error);
  }
  return {};
};
export { _recordRequest as recordRequest };

let lastCompleteCcUpdateTimeMappingEnsured = false;

async function ensureLastCompleteCcUpdateTimeFieldMapping(client, indexAlias) {
  if (lastCompleteCcUpdateTimeMappingEnsured) {
    return;
  }

  await client.indices.putMapping({
    index: indexAlias,
    body: {
      properties: {
        "last-complete-control-construct-update-time": {
          type: "date"
        }
      }
    }
  });

  lastCompleteCcUpdateTimeMappingEnsured = true;
}
