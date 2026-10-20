
const { createResultArray } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const utility = require('./utility');
const logger = require('../LoggingService.js').getLogger();

const USE_ELK_PIPELINE = process.env.ELK_PIPELINE?.toLowerCase() === 'true';

/**
 * Read from ES
 *
 * response value expected for this operation
 **/
exports.searchRecords = async function (cc) {
  try {
    const indexAlias = common[1].indexAlias
    const client = await common[1].EsClient;
    const result = await client.search({
      index: indexAlias,
      body: {
        query: {
          term: {
            _id: cc
          }
        }
      }
    });

    const resultArray = createResultArray(result);
    return (resultArray[0]);
  } catch (error) {
    console.error(error);
    throw (error);
  }
}

/**
 * Read a device document from Elasticsearch.
 * resourceUrl must be the decoded original API resource URL.
 * fields must be the decoded fields expression, without "fields=".
 *
 */
exports.readRecords = async function (mountName, resourceUrl, fields) {
  if (typeof mountName !== "string" || mountName.length === 0) {
    throw new TypeError("mountName must be a non-empty string");
  }
 
  const { indexAlias, EsClient } = common[1];
  
  // Backward-compatible usage: readRecords(documentId).
  if (resourceUrl == null) {
    if (fields != null) {
      throw new TypeError("resourceUrl is required when fields is provided");
    }

    try {
      const result = await EsClient.get({
        index: indexAlias,
        id: mountName
      });

      const body = result?.body ?? result;

      return body?._source;
    } catch (error) {
      const statusCode = error.statusCode ?? error.meta?.statusCode;

      if ( statusCode === 404 && error.meta?.body?.found === false) {
        return undefined;
      }

      throw error;
    }
  }

  if (typeof resourceUrl !== "string" || resourceUrl.length === 0) {
    throw new TypeError("resourceUrl must be a non-empty string");
  }

  const sourceIncludes = utility.buildSourceIncludes(resourceUrl, fields);
 
  // Projection stays in the request body to avoid long GET URLs.
  const result = await EsClient.mget({
    index: indexAlias,
    body: {
      docs: [
        {
          _id: mountName,
          _source: {
            includes: sourceIncludes
          }
        }
      ]
    }
  });

  const body = result?.body ?? result;
  const document = body?.docs?.[0];

  if (!document) {
    throw new Error("Elasticsearch returned an invalid mget response");
  }

  // Individual document errors can occur inside an HTTP 200 response.
  if (document.error) {
    const error = new Error(
      `Elasticsearch read failed for ${mountName}: ` +
      (document.error.reason ?? document.error.type ?? "Unknown error")
    );

    error.statusCode = document.status;
    error.cause = document.error;

    throw error;
  }

  return document.found === false ? undefined : document._source;
};


// Module scope.
const PIPELINE_ID = "mwdi";
const PIPELINE_CACHE_TTL_MS = 30_000;

// Separate state if the Elasticsearch client is replaced.
const pipelineStates = new WeakMap();

async function isPipelineAvailable(client) {
  let state = pipelineStates.get(client);

  if (!state) {
    state = {
      available: false,
      expiresAt: 0,
      pending: null
    };

    pipelineStates.set(client, state);
  }

  if (Date.now() < state.expiresAt) {
    return state.available;
  }

  // Prevent simultaneous requests from repeating the lookup.
  if (state.pending) {
    return state.pending;
  }

  state.pending = (async () => {
    try {
      let available;

      try {
        await client.ingest.getPipeline({ id: PIPELINE_ID });
        available = true;
      } catch (error) {
        const statusCode =
          error.statusCode ?? error.meta?.statusCode;

        if (statusCode !== 404) {
          throw error;
        }

        available = false;

        logger.warn(
          `Pipeline ${PIPELINE_ID} not found. ` +
          "Writing without an explicit pipeline."
        );
      }

      state.available = available;
      state.expiresAt = Date.now() + PIPELINE_CACHE_TTL_MS;

      return available;
    } finally {
      state.pending = null;
    }
  })();

  return state.pending;
}

function isRetryableWriteError(error) {
  const statusCode =
    error.statusCode ?? error.meta?.statusCode;

  if (statusCode !== undefined) {
    return (
      statusCode === 408 ||
      statusCode === 429 ||
      statusCode === 502 ||
      statusCode === 503 ||
      statusCode === 504
    );
  }

  return (
    error.name === "ConnectionError" ||
    error.name === "TimeoutError"
  );
}

exports.recordRequest = async function (body, cc) {
  const startTime = process.hrtime.bigint();

  try {
    const { EsClient: client, indexAlias } = common[1];

    const indexParams = {
      index: indexAlias,
      id: cc,
      body
    };

    if (USE_ELK_PIPELINE && await isPipelineAvailable(client)) {
      indexParams.pipeline = PIPELINE_ID;
    }

    const response = await client.index(indexParams);
    const result = response?.body ?? response;

    const took =
      Number(process.hrtime.bigint() - startTime) / 1e6;

    if (result?.result === "created" || result?.result === "updated") {
      return {
        took,
        ok: true,
        retry: false
      };
    }

    // Do not blindly repeat a write with an unexpected response.
    return {
      took,
      ok: false,
      retry: false,
      reason: result == null
        ? "empty_response"
        : `unexpected_result_${result.result}`
    };
  } catch (error) {
    logger.error(error, `ELK write failed for mountName=${cc}`);

    return {
      took: Number(process.hrtime.bigint() - startTime) / 1e6,
      ok: false,
      retry: isRetryableWriteError(error),
      error: error.message,
      reason: error.message
    };
  }
};

/**
 * Records a request
 *
 * body controlconstruct 
 * no response value expected for this operation
 **/
exports.recordRequestOld = async function (body, cc) {
  let pipelineExists = false;
  const client = common[1].EsClient;
  if (USE_ELK_PIPELINE) {
    try {
      // Check if the pipeline exists
      await client.ingest.getPipeline({ id: 'mwdi' });
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
  }

  try {
    const indexAlias = common[1].indexAlias
    const startTime = process.hrtime();

    const indexParams = {
      index: indexAlias,
      id: cc,
      body: body,
    };

    if (pipelineExists) {
      indexParams.pipeline = 'mwdi';
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
    return { ok: false, retry: true, error: error.message, reason:error.message };
  }
}

/**
 * delete a request
 *
 * body controlconstruct 
 * no response value expected for this operation
 **/
exports.deleteRequest = async function (cc) {
  try {
    const indexAlias = common[1].indexAlias
    const client = common[1].EsClient;
    const startTime = process.hrtime();

    const result = await client.delete({
      id: cc,
      index: indexAlias
    });

    const backendTime = process.hrtime(startTime);
    if (result.body.result == 'created' || result.body.result == 'updated') {
      return { "took": backendTime[0] * 1000 + backendTime[1] / 1000000 };
    }
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Read only _id list from ES
 *
 * response value expected for this operation
 **/
exports.readIdsFromEs = async function () {
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
      if (hits.length === 0) {
        break;
      }

      for (const h of hits) {
        ids.push(h._id);
      }

      resp = await client.scroll({
        scroll_id: scrollId,
        scroll: keepAlive
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
