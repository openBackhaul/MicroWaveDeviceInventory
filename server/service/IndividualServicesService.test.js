const IndividualService = require('./IndividualServicesService')
const Utility = require('./individualServices/utility')
jest.mock('./individualServices/utility');
const Ajv = require("ajv");
const ajv = new Ajv();
const createHttpError = require("http-errors");
const cyclicProcess = require('./individualServices/CyclicProcessService/cyclicProcess')
jest.mock('./individualServices/CyclicProcessService/cyclicProcess')
const inputValidation = require('./individualServices/InputValidation');
const subscriberManagement = require('./individualServices/SubscriberManagement')
jest.mock('./individualServices/InputValidation');
jest.mock('./individualServices/SubscriberManagement');
const metaDataUtility = require('./individualServices/CyclicProcessService/metaDataUtility')
jest.mock('./individualServices/CyclicProcessService/metaDataUtility');
const cacheUpdate = require('./individualServices/cacheUpdateBuilder');
jest.mock('./individualServices/cacheUpdateBuilder', () => ({
  cacheUpdateBuilder: jest.fn(),
}));


describe('provideListOfParallelLinks', () => {
  const ajv = new Ajv();
  // Define the expected schema
  const responseSchema = {
    type: 'object',
    properties: {
      "parallel-link-list": {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
      }
    },
    required: ['parallel-link-list'],
    additionalProperties: false
  };

  it('should return valid response matching schema', async () => {
    const url = '/v1/provide-list-of-parallel-links';
    const user = 'test-user';
    const originator = 'test-originator';
    const xCorrelator = '550e8400-e29b-11d4-a716-446655440000';
    const traceIndicator = '1';
    const customerJourney = 'test-customerJourney';
    const body = { 'link-id': 'link1' };

    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockResolvedValueOnce({ "core-model-1-4:link": [{ "end-point-list": [{ "control-construct": "cc1" }] }] }) // for linkId
      .mockResolvedValueOnce({ LinkList: ['link1', 'link2'] })
      .mockResolvedValueOnce({ "core-model-1-4:link": [{ "end-point-list": [{ "control-construct": "cc1" }] }] }); // for link2
    let arraysHaveSameElements = jest.spyOn(Utility, "arraysHaveSameElements")
    arraysHaveSameElements.mockReturnValueOnce(true);
    const result = await IndividualService.provideListOfParallelLinks(
      url, body, user, originator, xCorrelator, traceIndicator, customerJourney
    );

    const validate = ajv.compile(responseSchema);
    const valid = validate(result);

    expect(valid).toBe(true); 
    expect(result["parallel-link-list"]).toContain('link1');
    expect(result["parallel-link-list"]).toContain('link2');

  });

  it('should throw 461 error if parent link not found', async () => {
    const body = { 'link-id': 'link1' };
    const url = '/v1/provide-list-of-parallel-links';
    const user = 'test-user';
    const originator = 'test-originator';
    const xCorrelator = '550e8400-e29b-11d4-a716-446655440000';
    const traceIndicator = '1';
    const customerJourney = 'test-customerJourney';
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockResolvedValueOnce(undefined);

    await expect(IndividualService.provideListOfParallelLinks(url, body, user, originator, xCorrelator, traceIndicator, customerJourney)).
      rejects.toMatchObject({
        status: 461,
        message: 'Not available. The topology (parent) object is currently not found in the cache.'
      })
  });

  it('should throw BadRequest if link-id is empty', async () => {
    const url = '/v1/provide-list-of-parallel-links';
    const body = { 'link-id': '' };
    const user = 'test-user';
    const originator = 'test-originator';
    const xCorrelator = '550e8400-e29b-11d4-a716-446655440000';
    const traceIndicator = '1';
    const customerJourney = 'test-customerJourney';

    await expect(IndividualService.provideListOfParallelLinks(url, body, user, originator, xCorrelator, traceIndicator, customerJourney)).
      rejects.toMatchObject({
        status: 400,
        message: 'Link-id must not be empty'
      })
  });

  it('should throw an error if ReadRecords fails for link data', async () => {
    const url = '/v1/provide-list-of-parallel-links';
    const body = { 'link-id': '1234' };
    const user = 'test-user';
    const originator = 'test-originator';
    const xCorrelator = '550e8400-e29b-11d4-a716-446655440000';
    const traceIndicator = '1';
    const customerJourney = 'test-customerJourney';

    const mockLinkData = {
      "core-model-1-4:link": [
        { "end-point-list": [] }
      ]
    };
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockResolvedValueOnce(mockLinkData)
    spy.mockResolvedValueOnce(undefined);

    await expect(IndividualService.provideListOfParallelLinks(url, body, user, originator, xCorrelator, traceIndicator, customerJourney))
      .rejects
      .toThrow();
  });

  it('should return the correct list of parallel links', async () => {
    const url = '/v1/provide-list-of-parallel-links';
    const body = { 'link-id': 'link-1' };
    const user = 'test-user';
    const originator = 'test-originator';
    const xCorrelator = 'test-xCorrelator';
    const traceIndicator = 'test-traceIndicator';
    const customerJourney = 'test-customerJourney';

    const mockLinkData = {
      "core-model-1-4:link": [
        { "end-point-list": [{ "control-construct": 'control-1' }] }
      ]
    };

    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockResolvedValueOnce(mockLinkData)
    const mockLinkList = {
      LinkList: ['link-1', 'link-2']
    };

    spy.mockResolvedValueOnce(mockLinkList)
    const mockLinkData2 = {
      "core-model-1-4:link": [
        { "end-point-list": [{ "control-construct": 'control-1' }] }

      ]
    };
    spy.mockResolvedValueOnce(mockLinkData2)
    let arraysHaveSameElements = jest.spyOn(Utility, "arraysHaveSameElements")
    arraysHaveSameElements.mockReturnValueOnce(true);

    const result = await IndividualService.provideListOfParallelLinks(url, body, user, originator, xCorrelator, traceIndicator, customerJourney);
    expect(result).toEqual({ "parallel-link-list": ['link-1', 'link-2'] });

  });

  it('should throw an error if arraysHaveSameElements throws an error', async () => {
    const url = '/v1/provide-list-of-parallel-links';
    const body = { 'link-id': 'link-1' };
    const user = 'test-user';
    const originator = 'test-originator';
    const xCorrelator = 'test-xCorrelator';
    const traceIndicator = 'test-traceIndicator';
    const customerJourney = 'test-customerJourney';
    const mockLinkData = {
      "core-model-1-4:link": [
        { "end-point-list": [{ "control-construct": 'control-1' }] }
      ]
    };
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockResolvedValueOnce(mockLinkData)
    const mockLinkList = {
      LinkList: ['link-1', 'link-2']
    };

    spy.mockResolvedValueOnce(mockLinkList)
    spy.mockResolvedValueOnce(mockLinkData)
    let arraysHaveSameElements = jest.spyOn(Utility, "arraysHaveSameElements")
    arraysHaveSameElements.mockImplementationOnce(() => {
      throw new Error('Error comparing arrays');
    });

    await expect(IndividualService.provideListOfParallelLinks(url, body, user, originator, xCorrelator, traceIndicator, customerJourney))
      .rejects
      .toThrow('Error comparing arrays');
  });
});

describe('provideListOfLinks', () => {
  const schema = {
    type: 'object',
    properties: {
      'link-list': {
        type: 'array',
        items: { type: 'string' }
      }
    },
    required: ['link-list'],
    additionalProperties: false
  };
  const validate = ajv.compile(schema);
  const mockContext = [{}, 'originator', 'xCorr', 'trace', 'journey'];
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns link UUIDs with "generic" type (has forwarding-domain)', async () => {
    const body = { 'link-type': 'generic' };
    const spy = jest.spyOn(Utility, "ReadRecords");
    //  spy.mockResolvedValueOnce(mockLinkData)
    spy.mockImplementation((uuid) => {
      if (uuid === 'linkList') {
        return Promise.resolve({ LinkList: ['uuid1', 'uuid2'] });
      }
      if (uuid === 'uuid1') {
        return Promise.resolve({ 'core-model-1-4:link': [{ 'forwarding-domain': {} }] });
      }
      if (uuid === 'uuid2') {
        return Promise.resolve({ 'core-model-1-4:link': [{}] }); // doesn't match
      }
    });

    const result = await IndividualService.provideListOfLinks(body, ...mockContext);
    expect(result).toEqual({ 'link-list': ['uuid1'] });
    expect(validate(result)).toBe(true);

  });

  test('returns link UUIDs with "minimumForRest" type (no forwarding-domain)', async () => {
    const body = { 'link-type': 'minimumForRest' };
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockImplementation((uuid) => {
      if (uuid === 'linkList') {
        return Promise.resolve({ LinkList: ['uuid1'] });
      }
      if (uuid === 'uuid1') {
        return Promise.resolve({ 'core-model-1-4:link': [{}] }); // minimumForRest
      }
    });

    const result = await IndividualService.provideListOfLinks(body, ...mockContext);
    expect(result).toEqual({ 'link-list': ['uuid1'] });
    expect(validate(result)).toBe(true);

  });

  test('resolves empty list if no links match type', async () => {
    const body = { 'link-type': 'generic' };
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockImplementation((uuid) => {
      if (uuid === 'linkList') {
        return Promise.resolve({ LinkList: ['uuid1'] });
      }
      if (uuid === 'uuid1') {
       return Promise.resolve({ 'core-model-1-4:link': [{}] }); // minimumForRest, not generic
      }
    });

    const result = await IndividualService.provideListOfLinks(body, ...mockContext);
    expect(result).toEqual({ 'link-list': [] });

  });

  it('should throw error if linkListRecord is undefined', async () => {
    const body = { 'link-type': 'generic' };
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockResolvedValueOnce(undefined);

    await expect(
      IndividualService.provideListOfLinks(
        body,
        ...mockContext
      )
    ).rejects.toMatchObject({
      status: 500,
      message: 'Error in Elasticsearch communication or no linkList available'
    })
  });

  test('rejects with error if ReadRecords throws internally', async () => {
    const body = { 'link-type': 'generic' };
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockRejectedValue(new Error('Read failure'));

    await expect(IndividualService.provideListOfLinks(body, ...mockContext)).rejects.toThrow('Read failure');
  });

  test('ignores undefined link records in loop', async () => {
    const body = { 'link-type': 'generic' };
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockImplementation((uuid) => {
      if (uuid === 'linkList') return Promise.resolve({ LinkList: ['uuid1', 'uuid2'] });
      if (uuid === 'uuid1') return Promise.resolve(undefined); // should be ignored
      if (uuid === 'uuid2') return Promise.resolve({ 'core-model-1-4:link': [{ 'forwarding-domain': {} }] });
    });

    const result = await IndividualService.provideListOfLinks(body, ...mockContext);
    expect(result).toEqual({ 'link-list': ['uuid2'] });

  });

  test('handles missing core-model-1-4:link array gracefully (no crash)', async () => {
    const body = { 'link-type': 'generic' };
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockImplementation((uuid) => {
      if (uuid === 'linkList') return Promise.resolve({ LinkList: ['uuid1'] });
      if (uuid === 'uuid1') return Promise.resolve({}); // missing key
    });

    await expect(IndividualService.provideListOfLinks(body, ...mockContext))
      .rejects.toThrow();
  });

  test(' handles empty core-model-1-4:link array gracefully', async () => {
    const body = { 'link-type': 'generic' };
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockImplementation((uuid) => {
      if (uuid === 'linkList') return Promise.resolve({ LinkList: ['uuid1'] });
      if (uuid === 'uuid1') return Promise.resolve({ 'core-model-1-4:link': [] });
    });

    await expect(IndividualService.provideListOfLinks(body, ...mockContext)).rejects.toThrow();

  });

  test('works with empty LinkList array', async () => {
    const body = { 'link-type': 'generic' };
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockResolvedValueOnce({ LinkList: [] });

    const result = await IndividualService.provideListOfLinks(body, ...mockContext);
    expect(result).toEqual({ 'link-list': [] });

  });

});



