
const forwardingConstructConfigurationInput = require('onf-core-model-ap/applicationPattern/onfModel/services/models/forwardingConstruct/ConfigurationInput');
const operationClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationClientInterface');
const forwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const FcPort = require('onf-core-model-ap/applicationPattern/onfModel/models/FcPort');

const PrepareForwardingConfiguration =require('./PrepareForwardingConfiguration')

jest.mock(
  'onf-core-model-ap/applicationPattern/onfModel/services/models/forwardingConstruct/ConfigurationInput',
  () => {
    return jest.fn().mockImplementation((forwardingName, uuid) => ({
      forwardingName,
      operationClientUuid: uuid
    }));
  }
);

jest.mock(
  'onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationClientInterface',
  () => ({
    getOperationNameAsync: jest.fn()
  })
);


jest.mock(
  'onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain',
  () => ({
    getForwardingConstructListForTheFcPortAsync: jest.fn()
  })
);

jest.mock(
  'onf-core-model-ap/applicationPattern/onfModel/models/FcPort',
  () => ({
    portDirectionEnum: {
      OUTPUT: 'OUTPUT'
    }
  })
);

describe('regardApplication', () => {
  const redirectServiceRequestOperation = 'TARGET_OPERATION';

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('✅ returns list with one forwarding config input when operation name matches', async () => {
    const configList = [{ uuid: 'uuid-1' }];
    operationClientInterface.getOperationNameAsync.mockResolvedValueOnce('TARGET_OPERATION');

    const result = await PrepareForwardingConfiguration.regardApplication(configList, redirectServiceRequestOperation);

    expect(operationClientInterface.getOperationNameAsync).toHaveBeenCalledWith('uuid-1');
    expect(forwardingConstructConfigurationInput).toHaveBeenCalledWith(
      'ApprovedApplicationCausesRequestForServiceRequestInformation',
      'uuid-1'
    );
    expect(result).toEqual([
      {
        forwardingName: 'ApprovedApplicationCausesRequestForServiceRequestInformation',
        operationClientUuid: 'uuid-1'
      }
    ]);
  });

  test('✅ returns empty list when no operation names match', async () => {
    const configList = [{ uuid: 'uuid-1' }, { uuid: 'uuid-2' }];
    operationClientInterface.getOperationNameAsync
      .mockResolvedValueOnce('OTHER_OPERATION')
      .mockResolvedValueOnce('ANOTHER_OPERATION');

    const result = await PrepareForwardingConfiguration.regardApplication(configList, redirectServiceRequestOperation);

    expect(operationClientInterface.getOperationNameAsync).toHaveBeenCalledTimes(2);
    expect(result).toEqual([]);
  });

  test('✅ returns empty list when input list is empty', async () => {
    const result = await PrepareForwardingConfiguration.regardApplication([], redirectServiceRequestOperation);

    expect(result).toEqual([]);
    expect(operationClientInterface.getOperationNameAsync).not.toHaveBeenCalled();
  });

  test('❌ rejects if getOperationNameAsync throws', async () => {
    const configList = [{ uuid: 'uuid-1' }];
    operationClientInterface.getOperationNameAsync.mockRejectedValue(new Error('Fetch failed'));

    await expect(PrepareForwardingConfiguration.regardApplication(configList, redirectServiceRequestOperation)).rejects.toThrow(
      'Fetch failed'
    );
  });
});





