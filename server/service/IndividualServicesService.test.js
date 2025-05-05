const IndividualService = require('./IndividualServicesService')
const Utility = require('./individualServices/utility')
jest.mock('./individualServices/utility');

const Ajv = require("ajv");

const ajv = new Ajv();

const createHttpError = require("http-errors");

//jest.mock('http-errors');

const cyclicProcess = require('./individualServices/CyclicProcessService/cyclicProcess')

jest.mock('./individualServices/CyclicProcessService/cyclicProcess')

const inputValidation = require('./individualServices/InputValidation');

const subscriberManagement = require('./individualServices/SubscriberManagement')

jest.mock('./individualServices/InputValidation');

jest.mock('./individualServices/SubscriberManagement');

const metaDataUtility = require('./individualServices/CyclicProcessService/metaDataUtility')

jest.mock('./individualServices/CyclicProcessService/metaDataUtility');




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

 

    expect(valid).toBe(true);  // ✅ Schema validation

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

  /*

    test('should return valid response with matching schema and status 200', async () => {

      const body = { 'link-id': 'linkA' };

      const url = '/v1/provide-list-of-parallel-links';

      const user = 'test-user';

      const originator = 'test-originator';

      const xCorrelator = '550e8400-e29b-11d4-a716-446655440000';

      const traceIndicator = '1';

      const customerJourney = 'test-customerJourney';

      const spy = jest.spyOn(Utility,"ReadRecords");

      spy.mockImplementation((id) => {

        if (id === 'linkA') {

          return Promise.resolve({

            "core-model-1-4:link": [

              {

                "end-point-list": [

                  { "control-construct": "cc1" },

                  { "control-construct": "cc2" }

                ]

              }

            ]

          });

        } else if (id === 'linkList') {

          return Promise.resolve({ LinkList: ['linkA', 'linkB'] });

        } else if (id === 'linkB') {

          return Promise.resolve({

            "core-model-1-4:link": [

              {

                "end-point-list": [

                  { "control-construct": "cc1" },

                  { "control-construct": "cc2" }

                ]

              }

            ]

          });

        }

      });

      let arraysHaveSameElements = jest.spyOn(Utility,"arraysHaveSameElements")

      arraysHaveSameElements.mockReturnValueOnce(true);

     const result = await IndividualService.provideListOfParallelLinks(url, body, user, originator, xCorrelator, traceIndicator, customerJourney);

      expect(validate(result)).toBe(true);

      const validate = ajv.compile(linkResponseSchema);

      const isValid = validate(result);

      expect(result['parallel-link-list']).toEqual(expect.arrayContaining(['linkA', 'linkB']));

    });

  */

 

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

 

    //expect(result).toEqual({ 'link-list': ['uuid1'] });

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

 

    //  expect(result).toEqual([]); // Nothing returned

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

    // const validate = ajv.compile(linkResponseSchema);

    //const isValid = validate(result);

    // expect(isValid).toBe(true);

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

    //  const validate = ajv.compile(linkResponseSchema);

    //const isValid = validate(result);

 

    //  expect(isValid).toBe(true);

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

  }, {

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

  /*

    test('should reject if mount-name-list is missing or not an array', async () => {

      const invalidBodies = [

        {},

        { 'mount-name-list': null },

        { 'mount-name-list': 'not-an-array' }

      ];

      const spy = jest.spyOn(metaDataUtility,"readMetaDataListFromElasticsearch")

      spy.mockResolvedValue([

        { 'mount-name': 'mnt1' }

      ]);

 

      for (const body of invalidBodies) {

        await expect(

          IndividualService.provideDeviceStatusMetadata(body, user, originator, xCorrelator, traceIndicator, customerJourney)

        ).rejects.toThrow();

      }

    });*/

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

    ).rejects.toEqual(

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

    ).rejects.toEqual(

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

    ).rejects.toEqual(

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