describe('provideListOfLinkPorts', () => {

  const schema = {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        'link-uuid': { type: 'string' },
        'link-port': {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['link-uuid', 'link-port'],
      additionalProperties: false
    }
  };

  const validate = ajv.compile(schema);
  const dummyArgs = ['user', 'originator', 'xCorrelator', 'traceIndicator', 'customerJourney'];
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return list of linkPorts when data is valid', async () => {

    const spy = jest.spyOn(Utility, "ReadRecords");
    spy
      .mockResolvedValueOnce({ LinkList: ['uuid1', 'uuid2'] }) // linkList
      .mockResolvedValueOnce({
        "core-model-1-4:link": [{
          "forwarding-domain": "fd1",
          "link-port": [{ "local-id": "port1" }, { "local-id": "port2" }]
        }]
      }) // uuid1
      .mockResolvedValueOnce({
        "core-model-1-4:link": [{
          "forwarding-domain": "fd2",
          "link-port": [{ "local-id": "port3" }]
        }]
      }); // uuid2

    const result = await IndividualService.provideListOfLinkPorts(...dummyArgs);
    expect(Array.isArray(result)).toBe(true);
    expect(validate(result)).toBe(true);
    expect(result).toEqual([
      { "link-uuid": "uuid1", "link-port": ["port1", "port2"] },
      { "link-uuid": "uuid2", "link-port": ["port3"] }
    ]);
  });

  it('should skip links without forwarding-domain', async () => {
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy
      .mockResolvedValueOnce({ LinkList: ['uuid1'] })
      .mockResolvedValueOnce({
        "core-model-1-4:link": [{
          // Missing "forwarding-domain"
          "link-port": [{ "local-id": "port1" }]
        }]
      });

    const result = await IndividualService.provideListOfLinkPorts(...dummyArgs);
    expect(result).toEqual([]);
    expect(validate(result)).toBe(true);

  });

  it('should skip undefined link records', async () => {
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy
      .mockResolvedValueOnce({ LinkList: ['uuid1', 'uuid2'] })
      .mockResolvedValueOnce(undefined) // uuid1 => undefined
      .mockResolvedValueOnce({
        "core-model-1-4:link": [{
          "forwarding-domain": "fd2",
          "link-port": [{ "local-id": "port3" }]
        }]
      }); // uuid2

    const result = await IndividualService.provideListOfLinkPorts(...dummyArgs);
    expect(result).toEqual([
      { "link-uuid": "uuid2", "link-port": ["port3"] }
    ]);
  });

  it('should throw error if linkList is undefined', async () => {

    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockResolvedValueOnce(undefined);
    await expect(IndividualService.provideListOfLinkPorts(...dummyArgs))
      .rejects.toMatchObject({
        status: 500,
        message: 'Error in Elasticsearch communication or no linkList available'
      })
  });

});


describe('provideDataOfLinks - All Scenarios', () => {
  
  const schema = {
    type: 'object',
    properties: {
      'core-model-1-4:link': {
        type: 'array',
        items: { type: 'object' }
      }
    },
    required: ['core-model-1-4:link'],
    additionalProperties: false
  };
  const validate = ajv.compile(schema);
  const userArgs = ['user', 'originator', 'xCorrelator', 'traceIndicator', 'customerJourney'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return links of type "generic"', async () => {
    const body = { "link-type": "generic" };
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy
      .mockResolvedValueOnce({ LinkList: ['uuid1', 'uuid2'] }) // linkList
      .mockResolvedValueOnce({ "core-model-1-4:link": [{ "forwarding-domain": {}, "link-port": [] }] }) // uuid1 = generic
      .mockResolvedValueOnce({ "core-model-1-4:link": [{ "link-port": [] }] }); // uuid2 = minimumForRest
   
  const result = await IndividualService.provideDataOfLinks(body, ...userArgs);
    expect(validate(result)).toBe(true);
    expect(result['core-model-1-4:link']).toHaveLength(1);
    expect(result['core-model-1-4:link'][0]).toHaveProperty('forwarding-domain');

    expect(result).toEqual({
      "core-model-1-4:link": [
        { "forwarding-domain": {}, "link-port": [] }
      ]
    });
  });

  it('should return links of type "minimumForRest"', async () => {
    const body = { "link-type": "minimumForRest" };
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy
      .mockResolvedValueOnce({ LinkList: ['uuid1'] })
      .mockResolvedValueOnce({ "core-model-1-4:link": [{ "link-port": [] }] });

    const result = await IndividualService.provideDataOfLinks(body, ...userArgs);
    expect(validate(result)).toBe(true);
    expect(result['core-model-1-4:link']).toHaveLength(1);
    expect(result['core-model-1-4:link'][0]).not.toHaveProperty('forwarding-domain');
    expect(result).toEqual({
      "core-model-1-4:link": [
        { "link-port": [] }
      ]
    });
  });


  it('should skip link record if it is undefined', async () => {
    const body = { "link-type": "generic" };
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy
      .mockResolvedValueOnce({ LinkList: ['uuid1', 'uuid2'] })
      .mockResolvedValueOnce(undefined) // uuid1 skipped
      .mockResolvedValueOnce({ "core-model-1-4:link": [{ "forwarding-domain": {}, "link-port": [] }] }); // uuid2 = generic

    const result = await IndividualService.provideDataOfLinks(body, ...userArgs);
    expect(result).toEqual({
      "core-model-1-4:link": [
        { "forwarding-domain": {}, "link-port": [] }
      ]
    });
  });


  it('should skip link if it doesn\'t match requested type', async () => {
    const body = { "link-type": "minimumForRest" };
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy
      .mockResolvedValueOnce({ LinkList: ['uuid1'] })
      .mockResolvedValueOnce({ "core-model-1-4:link": [{ "forwarding-domain": {}, "link-port": [] }] }); // is generic
    const result = await IndividualService.provideDataOfLinks(body, ...userArgs);
    expect(result).toEqual({ "core-model-1-4:link": [] });

  });

  it('should return empty array if no matching links found', async () => {
    const body = { "link-type": "minimumForRest" };
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy
      .mockResolvedValueOnce({ LinkList: ['uuid1'] })
      .mockResolvedValueOnce(undefined); // no valid data

    const result = await IndividualService.provideDataOfLinks(body, ...userArgs);
    expect(result).toEqual({ "core-model-1-4:link": [] });

  });

  it('should throw error if linkListRecord is undefined', async () => {
    const body = { "link-type": "generic" };
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockResolvedValueOnce(undefined);

    await expect(IndividualService.provideDataOfLinks(body, ...userArgs))
      .rejects.toMatchObject({
        status: 500,
        message: 'Error in Elasticsearch communication or no linkList available'
      })
  });


  it('should return empty array if LinkList is empty', async () => {
    const body = { "link-type": "generic" };
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockResolvedValueOnce({ LinkList: [] });

    const result = await IndividualService.provideDataOfLinks(body, ...userArgs);
    expect(result).toEqual({ "core-model-1-4:link": [] });

  });


  it('should handle malformed link record (missing "core-model-1-4:link") gracefully', async () => {
    const body = { "link-type": "generic" };
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy
      .mockResolvedValueOnce({ LinkList: ['uuid1'] })
      .mockResolvedValueOnce({}); // malformed
    // This will throw due to accessing [0] of undefined

    await expect(IndividualService.provideDataOfLinks(body, ...userArgs)).rejects.toThrow();
  });


  it('should handle missing "link-type" in body gracefully', async () => {

    const body = {}; // no "link-type"
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy
      .mockResolvedValueOnce({ LinkList: ['uuid1'] })
      .mockResolvedValueOnce({ "core-model-1-4:link": [{ "forwarding-domain": {}, "link-port": [] }] });

    const result = await IndividualService.provideDataOfLinks(body, ...userArgs);
    expect(result).toEqual({ "core-model-1-4:link": [] }); // no match

  });

});