/*
describe('disregardApplication', () => {
    let getValueFromKeyMock;
 getValueFromKeyMock = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });



  test('✅ returns forwarding inputs for each forwarding construct', async () => {
    const input = [{ uuid: 'uuid-1' }];

  PrepareForwardingConfiguration.__Rewire__('getValueFromKey', getValueFromKeyMock);
    const forwardingConstructList = [
      { name: [{ ForwardingName: 'Forwarding-A' }] },
      { name: [{ ForwardingName: 'Forwarding-B' }] }
    ];

    getValueFromKeyMock.mockReturnValue([
      { name: [{ ForwardingName: 'Forwarding-A' }] },
      { name: [{ ForwardingName: 'Forwarding-B' }] }
    ]);

    forwardingDomain.getForwardingConstructListForTheFcPortAsync.mockResolvedValue(forwardingConstructList);

    const result = await PrepareForwardingConfiguration.disregardApplication(input);

    expect(forwardingDomain.getForwardingConstructListForTheFcPortAsync).toHaveBeenCalledWith(
      'uuid-1',
      FcPort.portDirectionEnum.OUTPUT
    );

    expect(forwardingConstructConfigurationInput).toHaveBeenCalledTimes(2);
    expect(result).toEqual([
      { forwardingName: 'Forwarding-A', operationClientUuid: 'uuid-1' },
      { forwardingName: 'Forwarding-B', operationClientUuid: 'uuid-1' }
    ]);
  });

  test('✅ returns empty list when no forwarding constructs found', async () => {
    const input = [{ uuid: 'uuid-1' }];
    forwardingDomain.getForwardingConstructListForTheFcPortAsync.mockResolvedValue([]);

    const result = await PrepareForwardingConfiguration.disregardApplication(input);

    expect(result).toEqual([]);
  });

  test('✅ returns empty list when input list is empty', async () => {
    const result = await PrepareForwardingConfiguration.disregardApplication([]);

    expect(result).toEqual([]);
    expect(forwardingDomain.getForwardingConstructListForTheFcPortAsync).not.toHaveBeenCalled();
  });

  test('❌ rejects if getForwardingConstructListForTheFcPortAsync throws', async () => {
    const input = [{ uuid: 'uuid-1' }];
    forwardingDomain.getForwardingConstructListForTheFcPortAsync.mockRejectedValue(new Error('Failure'));

    await expect(PrepareForwardingConfiguration.disregardApplication(input)).rejects.toThrow('Failure');
  });
});*/

