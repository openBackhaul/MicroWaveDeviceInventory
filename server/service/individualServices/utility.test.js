const utility = require('./utility')

const ProfileCollection = require('onf-core-model-ap/applicationPattern/onfModel/models/ProfileCollection');
const Profile = require('onf-core-model-ap/applicationPattern/onfModel/models/Profile');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const createResultArray1 = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
jest.mock('onf-core-model-ap/applicationPattern/services/ElasticsearchService');

jest.mock('onf-core-model-ap/applicationPattern/onfModel/models/ProfileCollection');
jest.mock('onf-core-model-ap/applicationPattern/onfModel/models/Profile');


;





describe('getStringValueForStringProfileNameAsync', () => {
  const STRING_PROFILE = 'string-profile';
  const TEST_STRING_NAME = 'TestName';
  const TEST_STRING_VALUE = 'TestValue';

  beforeAll(() => {
    // Mock enum
    Profile.profileNameEnum = {
      STRING_PROFILE: STRING_PROFILE
    };

    // Mock attributes
    onfAttributes.PROFILE = { PROFILE_NAME: 'profile-name' };
    onfAttributes.STRING_PROFILE = {
      PAC: 'string-profile-pac',
      CAPABILITY: 'capability',
      CONFIGURATION: 'configuration',
      STRING_NAME: 'string-name',
      STRING_VALUE: 'string-value'
    };
  });

  it('should return string value when string profile name matches', async () => {
    const profileList = [
      {
        'profile-name': STRING_PROFILE,
        'string-profile-pac': {
          capability: { 'string-name': TEST_STRING_NAME },
          configuration: { 'string-value': TEST_STRING_VALUE }
        }
      }
    ];

    ProfileCollection.getProfileListAsync.mockResolvedValue(profileList);

    const result = await utility.getStringValueForStringProfileNameAsync(TEST_STRING_NAME);
    expect(result).toBe(TEST_STRING_VALUE);
  });

  it('should return undefined when no profiles exist', async () => {
    ProfileCollection.getProfileListAsync.mockResolvedValue([]);
    const result = await utility.getStringValueForStringProfileNameAsync(TEST_STRING_NAME);
    expect(result).toBeUndefined();
  });

  it('should return undefined when profile name does not match STRING_PROFILE', async () => {
    const profileList = [
      {
        'profile-name': 'non-string-profile',
        'string-profile-pac': {
          capability: { 'string-name': TEST_STRING_NAME },
          configuration: { 'string-value': TEST_STRING_VALUE }
        }
      }
    ];

    ProfileCollection.getProfileListAsync.mockResolvedValue(profileList);

    const result = await utility.getStringValueForStringProfileNameAsync(TEST_STRING_NAME);
    expect(result).toBeUndefined();
  });

  it('should return undefined when string name does not match', async () => {
    const profileList = [
      {
        'profile-name': STRING_PROFILE,
        'string-profile-pac': {
          capability: { 'string-name': 'OtherName' },
          configuration: { 'string-value': TEST_STRING_VALUE }
        }
      }
    ];

    ProfileCollection.getProfileListAsync.mockResolvedValue(profileList);

    const result = await utility.getStringValueForStringProfileNameAsync(TEST_STRING_NAME);
    expect(result).toBeUndefined();
  });


  
});