describe('provideDataOfLinkPorts', () => {

  const schema = {
    type: 'object',
    properties: {
      'core-model-1-4:link-ports': {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            uuid: { type: 'string' },
            'link-port': {
              type: 'array',
              items: { type: 'object' }
            }
          },
          required: ['uuid', 'link-port'],
          additionalProperties: false
        }
      }
    },
    required: ['core-model-1-4:link-ports'],
    additionalProperties: false
  };
  const validate = ajv.compile(schema);
  const mockArgs = ['user', 'originator', 'xCorrelator', 'traceIndicator', 'customerJourney'];
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return link ports for links with forwarding-domain', async () => {
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy
      .mockResolvedValueOnce({ LinkList: ['uuid1', 'uuid2'] })
      .mockResolvedValueOnce({
        'core-model-1-4:link': [{
          'uuid': 'uuid1',
          'forwarding-domain': 'fd1',
          'link-port': [{ 'local-id': 'p1' }]
        }]
      })

      .mockResolvedValueOnce({
        'core-model-1-4:link': [{
          'uuid': 'uuid2',
          'forwarding-domain': 'fd2',
          'link-port': [{ 'local-id': 'p2' }]
        }]
      });

    //   [{"link-port": [{"local-id": "p1"}], "uuid": "uuid1"}, {"link-port": [{"local-id": "p2"}], "uuid": "uuid2"}]
    /*
      .mockResolvedValueOnce({
          'core-model-1-4:link': [{
              uuid: 'uuid1',
              'forwarding-domain': {},
              'link-port': ['lp1']
            }]
          })
          .mockResolvedValueOnce({
            'core-model-1-4:link': [{
              uuid: 'uuid2',
              'forwarding-domain': {},
              'link-port': ['lp2']
            }]
          });*/

    const result = await IndividualService.provideDataOfLinkPorts(...mockArgs);
    expect(validate(result)).toBe(true);
    expect(result['core-model-1-4:link-ports']).toHaveLength(2);
    expect(result['core-model-1-4:link-ports'][0]).toHaveProperty('uuid', 'uuid1');
    expect(result['core-model-1-4:link-ports'][1]['link-port'][0]).toHaveProperty('local-id', 'p2');

    expect(result).toEqual({
      'core-model-1-4:link-ports': [
        { uuid: 'uuid1', "link-port": [{ "local-id": "p1" }] },
        { uuid: 'uuid2', "link-port": [{ "local-id": "p2" }] }
      ]
    });
  });

  it('should skip links without forwarding-domain', async () => {
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy
      .mockResolvedValueOnce({ LinkList: ['uuid1'] })
      .mockResolvedValueOnce({
        'core-model-1-4:link': [{
          uuid: 'uuid1',
          'link-port': ['lp1']
        }]
      });

    const result = await IndividualService.provideDataOfLinkPorts(...mockArgs);
    expect(validate(result)).toBe(true);
    expect(result['core-model-1-4:link-ports']).toEqual([]);
    expect(result).toEqual({ 'core-model-1-4:link-ports': [] });

  });


  it('should skip undefined link record', async () => {

    const spy = jest.spyOn(Utility, "ReadRecords");
    spy
      .mockResolvedValueOnce({ LinkList: ['uuid1', 'uuid2'] })
      .mockResolvedValueOnce(undefined) // first link fails
      .mockResolvedValueOnce({
        'core-model-1-4:link': [{
          uuid: 'uuid2',
          'forwarding-domain': {},
          'link-port': ['lp2']
        }]
      });

    const result = await IndividualService.provideDataOfLinkPorts(...mockArgs);
    expect(result).toEqual({
      'core-model-1-4:link-ports': [
        { uuid: 'uuid2', 'link-port': ['lp2'] }
      ]
    });
  });

  it('should return empty list when LinkList is empty', async () => {
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockResolvedValueOnce({ LinkList: [] });

    const result = await IndividualService.provideDataOfLinkPorts(...mockArgs);
    expect(result).toEqual({ 'core-model-1-4:link-ports': [] });

  });


  it('should throw error when linkListRecord is undefined', async () => {
   
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockResolvedValueOnce(undefined);

    await expect(IndividualService.provideDataOfLinkPorts(...mockArgs))
      .rejects.toMatchObject({
        status: 500,
        message: 'Error in Elasticsearch communication or no linkList available'
      })

  });

  it('should throw if core-model-1-4:link is missing', async () => {
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy
      .mockResolvedValueOnce({ LinkList: ['uuid1'] })
      .mockResolvedValueOnce({});

    await expect(IndividualService.provideDataOfLinkPorts(...mockArgs)).rejects.toThrow();
  });

});