describe('disregardApplication', () => {
  let forwardingDomainMock;
  let getValueFromKeyMock;
  let forwardingConstructConfigurationInputMock;

  beforeEach(() => {
    jest.clearAllMocks();

    forwardingDomainMock = {
      getForwardingConstructListForTheFcPortAsync: jest.fn(),
    };

    getValueFromKeyMock = jest.fn();
    forwardingConstructConfigurationInputMock = jest.fn();

    // Rewire dependencies (adjust 'PrepareForwardingConfiguration' to your module)
    PrepareForwardingConfiguration.__Rewire__('forwardingDomain', forwardingDomainMock);
    PrepareForwardingConfiguration.__Rewire__('getValueFromKey', getValueFromKeyMock);
    PrepareForwardingConfiguration.__Rewire__('forwardingConstructConfigurationInput', forwardingConstructConfigurationInputMock);
  });

  afterEach(() => {
    PrepareForwardingConfiguration.__ResetDependency__('forwardingDomain');
    PrepareForwardingConfiguration.__ResetDependency__('getValueFromKey');
    PrepareForwardingConfiguration.__ResetDependency__('forwardingConstructConfigurationInput');
  });

  it('should resolve with list of forwardingConfigurationInput for each forwarding construct', async () => {
    const inputList = [
      { uuid: 'uuid-1' },
      { uuid: 'uuid-2' },
    ];

    forwardingDomainMock.getForwardingConstructListForTheFcPortAsync
      .mockResolvedValueOnce([
        { name: [{ key: 'ForwardingName', value: 'Forwarding-A1' }] },
        { name: [{ key: 'ForwardingName', value: 'Forwarding-A2' }] },
      ])
      .mockResolvedValueOnce([
        { name: [{ key: 'ForwardingName', value: 'Forwarding-B1' }] },
      ]);

    getValueFromKeyMock.mockImplementation((list, key) =>
      list.find(item => item.key === key)?.value
    );

    forwardingConstructConfigurationInputMock.mockImplementation((forwardingName, uuid) => ({
      forwardingName,
      operationClientUuid: uuid,
    }));

    const result = await PrepareForwardingConfiguration.disregardApplication(inputList);

    expect(result).toEqual([
      { forwardingName: 'Forwarding-A1', operationClientUuid: 'uuid-1' },
      { forwardingName: 'Forwarding-A2', operationClientUuid: 'uuid-1' },
      { forwardingName: 'Forwarding-B1', operationClientUuid: 'uuid-2' },
    ]);

    expect(forwardingDomainMock.getForwardingConstructListForTheFcPortAsync).toHaveBeenCalledTimes(2);
    expect(forwardingDomainMock.getForwardingConstructListForTheFcPortAsync).toHaveBeenCalledWith(
      'uuid-1',
      FcPort.portDirectionEnum.OUTPUT
    );
    expect(forwardingDomainMock.getForwardingConstructListForTheFcPortAsync).toHaveBeenCalledWith(
      'uuid-2',
      FcPort.portDirectionEnum.OUTPUT
    );

    expect(getValueFromKeyMock).toHaveBeenCalledTimes(3);
    expect(forwardingConstructConfigurationInputMock).toHaveBeenCalledTimes(3);
  });

  it('should resolve with empty list if no forwarding constructs found', async () => {
    const inputList = [{ uuid: 'uuid-empty' }];

    forwardingDomainMock.getForwardingConstructListForTheFcPortAsync.mockResolvedValueOnce([]);

    const result = await PrepareForwardingConfiguration.disregardApplication(inputList);

    expect(result).toEqual([]);
    expect(forwardingDomainMock.getForwardingConstructListForTheFcPortAsync).toHaveBeenCalledTimes(1);
    expect(getValueFromKeyMock).not.toHaveBeenCalled();
    expect(forwardingConstructConfigurationInputMock).not.toHaveBeenCalled();
  });

  it('should handle forwarding construct with missing ForwardingName gracefully', async () => {
    const inputList = [{ uuid: 'uuid-missing' }];

    forwardingDomainMock.getForwardingConstructListForTheFcPortAsync.mockResolvedValueOnce([
      { name: [{ key: 'SomeOtherKey', value: 'NoForwardingNameHere' }] }
    ]);

    getValueFromKeyMock.mockReturnValue(undefined);

    forwardingConstructConfigurationInputMock.mockImplementation((forwardingName, uuid) => ({
      forwardingName,
      operationClientUuid: uuid,
    }));

    const result = await PrepareForwardingConfiguration.disregardApplication(inputList);

    expect(getValueFromKeyMock).toHaveBeenCalledWith(
      [{ key: 'SomeOtherKey', value: 'NoForwardingNameHere' }],
      'ForwardingName'
    );

    expect(forwardingConstructConfigurationInputMock).toHaveBeenCalledWith(undefined, 'uuid-missing');
    expect(result).toEqual([{ forwardingName: undefined, operationClientUuid: 'uuid-missing' }]);
  });

  it('should reject if getForwardingConstructListForTheFcPortAsync throws', async () => {
    const inputList = [{ uuid: 'uuid-error' }];

    forwardingDomainMock.getForwardingConstructListForTheFcPortAsync.mockRejectedValueOnce(new Error('Mock error'));

    await expect(PrepareForwardingConfiguration.disregardApplication(inputList)).rejects.toThrow('Mock error');
  });

  it('should reject if forwardingConstructConfigurationInput throws', async () => {
    const inputList = [{ uuid: 'uuid-throw' }];

    forwardingDomainMock.getForwardingConstructListForTheFcPortAsync.mockResolvedValueOnce([
      { name: [{ key: 'ForwardingName', value: 'Forwarding-Throw' }] }
    ]);

    getValueFromKeyMock.mockReturnValue('Forwarding-Throw');

    forwardingConstructConfigurationInputMock.mockImplementation(() => {
      throw new Error('Constructor failure');
    });

    await expect(PrepareForwardingConfiguration.disregardApplication(inputList)).rejects.toThrow('Constructor failure');
  });

  it('should resolve immediately with empty list if input is empty', async () => {
    const result = await PrepareForwardingConfiguration.disregardApplication([]);

    expect(result).toEqual([]);
    expect(forwardingDomainMock.getForwardingConstructListForTheFcPortAsync).not.toHaveBeenCalled();
    expect(getValueFromKeyMock).not.toHaveBeenCalled();
    expect(forwardingConstructConfigurationInputMock).not.toHaveBeenCalled();
  });
});