describe('getIntegerProfileForIntegerName', () => {
  const INTEGER_PROFILE = 'integer-profile';
  const TEST_INTEGER_NAME = 'TargetInteger';
  const MATCHING_PROFILE = {
    'profile-name': INTEGER_PROFILE,
    'integer-profile-pac': {
      capability: { 'integer-name': TEST_INTEGER_NAME },
      configuration: { 'integer-value': 42 }
    }
  };

  beforeAll(() => {
    // Set up attribute constants and enum
    Profile.profileNameEnum = { INTEGER_PROFILE };

    onfAttributes.PROFILE = { PROFILE_NAME: 'profile-name' };
    onfAttributes.INTEGER_PROFILE = {
      PAC: 'integer-profile-pac',
      CAPABILITY: 'capability',
      CONFIGURATION: 'configuration',
      INTEGER_NAME: 'integer-name',
      INTEGER_VALUE: 'integer-value'
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the matching integer profile if found', async () => {
    ProfileCollection.getProfileListAsync.mockResolvedValue([MATCHING_PROFILE]);

    const result = await utility.getIntegerProfileForIntegerName(TEST_INTEGER_NAME);
    expect(result).toEqual(MATCHING_PROFILE);
  });

  it('should return empty object if no profiles exist', async () => {
    ProfileCollection.getProfileListAsync.mockResolvedValue([]);

    const result = await utility.getIntegerProfileForIntegerName(TEST_INTEGER_NAME);
    expect(result).toEqual({});
  });

  it('should return empty object if no matching profile type', async () => {
    const profileList = [{
      'profile-name': 'non-integer-profile'
    }];

    ProfileCollection.getProfileListAsync.mockResolvedValue(profileList);

    const result = await utility.getIntegerProfileForIntegerName(TEST_INTEGER_NAME);
    expect(result).toEqual({});
  });

  it('should return empty object if integer name does not match', async () => {
    const profileList = [{
      'profile-name': INTEGER_PROFILE,
      'integer-profile-pac': {
        capability: { 'integer-name': 'OtherIntegerName' },
        configuration: { 'integer-value': 99 }
      }
    }];

    ProfileCollection.getProfileListAsync.mockResolvedValue(profileList);

    const result = await utility.getIntegerProfileForIntegerName(TEST_INTEGER_NAME);
    expect(result).toEqual({});
  });

  it('should return empty object if PAC or capability is missing', async () => {
    const incompleteProfiles = [
      {
        'profile-name': INTEGER_PROFILE
        // missing PAC
      },
      {
        'profile-name': INTEGER_PROFILE,
        'integer-profile-pac': {
          // missing capability
        }
      }
    ];

    ProfileCollection.getProfileListAsync.mockResolvedValue(incompleteProfiles);

    const result = await utility.getIntegerProfileForIntegerName(TEST_INTEGER_NAME)
    expect(result).toEqual({});
  });

  it('should handle error from getProfileListAsync gracefully', async () => {
    ProfileCollection.getProfileListAsync.mockRejectedValue(new Error('Fetch failed'));

   await expect(utility.getIntegerProfileForIntegerName(TEST_INTEGER_NAME)).rejects.toThrow('Fetch failed');

  });
});



describe('ReadRecords', () => {
  const mockEsClient = {
    search: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();

    global.common = [];
    global.common[1] = {
      indexAlias: 'test-index',
      EsClient: Promise.resolve(mockEsClient)
    };
  });

  it('should return the first record from the result array', async () => {
    const mockSearchResult = { hits: { hits: [{ _source: { foo: 'bar' } }] } };
    const mockResultArray = [{ id: 'record-1' }];

    mockEsClient.search.mockResolvedValue(mockSearchResult);

    const createResultArraySpy = jest.spyOn(createResultArray1, 'createResultArray').mockReturnValue(mockResultArray);

    const result = await utility.ReadRecords('some-id');

    expect(mockEsClient.search).toHaveBeenCalledWith({
      index: 'test-index',
      body: {
        query: { term: { _id: 'some-id' } }
      }
    });
    expect(createResultArraySpy).toHaveBeenCalledWith(mockSearchResult);
    expect(result).toEqual({ id: 'record-1' });

    createResultArraySpy.mockRestore();
  });

  it('should return undefined if createResultArray returns empty array', async () => {
    const mockSearchResult = { hits: { hits: [] } };

    mockEsClient.search.mockResolvedValue(mockSearchResult);

    const createResultArraySpy = jest.spyOn(createResultArray1, 'createResultArray').mockReturnValue([]);

    const result = await utility.ReadRecords('some-id');
    expect(result).toBeUndefined();
    expect(createResultArraySpy).toHaveBeenCalledWith(mockSearchResult);

    createResultArraySpy.mockRestore();
  });

  it('should throw and log error if client.search rejects', async () => {
    const mockError = new Error('Search failed');
    mockEsClient.search.mockRejectedValue(mockError);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(utility.ReadRecords('bad-id')).rejects.toThrow('Search failed');
    expect(consoleSpy).toHaveBeenCalledWith(mockError);

    consoleSpy.mockRestore();
  });
});



let mockEsClient;