describe('regardControllerAttributeValueChange - All Scenarios', () => {
  const user = 'user';
  const originator = 'originator';
  const xCorrelator = 'xCorr';
  const traceIndicator = 'trace';
  const customerJourney = 'journey';
  const timestamp = '2025-04-08T12:34:56Z';
  const ltp = 'ltp123';
  const validResource = `some-path/logical-termination-point=${ltp}`;
  const malformedResource = `some-path/no-ltp`;
  // Mocks
  global.notify = [
    {
      finalTcpAddr: 'http://127.0.0.1:4015',
      key: 'Operation key not yet provided.',
      protocol: 'HTTP'
    }];

  global.common = [{
    applicationName: 'ElasticSearch',
    httpClientLtpUuid: 'mwdi-1-2-1-es-c-es-1-0-0-000',
    indexAlias: 'mwdi_1.1.2.j_impl',
    key: 'Authorization key not yet provided',
    tcpConn: 'http://172.28.127.20:9200'
  },{
    applicationName: 'ElasticSearch',
    httpClientLtpUuid: 'mwdi-1-2-1-es-c-es-1-0-0-000',
    indexAlias: 'mwdi_1.1.2.j_impl',
    key: 'Authorization key not yet provided',
    tcpConn: 'http://172.28.127.20:9200'
  }];

  //global.common = [{ indexAlias: 'mwdi_1.1.2.j_impl'}];
  const deleteMock = jest.fn().mockResolvedValue({ result: 'deleted' });
  const updateMock = jest.fn();

  beforeAll(() => {
    jest.spyOn(IndividualService, 'deleteRecordFromElasticsearch').mockImplementation(deleteMock);
    jest.spyOn(cyclicProcess, 'updateDeviceListFromNotification').mockImplementation(updateMock);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function getMockBody(resource, newValue) {
    return {
      device: {
        resource,
        'attribute-name': 'connection-status',
        'new-value': newValue,
        timestamp
      }
    };
  }

  test('connected → updateDeviceListFromNotification with type 1', async () => {
    const body = getMockBody(validResource, 'connected');

    await expect(IndividualService.regardControllerAttributeValueChange(
      'url', body, user, originator, xCorrelator, traceIndicator, customerJourney
    )).resolves.toBeUndefined();

    expect(updateMock).toHaveBeenCalledWith(1, ltp);
    expect(deleteMock).not.toHaveBeenCalled();
    expect(metaDataUtility.updateMDTableForDeviceStatusChange).toHaveBeenCalledWith(ltp, 'connected', timestamp);
  });


  test(' not connected → updateDeviceListFromNotification type 2 + delete', async () => {
    const body = getMockBody(validResource, 'disconnected');

    await expect(IndividualService.regardControllerAttributeValueChange(
      'url', body, user, originator, xCorrelator, traceIndicator, customerJourney
    )).resolves.toBeUndefined();

    expect(updateMock).toHaveBeenCalledWith(2, ltp);
    expect(deleteMock).toHaveBeenCalledWith('mwdi_1.1.2.j_impl', '_doc', ltp);
    expect(metaDataUtility.updateMDTableForDeviceStatusChange).toHaveBeenCalledWith(ltp, 'disconnected', timestamp);

  });


  test('resource missing LTP → logicalTerminationPoint is null', async () => {
    const body = getMockBody(malformedResource, 'connected');

    await expect(IndividualService.regardControllerAttributeValueChange(
      'url', body, user, originator, xCorrelator, traceIndicator, customerJourney
    )).resolves.toBeUndefined();

    expect(updateMock).toHaveBeenCalledWith(1, null);
    expect(metaDataUtility.updateMDTableForDeviceStatusChange).toHaveBeenCalledWith(null, 'connected', timestamp);

  });

  test(' metaDataUtility throws → should reject', async () => {
    const body = getMockBody(validResource, 'connected');

    metaDataUtility.updateMDTableForDeviceStatusChange.mockImplementation(() => {
      throw new Error('update error');
    });

    await expect(IndividualService.regardControllerAttributeValueChange(
      'url', body, user, originator, xCorrelator, traceIndicator, customerJourney
    )).rejects.toThrow('update error');
  });


  test('deleteRecordFromElasticsearch throws → should reject', async () => {
    const body = getMockBody(validResource, 'disconnected');
    deleteMock.mockRejectedValue(new Error('delete fail'));

    await expect(IndividualService.regardControllerAttributeValueChange(
      'url', body, user, originator, xCorrelator, traceIndicator, customerJourney
    )).rejects.toThrow('delete fail');
  });


  test('notify[0].finalTcpAddr is malformed → should reject', async () => {
    global.notify = [{ finalTcpAddr: 'invalid-url' }];
    const body = getMockBody(validResource, 'connected');

    await expect(IndividualService.regardControllerAttributeValueChange(
      'url', body, user, originator, xCorrelator, traceIndicator, customerJourney
    )).rejects.toThrow();
  });


  test('body is empty or malformed → should reject', async () => {

    await expect(IndividualService.regardControllerAttributeValueChange(
      'url', {}, user, originator, xCorrelator, traceIndicator, customerJourney
    )).rejects.toThrow();
  });
});

describe('provideDeviceStatusMetadata', () => {
  const user = 'mockUser';
  const originator = 'mockOriginator';
  const xCorrelator = 'mockXCorrelator';
  const traceIndicator = 'mockTraceIndicator';
  const customerJourney = 'mockJourney';

  afterEach(() => {
    jest.clearAllMocks();
  });


  test('should return metadata for all matching mount names', async () => {
    const body = {
      'mount-name-list': ['305251234', '12345678']
    };

    const elasticData = [
      {
        "mount-name": "305251234",
        "connection-status": "connected",
        "changed-to-disconnected-time": "",
        "added-to-device-list-time": "2024-10-10T13:00:00.000Z",
        "last-complete-control-construct-update-time": "2024-10-10T13:00:05.000Z",
        "last-control-construct-notification-update-time": "2024-10-10T14:17:00.000Z",
        "number-of-partial-updates-since-last-complete-update": 7,
        "schema-cache-directory": "hua"
      },
      {
        "mount-name": "12345678",
        "connection-status": "connected",
        "changed-to-disconnected-time": "",
        "added-to-device-list-time": "2024-10-10T13:00:00.000Z",
        "last-complete-control-construct-update-time": "2024-10-10T13:00:05.000Z",
        "last-control-construct-notification-update-time": "2024-10-10T14:17:00.000Z",
        "number-of-partial-updates-since-last-complete-update": 7,
        "schema-cache-directory": "hua"
      }
    ];

    const spy = jest.spyOn(metaDataUtility, "readMetaDataListFromElasticsearch")
    spy.mockResolvedValue(elasticData);

    const result = await IndividualService.provideDeviceStatusMetadata(body, user, originator, xCorrelator, traceIndicator, customerJourney);
    expect(result).toStrictEqual([
      {
        "mount-name": "305251234",
        "connection-status": "connected",
        "changed-to-disconnected-time": "",
        "added-to-device-list-time": "2024-10-10T13:00:00.000Z",
        "last-complete-control-construct-update-time": "2024-10-10T13:00:05.000Z",
        "last-control-construct-notification-update-time": "2024-10-10T14:17:00.000Z",
        "number-of-partial-updates-since-last-complete-update": 7,
        "schema-cache-directory": "hua"
      },
      {
        "mount-name": "12345678",
        "connection-status": "connected",
        "changed-to-disconnected-time": "",
        "added-to-device-list-time": "2024-10-10T13:00:00.000Z",
        "last-complete-control-construct-update-time": "2024-10-10T13:00:05.000Z",
        "last-control-construct-notification-update-time": "2024-10-10T14:17:00.000Z",
        "number-of-partial-updates-since-last-complete-update": 7,
        "schema-cache-directory": "hua"
      },
    ]);
  });


  test('should return only matching metadata (partial match)', async () => {
    const body = {
      'mount-name-list': ['305251234', '45678']
    };
    const elasticData = [
      {
        "mount-name": "305251234",
        "connection-status": "connected",
        "changed-to-disconnected-time": "",
        "added-to-device-list-time": "2024-10-10T13:00:00.000Z",
        "last-complete-control-construct-update-time": "2024-10-10T13:00:05.000Z",
        "last-control-construct-notification-update-time": "2024-10-10T14:17:00.000Z",
        "number-of-partial-updates-since-last-complete-update": 7,
        "schema-cache-directory": "hua"
      },
      {
        "mount-name": "12345678",
        "connection-status": "connected",
        "changed-to-disconnected-time": "",
        "added-to-device-list-time": "2024-10-10T13:00:00.000Z",
        "last-complete-control-construct-update-time": "2024-10-10T13:00:05.000Z",
        "last-control-construct-notification-update-time": "2024-10-10T14:17:00.000Z",
        "number-of-partial-updates-since-last-complete-update": 7,
        "schema-cache-directory": "hua"
      }
    ];
    const spy = jest.spyOn(metaDataUtility, "readMetaDataListFromElasticsearch")
    spy.mockResolvedValue(elasticData);

    const result = await IndividualService.provideDeviceStatusMetadata(body, user, originator, xCorrelator, traceIndicator, customerJourney);

    expect(result).toStrictEqual([
      {
        "mount-name": "305251234",
        "connection-status": "connected",
        "changed-to-disconnected-time": "",
        "added-to-device-list-time": "2024-10-10T13:00:00.000Z",
        "last-complete-control-construct-update-time": "2024-10-10T13:00:05.000Z",
        "last-control-construct-notification-update-time": "2024-10-10T14:17:00.000Z",
        "number-of-partial-updates-since-last-complete-update": 7,
        "schema-cache-directory": "hua"
      }
    ]);
  });

  test('should return an empty array if no mount-names match', async () => {
    const body = {
      'mount-name-list': ['908764357']
    };
    const elasticData = [
      {
        "mount-name": "305251234",
        "connection-status": "connected",
        "changed-to-disconnected-time": "",
        "added-to-device-list-time": "2024-10-10T13:00:00.000Z",
        "last-complete-control-construct-update-time": "2024-10-10T13:00:05.000Z",
        "last-control-construct-notification-update-time": "2024-10-10T14:17:00.000Z",
        "number-of-partial-updates-since-last-complete-update": 7,
        "schema-cache-directory": "hua"
      },
      {
        "mount-name": "12345678",
        "connection-status": "connected",
        "changed-to-disconnected-time": "",
        "added-to-device-list-time": "2024-10-10T13:00:00.000Z",
        "last-complete-control-construct-update-time": "2024-10-10T13:00:05.000Z",
        "last-control-construct-notification-update-time": "2024-10-10T14:17:00.000Z",
        "number-of-partial-updates-since-last-complete-update": 7,
        "schema-cache-directory": "hua"
      }
    ];

    const spy = jest.spyOn(metaDataUtility, "readMetaDataListFromElasticsearch")
    spy.mockResolvedValue(elasticData);

    const result = await IndividualService.provideDeviceStatusMetadata(body, user, originator, xCorrelator, traceIndicator, customerJourney);
    expect(result).toEqual([]);
  });


  test('should return an empty array if input mount-name-list is empty', async () => {
    const body = {
      'mount-name-list': []
    };

    const elasticData = [
      {
        "mount-name": "305251234",
        "connection-status": "connected",
        "changed-to-disconnected-time": "",
        "added-to-device-list-time": "2024-10-10T13:00:00.000Z",
        "last-complete-control-construct-update-time": "2024-10-10T13:00:05.000Z",
        "last-control-construct-notification-update-time": "2024-10-10T14:17:00.000Z",
        "number-of-partial-updates-since-last-complete-update": 7,
        "schema-cache-directory": "hua"
      },
      {
        "mount-name": "12345678",
        "connection-status": "connected",
        "changed-to-disconnected-time": "",
        "added-to-device-list-time": "2024-10-10T13:00:00.000Z",
        "last-complete-control-construct-update-time": "2024-10-10T13:00:05.000Z",
        "last-control-construct-notification-update-time": "2024-10-10T14:17:00.000Z",
        "number-of-partial-updates-since-last-complete-update": 7,
        "schema-cache-directory": "hua"
      }
    ];

    const spy = jest.spyOn(metaDataUtility, "readMetaDataListFromElasticsearch")
    spy.mockResolvedValue(elasticData);

    const result = await IndividualService.provideDeviceStatusMetadata(body, user, originator, xCorrelator, traceIndicator, customerJourney);
    expect(result).toEqual([]);

  });


  test('should reject if elasticsearch throws error', async () => {
    const body = {
      'mount-name-list': ['mnt1']
    };

    const error = new Error('Elastic failure');
    const spy = jest.spyOn(metaDataUtility, "readMetaDataListFromElasticsearch")
    spy.mockRejectedValue(error);

    await expect(
      IndividualService.provideDeviceStatusMetadata(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    ).rejects.toThrow('Elastic failure');
  });

  test('should return empty list if elasticsearch returns empty list', async () => {
    const body = {
      'mount-name-list': ['12345678']
    };

    const spy = jest.spyOn(metaDataUtility, "readMetaDataListFromElasticsearch")
    spy.mockResolvedValue([]);

    const result = await IndividualService.provideDeviceStatusMetadata(body, user, originator, xCorrelator, traceIndicator, customerJourney);
    expect(result).toEqual([]);

  });

})

describe('notifyAttributeValueChanges', () => {
  const mockUrl = '/v1/notify-attribute-value-changes';
  const user = 'user';
  const originator = 'originator';
  const xCorrelator = 'xCorrelator';
  const traceIndicator = 'traceIndicator';
  const customerJourney = 'customerJourney';

  const validBody = {
    'subscriber-application': 'MWDI',
    'subscriber-release-number': '2.1.0',
    'subscriber-protocol': 'HTTP',
    'subscriber-address': '127.0.0.1',
    'subscriber-port': '8080',
    'subscriber-operation': '/v1/regard-attribute-value-change'
  };


  afterEach(() => {
    jest.clearAllMocks();
  });

  test('resolves successfully when input is valid and subscriber is added', async () => {
    inputValidation.validateSubscriberInput.mockReturnValue(true);
    subscriberManagement.addSubscriberToConfig.mockResolvedValue(true);
   
    await expect(
      IndividualService.notifyAttributeValueChanges(
        mockUrl, validBody, user, originator, xCorrelator, traceIndicator, customerJourney
      )
    ).resolves.toBeUndefined();

    expect(inputValidation.validateSubscriberInput).toHaveBeenCalledWith(
      'MWDI', '2.1.0', 'HTTP', '127.0.0.1', '8080', '/v1/regard-attribute-value-change'
    );

    expect(subscriberManagement.addSubscriberToConfig).toHaveBeenCalledWith(
      mockUrl, 'MWDI', '2.1.0', 'HTTP', '127.0.0.1', '8080', '/v1/regard-attribute-value-change'
    );
  });

  test('rejects if input validation fails', async () => {
    inputValidation.validateSubscriberInput.mockReturnValue(false);

    await expect(
      IndividualService.notifyAttributeValueChanges(
        mockUrl, validBody, user, originator, xCorrelator, traceIndicator, customerJourney
      )
    ).rejects.toMatchObject(
      {
        "code": 400,
        "message": "notifyControllerObjectCreations: invalid input data",
      }
    );

    await expect(subscriberManagement.addSubscriberToConfig).not.toHaveBeenCalled();

  });


  test('rejects if addSubscriberToConfig returns false', async () => {
    inputValidation.validateSubscriberInput.mockReturnValue(true);
    subscriberManagement.addSubscriberToConfig.mockResolvedValue(false);

    await expect(
      IndividualService.notifyAttributeValueChanges(
        mockUrl, validBody, user, originator, xCorrelator, traceIndicator, customerJourney
      )
    ).rejects.toMatchObject(
      {
        "code": 500,
        "message": "notifyControllerObjectCreations: addSubscriber failed",
      }
    );

    expect(inputValidation.validateSubscriberInput).toHaveBeenCalled();
  });

  test('rejects if addSubscriberToConfig throws an error', async () => {
    inputValidation.validateSubscriberInput.mockReturnValue(true);
    subscriberManagement.addSubscriberToConfig.mockRejectedValue(new Error('Config Error'));

    await expect(
      IndividualService.notifyAttributeValueChanges(
        mockUrl, validBody, user, originator, xCorrelator, traceIndicator, customerJourney
      )
    ).rejects.toThrow('Config Error');
  });


  test('rejects if body is missing required fields', async () => {
    const invalidBody = {};
    inputValidation.validateSubscriberInput.mockReturnValue(false);

    await expect(
      IndividualService.notifyAttributeValueChanges(
        mockUrl, invalidBody, user, originator, xCorrelator, traceIndicator, customerJourney
      )
    ).rejects.toMatchObject(
      {
        "code": 400,
        "message": "notifyControllerObjectCreations: invalid input data",
      });
    expect(inputValidation.validateSubscriberInput).toHaveBeenCalled();
    expect(subscriberManagement.addSubscriberToConfig).not.toHaveBeenCalled();
  });

});


describe('notifyObjectCreations', () => {
  const mockUrl = 'http://localhost:3000';
  const user = 'testUser';
  const originator = 'testOriginator';
  const xCorrelator = 'testXCorrelator';
  const traceIndicator = 'trace123';
  const customerJourney = 'journey456';

  const validBody = {
    'subscriber-application': 'MyApp',
    'subscriber-release-number': '1.2',
    'subscriber-protocol': 'http',
    'subscriber-address': '127.0.0.1',
    'subscriber-port': '8080',
    'subscriber-operation': 'handleNotification'
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should resolve successfully when input is valid and addSubscriberToConfig returns true', async () => {
    inputValidation.validateSubscriberInput.mockReturnValue(true);
    subscriberManagement.addSubscriberToConfig.mockResolvedValue(true);

    await expect(
      IndividualService.notifyObjectCreations(
        mockUrl, validBody, user, originator, xCorrelator, traceIndicator, customerJourney
      )
    ).resolves.toBeUndefined();

    expect(inputValidation.validateSubscriberInput).toHaveBeenCalledWith(
      'MyApp', '1.2', 'http', '127.0.0.1', '8080', 'handleNotification'
    );

    expect(subscriberManagement.addSubscriberToConfig).toHaveBeenCalledWith(
      mockUrl, 'MyApp', '1.2', 'http', '127.0.0.1', '8080', 'handleNotification'
    );

  });


  test('should reject when input is invalid', async () => {
    inputValidation.validateSubscriberInput.mockReturnValue(false);
    await expect(
      IndividualService.notifyObjectCreations(
        mockUrl, validBody, user, originator, xCorrelator, traceIndicator, customerJourney
      )
    ).rejects.toEqual(
      {
        "code": 400,
        "message": "notifyControllerObjectCreations: invalid input data",
      });

    expect(subscriberManagement.addSubscriberToConfig).not.toHaveBeenCalled();

  });


  test('should reject when addSubscriberToConfig returns false', async () => {
    inputValidation.validateSubscriberInput.mockReturnValue(true);
    subscriberManagement.addSubscriberToConfig.mockResolvedValue(false);

    await expect(
      IndividualService.notifyObjectCreations(
        mockUrl, validBody, user, originator, xCorrelator, traceIndicator, customerJourney
      )
    ).rejects.toEqual(
      {
        "code": 500,
        "message": "notifyControllerObjectCreations: addSubscriber failed",
      });
  });


  test('should reject when addSubscriberToConfig throws an error', async () => {
    inputValidation.validateSubscriberInput.mockReturnValue(true);
    subscriberManagement.addSubscriberToConfig.mockRejectedValue(new Error('Internal service error'));

    await expect(
      IndividualService.notifyObjectCreations(
        mockUrl, validBody, user, originator, xCorrelator, traceIndicator, customerJourney
      )
    ).rejects.toThrow('Internal service error');

  });


  test('should reject when required fields are missing in body', async () => {
    const invalidBody = {}; // empty body
    inputValidation.validateSubscriberInput.mockReturnValue(false);

    await expect(
      IndividualService.notifyObjectCreations(
        mockUrl, invalidBody, user, originator, xCorrelator, traceIndicator, customerJourney
      )
    ).rejects.toEqual(
      {
        "code": 400,
        "message": "notifyControllerObjectCreations: invalid input data",
      });

    expect(inputValidation.validateSubscriberInput).toHaveBeenCalled();
    expect(subscriberManagement.addSubscriberToConfig).not.toHaveBeenCalled();

  });

});


describe('notifyObjectDeletions', () => {
  const url = 'http://mock.url';
  const user = 'testUser';
  const originator = 'originator';
  const xCorrelator = 'correlator';
  const traceIndicator = 'trace';
  const customerJourney = 'journey';


  const validBody = {
    'subscriber-application': 'AppA',
    'subscriber-release-number': '2.0',
    'subscriber-protocol': 'http',
    'subscriber-address': '127.0.0.1',
    'subscriber-port': '8080',
    'subscriber-operation': 'onDelete'

  };

  afterEach(() => {
    jest.clearAllMocks();
  });


  test('resolves when input is valid and addSubscriberToConfig returns true', async () => {
    inputValidation.validateSubscriberInput.mockReturnValue(true);
    subscriberManagement.addSubscriberToConfig.mockResolvedValue(true);

    await expect(
      IndividualService.notifyObjectDeletions(url, validBody, user, originator, xCorrelator, traceIndicator, customerJourney)
    ).resolves.toBeUndefined();

    expect(inputValidation.validateSubscriberInput).toHaveBeenCalledWith(
      'AppA', '2.0', 'http', '127.0.0.1', '8080', 'onDelete'
    );

    expect(subscriberManagement.addSubscriberToConfig).toHaveBeenCalledWith(
      url, 'AppA', '2.0', 'http', '127.0.0.1', '8080', 'onDelete'
    );

  });


  test('rejects when input validation fails', async () => {
    inputValidation.validateSubscriberInput.mockReturnValue(false);

    await expect(
      IndividualService.notifyObjectDeletions(url, validBody, user, originator, xCorrelator, traceIndicator, customerJourney)
    ).rejects.toEqual(
      {
        "code": 400,
        "message": "notifyControllerObjectCreations: invalid input data",
      });

    expect(subscriberManagement.addSubscriberToConfig).not.toHaveBeenCalled();

  });

  test('rejects when addSubscriberToConfig returns false', async () => {
    inputValidation.validateSubscriberInput.mockReturnValue(true);
    subscriberManagement.addSubscriberToConfig.mockResolvedValue(false);

    await expect(
      IndividualService.notifyObjectDeletions(url, validBody, user, originator, xCorrelator, traceIndicator, customerJourney)
    ).rejects.toEqual(
      {
        "code": 500,
        "message": "notifyControllerObjectCreations: addSubscriber failed",
      });
  });


  test('rejects when addSubscriberToConfig throws an error', async () => {
    inputValidation.validateSubscriberInput.mockReturnValue(true);
    subscriberManagement.addSubscriberToConfig.mockRejectedValue(new Error('Config failure'));

    await expect(
      IndividualService.notifyObjectDeletions(url, validBody, user, originator, xCorrelator, traceIndicator, customerJourney)
    ).rejects.toThrow('Config failure');
  });

  test('rejects when body is missing required fields', async () => {
    const incompleteBody = {}; // All fields missing
    inputValidation.validateSubscriberInput.mockReturnValue(false);

    await expect(
      IndividualService.notifyObjectDeletions(url, incompleteBody, user, originator, xCorrelator, traceIndicator, customerJourney)
    ).rejects.toEqual(
      {
        "code": 400,
        "message": "notifyControllerObjectCreations: invalid input data",
      });

    expect(inputValidation.validateSubscriberInput).toHaveBeenCalled();
    expect(subscriberManagement.addSubscriberToConfig).not.toHaveBeenCalled();

  });

});


describe('provideListOfConnectedDevices', () => {
  const dummyArgs = ['url', 'user', 'originator', 'xCorrelator', 'traceIndicator', 'customerJourney'];
  beforeEach(() => {
    jest.mock('http-errors', () => ({
      NotFound: jest.fn().mockImplementation((msg) => new Error(`NotFound: ${msg}`)),
    }));

  })

  afterEach(() => {
    jest.clearAllMocks();

  });


  it('should resolve with mount-name-list when devices are found', async () => {
    const mockDeviceList = [
      { 'node-id': '1234567' },
      { 'node-id': '987654' },
    ];


    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockResolvedValue({ deviceList: mockDeviceList })

    const result = await IndividualService.provideListOfConnectedDevices(...dummyArgs);
    expect(result).toEqual({
      'mount-name-list': ['1234567', '987654'],
    });
    expect(spy).toHaveBeenCalledWith('DeviceList');
  });

  it('should reject with NotFound error if ReadRecords returns undefined', async () => {
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockResolvedValue(undefined);

    await expect(IndividualService.provideListOfConnectedDevices(...dummyArgs)).rejects.toThrow('Device list not found');

  });



  it('should reject with unexpected error if ReadRecords throws', async () => {
    const mockError = new Error('Database crashed');
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockRejectedValue(mockError);

    await expect(IndividualService.provideListOfConnectedDevices(...dummyArgs)).rejects.toThrow('Database crashed');
  });
});


describe('regardDeviceObjectDeletion', () => {
  const dummyUrl = 'http://dummy-url';
  const dummyUser = {};
  const dummyOriginator = 'origin';
  const dummyXCorrelator = 'x-corr';
  const dummyTrace = 'trace';
  const dummyCustomerJourney = 'journey';

  const validBody = {
    deviceObject: {
      'object-path': '/root/live/control-construct=xyz/device',
      counter: 5,
      timestamp: 1715178898000,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock global proxy
    global.proxy = {
      'application-name': 'myApp',
      'release-number': '1.2.3',
    };
  });

  it('should resolve when all operations succeed', async () => {

        const spy = jest.spyOn(Utility, "ReadRecords");
        spy.mockResolvedValue({ device: 'data' });

       cacheUpdate.cacheUpdateBuilder.mockReturnValue({ updated: true });

       IndividualService.__Rewire__('recordRequest', jest.fn().mockResolvedValue(456));
       IndividualService.__Rewire__('notifyAllDeviceSubscribers', jest.fn().mockResolvedValue());
       IndividualService.__Rewire__('decodeMountName', jest.fn().mockReturnValue('mount-1'));
       //IndividualService.__Rewire__('notifyAllDeviceSubscribers', jest.fn().mockResolvedValue());
       IndividualService.__Rewire__('modificaUUID', jest.fn());
       IndividualService.__Rewire__('modifyReturnJson', jest.fn());
    

    await expect(
      IndividualService.regardDeviceObjectDeletion(dummyUrl, validBody, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyCustomerJourney)
    ).resolves.toBeUndefined();

    const called = IndividualService.__GetDependency__('notifyAllDeviceSubscribers');
     expect(called).toHaveBeenCalledTimes(1);

     const modifyReturn = IndividualService.__GetDependency__('modifyReturnJson');
     expect(modifyReturn).toHaveBeenCalledTimes(1);

    const notifyAllDeviceSub = IndividualService.__GetDependency__('notifyAllDeviceSubscribers');
    expect(notifyAllDeviceSub).toHaveBeenCalledWith(
      '/v1/notify-object-deletions',
      expect.objectContaining({
        'myApp-1-2:object-deletion-notification': expect.objectContaining({
          counter: 5,
          timestamp: 1715178898000,
          'object-path': '/root/live/control-construct=xyz/device',
        }),
      })
    );
  
    expect(Utility.ReadRecords).toHaveBeenCalledWith('xyz');
    expect(cacheUpdate.cacheUpdateBuilder).toHaveBeenCalled();
    expect(metaDataUtility.updateMDTableForPartialCCUpdate).toHaveBeenCalledWith('mount-1', 1715178898000);

        // Reset the mock
    IndividualService.__ResetDependency__('notifyAllDeviceSubscribers');
  });

  it('should reject with error when ReadRecords returns undefined', async () => {
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockResolvedValue(undefined);

    await expect(
      IndividualService.regardDeviceObjectDeletion(dummyUrl, validBody, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyCustomerJourney)
    ).rejects.toThrow('Bad gateway. The resource/service that is addressed does not exist at the device/application.');
  });

  it('should reject if an unexpected error occurs', async () => {
    const spy = jest.spyOn(Utility, "ReadRecords");
    spy.mockImplementation(() => {
      throw new Error('"Bad gateway. The resource/service that is addressed does not exist at the device/application.');
    });

    await expect(
      IndividualService.regardDeviceObjectDeletion(dummyUrl, validBody, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyCustomerJourney)
    ).rejects.toThrow('"Bad gateway. The resource/service that is addressed does not exist at the device/application.');
  });
  
});


describe('regardDeviceObjectCreation', () => {
  const dummyUrl = encodeURIComponent('http://dummy-base/live/control-construct=abc/device');
  const dummyUser = {};
  const dummyOriginator = 'origin';
  const dummyXCorrelator = 'x-corr';
  const dummyTrace = 'trace';
  const dummyCustomerJourney = 'journey';

  const validBody = {
    deviceObject: {
      'object-path': '/live/control-construct=abc/device',
      counter: 123,
      timestamp: 1715178898000,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.proxy = {
      'application-name': 'myApp',
      'release-number': '1.2.3',
    };
    global.notify = [
      {
        finalTcpAddr: 'http://127.0.0.1:4015',
        key: 'Operation key not yet provided.',
        protocol: 'HTTP'  
      }];

    IndividualService.__Rewire__('sentDataToRequestor', jest.fn().mockResolvedValue({ status: 200 }));
    IndividualService.__Rewire__('notifyAllDeviceSubscribers', jest.fn());
    IndividualService.__Rewire__('decodeMountName', jest.fn().mockReturnValue('mount-xyz'));

    const mockMetaDataUtility = {
      updateMDTableForPartialCCUpdate: jest.fn()
    };
    IndividualService.__Rewire__('metaDataUtility', mockMetaDataUtility);
  });

  afterEach(() => {
    IndividualService.__ResetDependency__('sentDataToRequestor');
    IndividualService.__ResetDependency__('notifyAllDeviceSubscribers');
    IndividualService.__ResetDependency__('decodeMountName');
    IndividualService.__ResetDependency__('metaDataUtility');
    IndividualService.__ResetDependency__('notify');
  });

  it('should resolve when object creation and notification succeed', async () => {
    await expect(
      IndividualService.regardDeviceObjectCreation(
        dummyUrl,
        validBody,
        dummyUser,
        dummyOriginator,
        dummyXCorrelator,
        dummyTrace,
        dummyCustomerJourney
      )
    ).resolves.toBeUndefined();

    const notifyFn = IndividualService.__GetDependency__('notifyAllDeviceSubscribers');
    expect(notifyFn).toHaveBeenCalledTimes(1);

    const meta = IndividualService.__GetDependency__('metaDataUtility');
    expect(meta.updateMDTableForPartialCCUpdate).toHaveBeenCalledWith(
      'mount-xyz',
      1715178898000
    );
  });

  it('should reject if sentDataToRequestor returns null', async () => {
    IndividualService.__Rewire__('sentDataToRequestor', jest.fn().mockResolvedValue(null));

    await expect(
      IndividualService.regardDeviceObjectCreation(
        dummyUrl,
        validBody,
        dummyUser,
        dummyOriginator,
        dummyXCorrelator,
        dummyTrace,
        dummyCustomerJourney
      )
    ).rejects.toThrow(/Bad gateway/);
  });

  it('should reject if sentDataToRequestor returns 404', async () => {
    IndividualService.__Rewire__('sentDataToRequestor', jest.fn().mockResolvedValue({ status: 404 }));

    await expect(
      IndividualService.regardDeviceObjectCreation(
        dummyUrl,
        validBody,
        dummyUser,
        dummyOriginator,
        dummyXCorrelator,
        dummyTrace,
        dummyCustomerJourney
      )
    ).rejects.toThrow(/Bad gateway/);
  });

  it('should reject with custom error if response has message', async () => {
    IndividualService.__Rewire__('sentDataToRequestor', jest.fn().mockResolvedValue({
      status: 500,
      response: {
        message: 'Internal failure'
      }
    }));

    await expect(
      IndividualService.regardDeviceObjectCreation(
        dummyUrl,
        validBody,
        dummyUser,
        dummyOriginator,
        dummyXCorrelator,
        dummyTrace,
        dummyCustomerJourney
      )
    ).rejects.toThrow(/500.*Internal failure/);
  });
});



describe('regardDeviceAttributeValueChange', () => {
const dummyUrl = encodeURIComponent('http://dummy-url');
const dummyBody = {
  deviceObject: {
    'object-path': '/root/live/control-construct=xyz/device',
    counter: 1,
    timestamp: 1715178898000,
    'attribute-name': 'temperature',
    'new-value': '22C'
  }
};
const dummyUser = {}, dummyOriginator = 'origin', dummyXCorrelator = 'x-corr', dummyTrace = 'trace', dummyCustomerJourney = 'journey';

  let notifyMock, sentMock, hasAttributeMock, decodeMountNameMock, metaUpdateMock;

  beforeEach(() => {
    jest.clearAllMocks();

    global.proxy = {
      'application-name': 'TestApp',
      'release-number': '1.2.3'
    };

    // Mock internal dependencies using __Rewire__ if using babel-plugin-rewire
    notifyMock = jest.fn();
    sentMock = jest.fn();
    hasAttributeMock = jest.fn();
    decodeMountNameMock = jest.fn(() => 'mount-xyz');
    metaUpdateMock = {
      updateMDTableForPartialCCUpdate: jest.fn()
    };

    IndividualService.__Rewire__('notify', [{ finalTcpAddr: encodeURIComponent('http://internal-url'), key: 'key123' }]);
    IndividualService.__Rewire__('sentDataToRequestor', sentMock);
    IndividualService.__Rewire__('notifyAllDeviceSubscribers', notifyMock);
    IndividualService.__Rewire__('decodeMountName', decodeMountNameMock);
    IndividualService.__Rewire__('metaDataUtility', metaUpdateMock);
    IndividualService.__Rewire__('hasAttribute', hasAttributeMock);
  });

  it('should resolve when everything succeeds', async () => {
    sentMock.mockResolvedValue({ status: 200, data: { temperature: '22C' } });
    hasAttributeMock.mockReturnValue(true);

    await expect(
      IndividualService.regardDeviceAttributeValueChange(
        dummyUrl, dummyBody, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyCustomerJourney
      )
    ).resolves.toBeUndefined();

    expect(notifyMock).toHaveBeenCalledWith('/v1/notify-attribute-value-changes', expect.any(Object));
    expect(metaUpdateMock.updateMDTableForPartialCCUpdate).toHaveBeenCalledWith('mount-xyz', 1715178898000);
  });

  it('should reject if sentDataToRequestor returns null', async () => {
    sentMock.mockResolvedValue(null);

    await expect(
      IndividualService.regardDeviceAttributeValueChange(
        dummyUrl, dummyBody, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyCustomerJourney
      )
    ).rejects.toThrow('Not Found');
  });

  it('should reject if attribute is not found in response data', async () => {
    sentMock.mockResolvedValue({ status: 200, data: {} });
    hasAttributeMock.mockReturnValue(false);

    await expect(
      IndividualService.regardDeviceAttributeValueChange(
        dummyUrl, dummyBody, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyCustomerJourney
      )
    ).rejects.toThrow("resource specified in the request does not exist within the connected device");
  });

  it('should reject if response is not 200 and has message', async () => {
    sentMock.mockResolvedValue({
      status: 500,
      response: { status: 500, message: 'Internal failure' },
    });

    await expect(
      IndividualService.regardDeviceAttributeValueChange(
        dummyUrl, dummyBody, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyCustomerJourney
      )
    ).rejects.toThrow("Internal failure");
  });
});


describe('regardDeviceAlarm', () => {
  const dummyUrl = encodeURIComponent('http://dummy-url');
  const dummyBody = {
    alarmObject: {
      resource: '/root/live/control-construct=device-1',
      timestamp: 1715178898000,
      'alarm-type-id': 'type-1',
      'alarm-type-qualifier': 'qualifier-1',
      'problem-severity': 'critical',
    }
  };
  const dummyUser = {}, dummyOriginator = 'origin', dummyXCorrelator = 'x', dummyTrace = 'trace', dummyJourney = 'journey';

  let decodeMountNameMock,
    readRecordsMock,
    modifyJsonMock,
    updateAlarmMock,
    modificaUUIDMock,
    recordRequestMock,
    metaUpdateMock;

  beforeEach(() => {
    jest.clearAllMocks();

    decodeMountNameMock = jest.fn(() => 'mount-1');
    readRecordsMock = jest.fn();
    modifyJsonMock = jest.fn();
    updateAlarmMock = jest.fn();
    modificaUUIDMock = jest.fn();
    recordRequestMock = jest.fn(() => 123);
    metaUpdateMock = {
      updateMDTableForPartialCCUpdate: jest.fn()
    };

    IndividualService.__Rewire__('decodeMountName', decodeMountNameMock);
    IndividualService.__Rewire__('ReadRecords', readRecordsMock);
    IndividualService.__Rewire__('modifyReturnJson', modifyJsonMock);
    IndividualService.__Rewire__('alarmHandler', { updateAlarmByTypeAndResource: updateAlarmMock });
    IndividualService.__Rewire__('modificaUUID', modificaUUIDMock);
    IndividualService.__Rewire__('recordRequest', recordRequestMock);
    IndividualService.__Rewire__('metaDataUtility', metaUpdateMock);
  });

  it('should resolve when all operations succeed', async () => {
    readRecordsMock.mockResolvedValue({});

    await expect(
      IndividualService.regardDeviceAlarm(dummyUrl, dummyBody, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyJourney)
    ).resolves.toBeUndefined();

    expect(decodeMountNameMock).toHaveBeenCalledWith('/root/live/control-construct=device-1', false);
    expect(updateAlarmMock).toHaveBeenCalledWith(expect.anything(), 'type-1', '/root/live/control-construct=device-1', 'critical', expect.objectContaining({
      'alarm-severity': 'alarms-1-0:SEVERITY_TYPE_CRITICAL',
      'resource': '/root/live/control-construct=device-1'
    }));
    expect(metaUpdateMock.updateMDTableForPartialCCUpdate).toHaveBeenCalledWith('mount-1', 1715178898000);
  });

  it('should reject with NotFound error if ReadRecords returns undefined', async () => {
    readRecordsMock.mockResolvedValue(undefined);

    await expect(
      IndividualService.regardDeviceAlarm(dummyUrl, dummyBody, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyJourney)
    ).rejects.toThrow("unable to find device");
  });

  it('should reject on any thrown error', async () => {
    readRecordsMock.mockRejectedValue(new Error('something failed'));

    await expect(
      IndividualService.regardDeviceAlarm(dummyUrl, dummyBody, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyJourney)
    ).rejects.toThrow('something failed');
  });
});


describe('provideListOfDeviceInterfaces', () => {
  const dummyUrl = 'http://dummy.url?fields=logical-termination-point';
  const dummyBody = { 'mount-name': 'device-1' };
  const dummyUser = {}, dummyOriginator = 'origin', dummyXCorrelator = 'x', dummyTrace = 'trace', dummyJourney = 'journey';

  const interfaceResponseSchema = {
    type: 'object',
    properties: {
      'logical-termination-point-list': {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            uuid: { type: 'string' },
            'local-id': { type: 'string' },
            'layer-protocol-name': { type: 'string' },
          },
          required: ['uuid', 'local-id', 'layer-protocol-name'],
          additionalProperties: false,
        }
      }
    },
    required: ['logical-termination-point-list'],
    additionalProperties: false
  };

  let cacheMock, fieldsManagerMock, readRecordsMock;

  beforeEach(() => {
    jest.clearAllMocks();

    IndividualService.__Rewire__('RequestForListOfDeviceInterfacesCausesReadingFromCache', jest.fn().mockResolvedValue([{ url: dummyUrl }]));
    IndividualService.__Rewire__('formatUrlForOdl', jest.fn().mockReturnValue('http://formatted.url?fields=logical-termination-point'));

    readRecordsMock = jest.fn();
    IndividualService.__Rewire__('ReadRecords', readRecordsMock);

    cacheMock = {
      cacheResponseBuilder: jest.fn(),
    };
    IndividualService.__Rewire__('cacheResponse', cacheMock);

    IndividualService.__Rewire__('modifyReturnJson', jest.fn());

    fieldsManagerMock = {
      decodeFieldsSubstringExt: jest.fn().mockReturnValue({}),
      getFilteredJsonExt: jest.fn(),
    };
    IndividualService.__Rewire__('fieldsManager', fieldsManagerMock);
  });

  it('should resolve with transformed data when everything succeeds', async () => {
    readRecordsMock.mockResolvedValue({});

    cacheMock.cacheResponseBuilder.mockResolvedValue({
      interfaceList: [{
        'logical-termination-point-list': [
          {
            uuid: 'uuid-1',
            'layer-protocol': [{
              'local-id': 'loc-1',
              'layer-protocol-name': 'protocol-name'
            }]
          }
        ]
      }]
    });

    const result = await IndividualService.provideListOfDeviceInterfaces(
      dummyUrl, dummyBody, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyJourney
    );

    const validate = ajv.compile(interfaceResponseSchema);
    const valid = validate(result);
    expect(valid).toBe(true);
    if (!valid) {
      console.error(validate.errors);
    }
  

    
    expect(result).toEqual({
      "logical-termination-point-list": [{
        uuid: 'uuid-1',
        'local-id': 'loc-1',
        'layer-protocol-name': 'protocol-name'
      }]
    });
  });

  it('should throw BadRequest error if mount-name is empty', async () => {
    const invalidBody = { 'mount-name': '' };

    await expect(IndividualService.provideListOfDeviceInterfaces(
      dummyUrl, invalidBody, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyJourney
    )).rejects.toThrow("mount-name must not be empty");
  });

  it('should throw 460 error if ReadRecords returns undefined', async () => {
    readRecordsMock.mockResolvedValue(undefined);

    await expect(IndividualService.provideListOfDeviceInterfaces(
      dummyUrl, dummyBody, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyJourney
    )).rejects.toThrow("Requested device is currently not in connected state");
  });

  it('should throw 404 error if cacheResponseBuilder returns undefined', async () => {
    readRecordsMock.mockResolvedValue({});
    cacheMock.cacheResponseBuilder.mockResolvedValue(undefined);

    await expect(IndividualService.provideListOfDeviceInterfaces(
      dummyUrl, dummyBody, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyJourney
    )).rejects.toThrow("unable to fetch records for mount-name");
  });

  it('should reject on unexpected errors', async () => {
    readRecordsMock.mockRejectedValue(new Error('something broke'));

    await expect(IndividualService.provideListOfDeviceInterfaces(
      dummyUrl, dummyBody, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyJourney
    )).rejects.toThrow('something broke');
  });
});


