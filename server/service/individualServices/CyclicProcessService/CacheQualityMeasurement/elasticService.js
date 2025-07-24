
async function logResult(result) {
  await client.index({
    index: common[1].indexAlias,
    document: result
  });
  console.log('Logged to Elasticsearch:', result);
}

/**
 * Read from ES
 *
 * response value expected for this operation
 **/
async function readRecords(entity) {
  try {
    let query = {
      term: {
        _id: entity
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
  }
}

function createResultArray(result) {
  const resultArray = [];
  if (result.body.hits) {
    result.body.hits.hits.forEach((item) => {
      resultArray.push(item._source);
    });
  }
  return resultArray;
}

module.exports = { logResult,readRecords };