describe('recordRequest', () => {
  beforeEach(() => {
    mockEsClient = {
      ingest: {
        getPipeline: jest.fn()
      },
      index: jest.fn()
    };

    global.common = [];
    global.common[1] = {
      EsClient: Promise.resolve(mockEsClient),
      indexAlias: 'test-index'
    };

    jest.clearAllMocks();
  });

  it('should index with pipeline when pipeline exists', async () => {
    mockEsClient.ingest.getPipeline.mockResolvedValue({}); // pipeline exists
    mockEsClient.index.mockResolvedValue({
      body: { result: 'created' }
    });

    const result = await utility.recordRequest({ key: 'value' }, 'record-id');

    expect(mockEsClient.ingest.getPipeline).toHaveBeenCalledWith({ id: 'mwdi' });
    expect(mockEsClient.index).toHaveBeenCalledWith(expect.objectContaining({
      index: 'test-index',
      id: 'record-id',
      body: { key: 'value' },
      pipeline: 'mwdi'
    }));
    expect(result).toHaveProperty('took');
    expect(typeof result.took).toBe('number');
  });

  it('should index without pipeline when pipeline does not exist (404)', async () => {
    const pipelineNotFoundError = new Error('Pipeline not found');
    pipelineNotFoundError.statusCode = 404;
    mockEsClient.ingest.getPipeline.mockRejectedValue(pipelineNotFoundError);

    mockEsClient.index.mockResolvedValue({
      body: { result: 'updated' }
    });

    const result = await utility.recordRequest({ key: 'value' }, 'record-id');

    expect(mockEsClient.index).toHaveBeenCalledWith(expect.not.objectContaining({ pipeline: 'mwdi' }));
    expect(result).toHaveProperty('took');
  });

  it('should rethrow error if pipeline check fails with non-404 error', async () => {
    const unexpectedError = new Error('Internal error');
    unexpectedError.statusCode = 500;
    mockEsClient.ingest.getPipeline.mockRejectedValue(unexpectedError);

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(utility.recordRequest({ key: 'value' }, 'record-id')).rejects.toThrow('Internal error');

    expect(consoleErrorSpy).toHaveBeenCalledWith('An error occurred while checking the pipeline:', unexpectedError);

    consoleErrorSpy.mockRestore();
  });

  it('should return undefined if indexing fails (no result.body.result match)', async () => {
    mockEsClient.ingest.getPipeline.mockResolvedValue({});
    mockEsClient.index.mockResolvedValue({
      body: { result: 'noop' }
    });

    const result = await utility.recordRequest({ key: 'value' }, 'record-id');
    expect(result).toBeUndefined();
  });

  it('should log error if indexing throws', async () => {
    mockEsClient.ingest.getPipeline.mockResolvedValue({});
    const indexError = new Error('Indexing failed');
    mockEsClient.index.mockRejectedValue(indexError);

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await utility.recordRequest({ key: 'value' }, 'record-id');
    expect(consoleErrorSpy).toHaveBeenCalledWith(indexError);
    expect(result).toBeUndefined();

    consoleErrorSpy.mockRestore();
  });
});




describe('getTime', () => {
  beforeAll(() => {
    // Freeze the date/time
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date('2024-05-30T14:23:00Z')); // set a fixed time
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should return formatted local date and time string', () => {
    const result = utility.getTime();
    
    const expected = new Date('2024-05-30T14:23:00Z');
    const expectedString = expected.toLocaleDateString() + ' ' + expected.toLocaleTimeString();

    expect(result).toBe(expectedString);
  });
});


describe('arraysHaveSameElements', () => {
  it('should return true for arrays with same elements in different order', async () => {
    const result = await utility.arraysHaveSameElements([1, 2, 3], [3, 1, 2]);
    expect(result).toBe(true);
  });

  it('should return false for arrays with different elements', async () => {
    const result = await utility.arraysHaveSameElements([1, 2, 3], [4, 5, 6]);
    expect(result).toBe(false);
  });

  it('should return false for arrays with same elements but different frequencies', async () => {
    const result = await utility.arraysHaveSameElements([1, 2, 2], [2, 1, 1]);
    expect(result).toBe(false);
  });

  it('should return true for arrays with duplicate elements that match', async () => {
    const result = await utility.arraysHaveSameElements([1, 2, 2], [2, 1, 2]);
    expect(result).toBe(true);
  });

  it('should return false if lengths differ', async () => {
    const result = await utility.arraysHaveSameElements([1, 2], [1, 2, 3]);
    expect(result).toBe(false);
  });

  it('should return true for two empty arrays', async () => {
    const result = await utility.arraysHaveSameElements([], []);
    expect(result).toBe(true);
  });

  it('should return false if one array is empty', async () => {
    const result = await utility.arraysHaveSameElements([], [1]);
    expect(result).toBe(false);
  });

  it('should not throw on unexpected input and log the error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await utility.arraysHaveSameElements(null, [1]);
    expect(consoleSpy).toHaveBeenCalled();
    expect(result).toBeUndefined();
    consoleSpy.mockRestore();
  });
});