describe('provideListOfActualDeviceEquipment', () => {
  const url = 'http://dummy.url?fields=equipment';
  const user = {}, originator = '', xCorrelator = '', trace = '', journey = '';

  
  const responseSchema = {
    type: 'object',
    properties: {
      'top-level-equipment': {
        type: 'array',
        items: { type: 'object' }
      },
      'actual-equipment-list': {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            uuid: { type: 'string' },
            'equipment-type-name': { type: 'string' }
          },
          required: ['uuid', 'equipment-type-name'],
          additionalProperties: false
        }
      }
    },
    required: ['top-level-equipment', 'actual-equipment-list'],
    additionalProperties: false
  };


  let mockReadRecords;
  let mockCacheResponse;
  let mockFieldsManager;

  beforeEach(() => {
    jest.clearAllMocks();

    IndividualService.__Rewire__('RequestForListOfActualDeviceEquipmentCausesReadingFromCache', jest.fn().mockResolvedValue([
      { url: url }
    ]));

    IndividualService.__Rewire__('formatUrlForOdl', jest.fn().mockReturnValue(url));

    mockReadRecords = jest.fn();
    IndividualService.__Rewire__('ReadRecords', mockReadRecords);

    mockCacheResponse = {
      cacheResponseBuilder: jest.fn()
    };
    IndividualService.__Rewire__('cacheResponse', mockCacheResponse);

    IndividualService.__Rewire__('modifyReturnJson', jest.fn());

    mockFieldsManager = {
      decodeFieldsSubstringExt: jest.fn(),
      getFilteredJsonExt: jest.fn()
    };
    IndividualService.__Rewire__('fieldsManager', mockFieldsManager);
  });

  it('should resolve with transformed equipment data', async () => {
    const body = { 'mount-name': 'test-mount' };

    mockReadRecords.mockResolvedValue({});

    mockCacheResponse.cacheResponseBuilder.mockResolvedValue({
      deviceData: [{
        'top-level-equipment': [{ uuid: 'top1' }],
        'equipment': [{
          uuid: 'eq1',
          'actual-equipment': {
            'manufactured-thing': {
              'equipment-type': {
                'type-name': 'router'
              }
            }
          }
        }]
      }]
    });

    const result = await IndividualService.provideListOfActualDeviceEquipment(url, body, user, originator, xCorrelator, trace, journey);
 const validate = ajv.compile(responseSchema);
  const valid = validate(result);

  expect(valid).toBe(true);
 
    expect(result).toEqual({
      'top-level-equipment': [{ uuid: 'top1' }],
      'actual-equipment-list': [{
        uuid: 'eq1',
        'equipment-type-name': 'router'
      }]
    });
  });

  it('should throw 400 error if mount-name is empty', async () => {
    await expect(IndividualService.provideListOfActualDeviceEquipment(url, { 'mount-name': '' }, user, originator, xCorrelator, trace, journey))
      .rejects.toThrow("mount-name must not be empty");
  });

  it('should throw 460 error if ReadRecords returns undefined', async () => {
    mockReadRecords.mockResolvedValue(undefined);

    await expect(IndividualService.provideListOfActualDeviceEquipment(url, { 'mount-name': 'test' }, user, originator, xCorrelator, trace, journey))
      .rejects.toThrow("not in connected state");
  });

  it('should throw 404 if cacheResponseBuilder returns undefined', async () => {
    mockReadRecords.mockResolvedValue({});
    mockCacheResponse.cacheResponseBuilder.mockResolvedValue(undefined);

    await expect(IndividualService.provideListOfActualDeviceEquipment(url, { 'mount-name': 'test' }, user, originator, xCorrelator, trace, journey))
      .rejects.toThrow("unable to fetch records");
  });

  it('should filter out undefined equipment-type entries', async () => {
    mockReadRecords.mockResolvedValue({});
    mockCacheResponse.cacheResponseBuilder.mockResolvedValue({
      deviceData: [{
        'top-level-equipment': [],
        'equipment': [
          {
            uuid: 'eq1',
            'actual-equipment': {
              'manufactured-thing': {}
            }
          },
          {
            uuid: 'eq2',
            'actual-equipment': {
              'manufactured-thing': {
                'equipment-type': {
                  'type-name': 'switch'
                }
              }
            }
          }
        ]
      }]
    });

    const result = await IndividualService.provideListOfActualDeviceEquipment(url, { 'mount-name': 'test' }, user, originator, xCorrelator, trace, journey);

    expect(result['actual-equipment-list']).toEqual([
      {
        uuid: 'eq2',
        'equipment-type-name': 'switch'
      }
    ]);
  });

  it('should reject on unexpected error', async () => {
    mockReadRecords.mockRejectedValue(new Error('Unexpected error'));

    await expect(IndividualService.provideListOfActualDeviceEquipment(url, { 'mount-name': 'test' }, user, originator, xCorrelator, trace, journey))
      .rejects.toThrow('Unexpected error');
  });
});


describe('getCachedControlConstruct', () => {
  const dummyUrl = 'http://dummy.url/control-construct=device-1?fields=something';
  const dummyUser = {}, dummyOriginator = 'origin', dummyXCorrelator = 'x', dummyTrace = 'trace', dummyJourney = 'journey';
  const dummyMountName = 'device-1';
  const dummyFields = 'logical-termination-point';

  let readRecordsMock, decodeMock, cacheMock, urlUtilMock;

  beforeEach(() => {
    jest.clearAllMocks();

    global.common = [null, { tcpConn: 'tcp-conn', applicationName: 'appName' }];

    IndividualService.__Rewire__('decodeURIWithCheck', jest.fn(url => url));
    IndividualService.__Rewire__('isFilterValid', jest.fn(() => true));
    IndividualService.__Rewire__('decodeMountName', jest.fn(() => dummyMountName));
    IndividualService.__Rewire__('modifyUrlConcatenateMountNamePlusUuid', jest.fn((url, name) => `${url}/${name}`));
    IndividualService.__Rewire__('retrieveCorrectUrl', jest.fn(async (url) => url));

    readRecordsMock = jest.fn();
    IndividualService.__Rewire__('ReadRecords', readRecordsMock);

    cacheMock = {
      cacheResponseBuilder: jest.fn()
    };
    IndividualService.__Rewire__('cacheResponse', cacheMock);

    IndividualService.__Rewire__('modifyReturnJson', jest.fn());

    IndividualService.__Rewire__('fieldsManager', {
      decodeFieldsSubstringExt: jest.fn(),
      getFilteredJsonExt: jest.fn()
    });

    IndividualService.__Rewire__('replaceFilterString', jest.fn(str => str));
    IndividualService.__Rewire__('isJsonEmpty', jest.fn(() => false));
  });

  it('should resolve with filtered response when successful', async () => {
    readRecordsMock.mockResolvedValue({});
    cacheMock.cacheResponseBuilder.mockResolvedValue({
      controlConstruct: [{ id: '123' }]
    });

    const result = await IndividualService.getCachedControlConstruct(
      dummyUrl, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyJourney, dummyMountName, dummyFields
    );

    expect(result).toEqual({ controlConstruct: [{ id: '123' }] });
    expect(result).toEqual({ controlConstruct: [{ id: '123' }] });
  expect(result).toHaveProperty('controlConstruct');
  expect(result.controlConstruct).toBeInstanceOf(Array);
  expect(result.controlConstruct[0]).toHaveProperty('id', '123');
  });

  it('should throw BadRequest if fields are invalid', async () => {
    IndividualService.__Rewire__('isFilterValid', jest.fn(() => false));

    await expect(
      IndividualService.getCachedControlConstruct(dummyUrl, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyJourney, dummyMountName, dummyFields)
    ).rejects.toThrow(createHttpError.BadRequest);
  });

  it('should throw custom error if mountname is an object', async () => {
    IndividualService.__Rewire__('decodeMountName', jest.fn(() => [{ code: 488, message: 'Mount invalid' }]));

    await expect(
      IndividualService.getCachedControlConstruct(dummyUrl, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyJourney, dummyMountName, dummyFields)
    ).rejects.toThrow('Mount invalid');
  });

  it('should throw 460 if ReadRecords returns undefined', async () => {
    readRecordsMock.mockResolvedValue(undefined);

    await expect(
      IndividualService.getCachedControlConstruct(dummyUrl, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyJourney, dummyMountName, dummyFields)
    ).rejects.toThrow('Requested device is currently not in connected state at the controller');
  });

  it('should throw 470 if cacheResponseBuilder returns undefined', async () => {
    readRecordsMock.mockResolvedValue({});
    cacheMock.cacheResponseBuilder.mockResolvedValue(undefined);

    await expect(
      IndividualService.getCachedControlConstruct(dummyUrl, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyJourney, dummyMountName, dummyFields)
    ).rejects.toThrow('Resource not existing. Device informs about addressed resource unknown');
  });

  it('should throw 470 if filtered JSON is empty', async () => {
    IndividualService.__Rewire__('isJsonEmpty', jest.fn(() => true));
    readRecordsMock.mockResolvedValue({});
    cacheMock.cacheResponseBuilder.mockResolvedValue({ controlConstruct: [{}] });

    await expect(
      IndividualService.getCachedControlConstruct(dummyUrl, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyJourney, dummyMountName, dummyFields)
    ).rejects.toThrow('Resource not existing. Device informs about addressed resource unknown');
  });

  it('should reject on unexpected errors', async () => {
    readRecordsMock.mockRejectedValue(new Error('Unexpected failure'));

    await expect(
      IndividualService.getCachedControlConstruct(dummyUrl, dummyUser, dummyOriginator, dummyXCorrelator, dummyTrace, dummyJourney, dummyMountName, dummyFields)
    ).rejects.toThrow('Unexpected failure');
  });
});


describe('getCachedAlarmCapability', () => {
  const dummyUrl = 'http://dummy.url/control-construct=device-1?fields=logical-termination-point';
  const dummyUser = {};
  const dummyOriginator = 'origin';
  const dummyXCorrelator = 'x';
  const dummyTrace = 'trace';
  const dummyJourney = 'journey';
  const dummyMountName = 'device-1';
  const dummyFields = 'logical-termination-point';

  global.common = [null, { tcpConn: 'tcp-conn', applicationName: 'appName' }];
  let readRecordsMock;
  let cacheResponseBuilderMock;
  let decodeMountNameMock;
  let retrieveCorrectUrlMock;
  let modifyUrlConcatenateMountNamePlusUuidMock;
  let modifyReturnJsonMock;
  let isFilterValidMock;
  let decodeFieldsSubstringExtMock;
  let getFilteredJsonExtMock;
  let isJsonEmptyMock;

  beforeEach(() => {
    jest.clearAllMocks();
     

    // Mock dependencies using babel-plugin-rewire
    readRecordsMock = jest.fn();
    cacheResponseBuilderMock = jest.fn();
    decodeMountNameMock = jest.fn();
    retrieveCorrectUrlMock = jest.fn();
    modifyUrlConcatenateMountNamePlusUuidMock = jest.fn();
    modifyReturnJsonMock = jest.fn();
    isFilterValidMock = jest.fn();
    decodeFieldsSubstringExtMock = jest.fn();
    getFilteredJsonExtMock = jest.fn();
    isJsonEmptyMock = jest.fn();

    // Rewire dependencies
    IndividualService.__Rewire__('ReadRecords', readRecordsMock);
    IndividualService.__Rewire__('cacheResponse', { cacheResponseBuilder: cacheResponseBuilderMock });
    IndividualService.__Rewire__('decodeMountName', decodeMountNameMock);
    IndividualService.__Rewire__('retrieveCorrectUrl', retrieveCorrectUrlMock);
    IndividualService.__Rewire__('modifyUrlConcatenateMountNamePlusUuid', modifyUrlConcatenateMountNamePlusUuidMock);
    IndividualService.__Rewire__('modifyReturnJson', modifyReturnJsonMock);
    IndividualService.__Rewire__('isFilterValid', isFilterValidMock);
    IndividualService.__Rewire__('fieldsManager', {
      decodeFieldsSubstringExt: decodeFieldsSubstringExtMock,
      getFilteredJsonExt: getFilteredJsonExtMock,
    });
    IndividualService.__Rewire__('isJsonEmpty', isJsonEmptyMock);

    // Set default return values
    isFilterValidMock.mockReturnValue(true);
    decodeMountNameMock.mockReturnValue(dummyMountName);
    retrieveCorrectUrlMock.mockResolvedValue('http://correct.url');
    modifyUrlConcatenateMountNamePlusUuidMock.mockReturnValue('http://correct.url/device-1');
    readRecordsMock.mockResolvedValue({ some: 'data' });
    cacheResponseBuilderMock.mockResolvedValue({ controlConstruct: [{ id: '123' }] });
    isJsonEmptyMock.mockReturnValue(false);
  });

  afterEach(() => {
    // Reset rewired dependencies
    IndividualService.__ResetDependency__('ReadRecords');
    IndividualService.__ResetDependency__('cacheResponse');
    IndividualService.__ResetDependency__('decodeMountName');
    IndividualService.__ResetDependency__('retrieveCorrectUrl');
    IndividualService.__ResetDependency__('modifyUrlConcatenateMountNamePlusUuid');
    IndividualService.__ResetDependency__('modifyReturnJson');
    IndividualService.__ResetDependency__('isFilterValid');
    IndividualService.__ResetDependency__('fieldsManager');
    IndividualService.__ResetDependency__('isJsonEmpty');
  });

  it('should resolve with filtered response when successful', async () => {
    const result = await IndividualService.getCachedAlarmCapability(
      dummyUrl,
      dummyUser,
      dummyOriginator,
      dummyXCorrelator,
      dummyTrace,
      dummyJourney,
      dummyMountName,
      dummyFields
    );

    expect(result).toEqual({ controlConstruct: [{ id: '123' }] });
    expect(readRecordsMock).toHaveBeenCalledWith(dummyMountName);
    expect(cacheResponseBuilderMock).toHaveBeenCalled();
    expect(modifyReturnJsonMock).toHaveBeenCalled();
  });

  it('should throw BadRequest if fields are invalid', async () => {
    isFilterValidMock.mockReturnValue(false);

    await expect(
      IndividualService.getCachedAlarmCapability(
        dummyUrl,
        dummyUser,
        dummyOriginator,
        dummyXCorrelator,
        dummyTrace,
        dummyJourney,
        dummyMountName,
        dummyFields
      )
    ).rejects.toThrow('Bad Request');
  });

  it('should throw custom error if mountname is an object', async () => {
    decodeMountNameMock.mockReturnValue([{ code: 488, message: 'Mount invalid' }]);

    await expect(
      IndividualService.getCachedAlarmCapability(
        dummyUrl,
        dummyUser,
        dummyOriginator,
        dummyXCorrelator,
        dummyTrace,
        dummyJourney,
        dummyMountName,
        dummyFields
      )
    ).rejects.toThrow('Mount invalid');
  });

  it('should throw 460 if ReadRecords returns undefined', async () => {
    readRecordsMock.mockResolvedValue(undefined);

    await expect(
      IndividualService.getCachedAlarmCapability(
        dummyUrl,
        dummyUser,
        dummyOriginator,
        dummyXCorrelator,
        dummyTrace,
        dummyJourney,
        dummyMountName,
        dummyFields
      )
    ).rejects.toThrow('Requested device is currently not in connected state at the controller');
  });

  it('should throw 470 if cacheResponseBuilder returns undefined', async () => {
    cacheResponseBuilderMock.mockResolvedValue(undefined);

    await expect(
      IndividualService.getCachedAlarmCapability(
        dummyUrl,
        dummyUser,
        dummyOriginator,
        dummyXCorrelator,
        dummyTrace,
        dummyJourney,
        dummyMountName,
        dummyFields
      )
    ).rejects.toThrow('Resource not existing. Device informs about addressed resource unknown');
  });

  it('should throw 470 if filtered JSON is empty', async () => {
    isJsonEmptyMock.mockReturnValue(true);

    await expect(
      IndividualService.getCachedAlarmCapability(
        dummyUrl,
        dummyUser,
        dummyOriginator,
        dummyXCorrelator,
        dummyTrace,
        dummyJourney,
        dummyMountName,
        dummyFields
      )
    ).rejects.toThrow('Resource not existing. Device informs about addressed resource unknown');
  });

  it('should reject on unexpected errors', async () => {
    readRecordsMock.mockRejectedValue(new Error('Unexpected failure'));

    await expect(
      IndividualService.getCachedAlarmCapability(
        dummyUrl,
        dummyUser,
        dummyOriginator,
        dummyXCorrelator,
        dummyTrace,
        dummyJourney,
        dummyMountName,
        dummyFields
      )
    ).rejects.toThrow('Unexpected failure');
  });
});
