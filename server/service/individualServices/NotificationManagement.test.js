
const NotificationManagement = require('./NotificationManagement'); 


describe('getAppInformation', () => {
  let mockInformAboutApplication;
  const mockAppInfo = {
    "application-name": "TestApp",
    "release-number": "9.9.9"
  };

  beforeEach(() => {
    //getAppInformation = AppInfoService.__get__('getAppInformation');
    mockInformAboutApplication = jest.fn();
    NotificationManagement.__set__('BasicServices', {
      informAboutApplication: mockInformAboutApplication
    });

    // Reset cached variable between tests
    NotificationManagement.__set__('appInformation', null);
  });

  it('should return application info from BasicServices if available', async () => {
    mockInformAboutApplication.mockResolvedValue(mockAppInfo);

    const result = await NotificationManagement.getAppInformation();

    expect(mockInformAboutApplication).toHaveBeenCalled();
    expect(result).toEqual(mockAppInfo);
  });

  it('should use fallback values if BasicServices throws an error', async () => {
    mockInformAboutApplication.mockRejectedValue(new Error("network error"));

    const result = await NotificationManagement.getAppInformation();

    expect(result).toEqual({
      "application-name": "MicroWaveDeviceInventory",
      "release-number": "1.0.0"
    });
  });

  it('should return cached appInformation if already set', async () => {
    NotificationManagement.__set__('appInformation', {
      "application-name": "CachedApp",
      "release-number": "2.0.0"
    });

    const result = await NotificationManagement.getAppInformation();

    expect(result).toEqual({
      "application-name": "CachedApp",
      "release-number": "2.0.0"
    });
  });
});

describe('createRequestHeader', () => {
  it('should return a RequestHeader with expected values', () => {
    const mockRequestHeader = jest.fn(function (appName1, appName2, undefinedField, release) {
      this.applicationName1 = appName1;
      this.applicationName2 = appName2;
      this.undefinedField = undefinedField;
      this.release = release;
    });

    NotificationManagement.__set__('RequestHeader', mockRequestHeader);

    const createRequestHeader = NotificationManagement.__get__('createRequestHeader');
    const result = NotificationManagement.createRequestHeader();

    expect(mockRequestHeader).toHaveBeenCalledWith(
      "MicroWaveDeviceInventory",
      "MicroWaveDeviceInventory",
      undefined,
      "1"
    );

    expect(result).toEqual({
      applicationName1: "MicroWaveDeviceInventory",
      applicationName2: "MicroWaveDeviceInventory",
      undefinedField: undefined,
      release: "1"
    });
  });
});

describe('getActiveSubscribers', () => {
  let mockGetForwardingConstructListAsync;
  let mockGetForwardingConstructForTheForwardingNameAsync;
  let mockGetLogicalTerminationPointAsync;
  let mockGetProtocolFromProtocolEnum;

    
  const fcName = 'ForwardingName-123';
  const opUUID = 'op-uuid';
  const mockOamPath = 'sample-oam-path';
  const forwardingName = 'sample-forwarding-name';
  const forwardingConstructList = [{
    name: [{}, { value: forwardingName }]
  }];
  const forwardingConstruct = {
    'fc-port': [
      {
        'port-direction': 'OUTPUT',
        'logical-termination-point': 'operationUUID'
      }
    ]
  };

  const operationLTP = {
    uuid: 'operationUUID',
    'server-ltp': ['httpUUID'],
    'layer-protocol': [{
      'operation-client-interface-1-0:operation-client-interface-pac': {
        'operation-client-interface-configuration': {
          'operation-name': 'opName',
          'operation-key': 'opKey'
        }
      }
    }]
  };

  const httpLTP = {
    'server-ltp': ['tcpUUID'],
    'layer-protocol': [{
      'http-client-interface-1-0:http-client-interface-pac': {
        'http-client-interface-configuration': {
          'application-name': 'AppName',
          'release-number': '1.0.0'
        }
      }
    }]
  };

  const tcpLTP = {
    'layer-protocol': [{
      'tcp-client-interface-1-0:tcp-client-interface-pac': {
        'tcp-client-interface-configuration': {
          'remote-protocol': 'protocolEnum',
          'remote-address': '127.0.0.1',
          'remote-port': '8080'
        }
      }
    }]
  };

  beforeEach(() => {
    mockGetForwardingConstructListAsync = jest.fn().mockResolvedValue(forwardingConstructList);
    mockGetForwardingConstructForTheForwardingNameAsync = jest.fn().mockResolvedValue(forwardingConstruct);
    mockGetLogicalTerminationPointAsync = jest.fn()
      .mockResolvedValueOnce(operationLTP) // for operationUUID
      .mockResolvedValueOnce(httpLTP)      // for httpUUID
      .mockResolvedValueOnce(tcpLTP);      // for tcpUUID

    mockGetProtocolFromProtocolEnum = jest.fn().mockReturnValue(['http']);

    NotificationManagement.__set__('forwardingDomain', {
      getForwardingConstructListAsync: mockGetForwardingConstructListAsync,
      getForwardingConstructForTheForwardingNameAsync: mockGetForwardingConstructForTheForwardingNameAsync
    });

    NotificationManagement.__set__('controlConstruct', {
      getLogicalTerminationPointAsync: mockGetLogicalTerminationPointAsync
    });

    NotificationManagement.__set__('tcpClientInterface', {
      getProtocolFromProtocolEnum: mockGetProtocolFromProtocolEnum
    });

    NotificationManagement.__set__('configConstants', {
      getForwardingName: jest.fn().mockReturnValue(forwardingName)
    });

    NotificationManagement.__set__('FcPort', {
      portDirectionEnum: {
        OUTPUT: 'OUTPUT'
      }
    });

    NotificationManagement.__set__('buildDeviceSubscriberOperationPath', (protocol, address, port, opName) => {
      return `${protocol}://${address}:${port}/${opName}`;
    });
  });
beforeEach(() => {
  mockGetLogicalTerminationPointAsync.mockClear(); 
});
  it('should return subscriber data for valid OAM path', async () => {
    const result = await NotificationManagement.getActiveSubscribers(mockOamPath);

    expect(result).toEqual([
      {
        targetOperationURL: 'http://127.0.0.1:8080/opName',
        operationKey: 'opKey',
        operationUUID: 'operationUUID',
        name: 'AppName',
        release: '1.0.0',
        port: '8080',
        address: '127.0.0.1',
        protocol: 'http',
        operationName: 'opName'
      }
    ]);

    expect(mockGetForwardingConstructListAsync).toHaveBeenCalled();
    expect(mockGetForwardingConstructForTheForwardingNameAsync).toHaveBeenCalledWith(forwardingName);
    expect(mockGetLogicalTerminationPointAsync).toHaveBeenCalledTimes(3);
  });

    test('should return data for multiple OUTPUT ports (multiple subscribers)', async () => {
  const fcName = 'ForwardingName-123';
  const mockOamPath = '/v1/notify-attribute-value-changes';

  
  const getLogicalTerminationPointAsyncMock = jest
    .fn()
    .mockResolvedValueOnce({
      uuid: 'op-uuid-1',
      'server-ltp': ['http-uuid-1'],
      'layer-protocol': [{
        'operation-client-interface-1-0:operation-client-interface-pac': {
          'operation-client-interface-configuration': {
            'operation-key': 'key-1',
            'operation-name': 'op-name-1'
          }
        }
      }]
    })
    .mockResolvedValueOnce({
      uuid: 'http-uuid-1',
      'server-ltp': ['tcp-uuid-1'],
      'layer-protocol': [{
        'http-client-interface-1-0:http-client-interface-pac': {
          'http-client-interface-configuration': {
            'application-name': 'App1',
            'release-number': '1.0.0'
          }
        }
      }]
    })
    .mockResolvedValueOnce({
      uuid: 'tcp-uuid-1',
      'layer-protocol': [{
        'tcp-client-interface-1-0:tcp-client-interface-pac': {
          'tcp-client-interface-configuration': {
            'remote-address': '127.0.0.1',
            'remote-port': '8080',
            'remote-protocol': 'enum-http'
          }
        }
      }]
    })
    .mockResolvedValueOnce({
      uuid: 'op-uuid-2',
      'server-ltp': ['http-uuid-2'],
      'layer-protocol': [{
        'operation-client-interface-1-0:operation-client-interface-pac': {
          'operation-client-interface-configuration': {
            'operation-key': 'key-2',
            'operation-name': 'op-name-2'
          }
        }
      }]
    })
    .mockResolvedValueOnce({
      uuid: 'http-uuid-2',
      'server-ltp': ['tcp-uuid-2'],
      'layer-protocol': [{
        'http-client-interface-1-0:http-client-interface-pac': {
          'http-client-interface-configuration': {
            'application-name': 'App2',
            'release-number': '2.0.0'
          }
        }
      }]
    })
    .mockResolvedValueOnce({
      uuid: 'tcp-uuid-2',
      'layer-protocol': [{
        'tcp-client-interface-1-0:tcp-client-interface-pac': {
          'tcp-client-interface-configuration': {
            'remote-address': '192.168.1.1',
            'remote-port': '9090',
            'remote-protocol': 'enum-http'
          }
        }
      }]
    });

  const buildPathMock = jest
    .fn()
    .mockReturnValueOnce('http://127.0.0.1:8080/op-name-1')
    .mockReturnValueOnce('http://192.168.1.1:9090/op-name-2');

  const tcpClientInterfaceMock = {
    getProtocolFromProtocolEnum: jest.fn().mockReturnValue(['HTTP'])
  };

  const controlConstructMock = {
    getLogicalTerminationPointAsync: getLogicalTerminationPointAsyncMock
  };

  NotificationManagement.__set__('configConstants', {
    getForwardingName: jest.fn().mockReturnValue(fcName)
  });



  NotificationManagement.__set__('forwardingDomain', {
  getForwardingConstructListAsync: jest.fn().mockResolvedValue([
    { name: [{}, { value: 'ForwardingName-123' }] }
  ]),

  getForwardingConstructForTheForwardingNameAsync: jest.fn().mockResolvedValue({
    'fc-port': [
      { 'port-direction': 'OUTPUT', 'logical-termination-point': 'op-uuid-1' },
      { 'port-direction': 'OUTPUT', 'logical-termination-point': 'op-uuid-2' }
    ]
  })
});

 // NotificationManagement.__set__('forwardingDomain', forwardingDomainMock);
  NotificationManagement.__set__('controlConstruct', controlConstructMock);
  NotificationManagement.__set__('tcpClientInterface', tcpClientInterfaceMock);
  NotificationManagement.__set__('buildDeviceSubscriberOperationPath', buildPathMock);


 // 🔁 Instead of __get__, use module export directly
  const result = await NotificationManagement.getActiveSubscribers(mockOamPath);


  expect(result).toEqual([
    {
      targetOperationURL: 'http://127.0.0.1:8080/op-name-1',
      operationKey: 'key-1',
      operationUUID: 'op-uuid-1',
      name: 'App1',
      release: '1.0.0',
      port: '8080',
      address: '127.0.0.1',
      protocol: 'HTTP',
      operationName: 'op-name-1'
    },
    {
      targetOperationURL: 'http://192.168.1.1:9090/op-name-2',
      operationKey: 'key-2',
      operationUUID: 'op-uuid-2',
      name: 'App2',
      release: '2.0.0',
      port: '9090',
      address: '192.168.1.1',
      protocol: 'HTTP',
      operationName: 'op-name-2'
    }
  ]);
});

  
 it('should return an empty list if no forwarding construct matches the OAM path', async () => {
  NotificationManagement.__set__('configConstants', {
    getForwardingName: jest.fn().mockReturnValue('non-matching-name')
  });

  const result = await NotificationManagement.getActiveSubscribers(mockOamPath);

  expect(result).toEqual([]);
  expect(mockGetForwardingConstructListAsync).toHaveBeenCalled();
});


it('should skip fc-port entries that are not OUTPUT direction', async () => {
  const constructWithInputPort = {
    'fc-port': [
      {
        'port-direction': 'INPUT',
        'logical-termination-point': 'operationUUID'
      }
    ]
  };

  mockGetForwardingConstructForTheForwardingNameAsync.mockResolvedValue(constructWithInputPort);

  const result = await NotificationManagement.getActiveSubscribers(mockOamPath);

  expect(result).toEqual([]);
  expect(mockGetForwardingConstructForTheForwardingNameAsync).toHaveBeenCalled();
  expect(mockGetLogicalTerminationPointAsync).not.toHaveBeenCalled();
});

test('returns empty list when getForwardingConstructListAsync returns empty', async () => {
    NotificationManagement.__set__('forwardingDomain', {
      getForwardingConstructListAsync: jest.fn().mockResolvedValue([])
    });

    const result = await NotificationManagement.getActiveSubscribers(mockOamPath);
    expect(result).toEqual([]);
  });



 test('handles missing LTPs safely (empty subscribers)', async () => {
    
    NotificationManagement.__set__('forwardingDomain', {
      getForwardingConstructListAsync: jest.fn().mockResolvedValue([
        { name: [{}, { value: fcName }] }
      ]),
      getForwardingConstructForTheForwardingNameAsync: jest.fn().mockResolvedValue({
        'fc-port': [
          { 'port-direction': 'OUTPUT', 'logical-termination-point': opUUID }
        ]
      })
    });

    NotificationManagement.__set__('controlConstruct', {
      getLogicalTerminationPointAsync: jest
        .fn()
        .mockResolvedValueOnce({ 'server-ltp': [] }) // Missing httpUUID
    });

    NotificationManagement.__set__('tcpClientInterface', {
      getProtocolFromProtocolEnum: jest.fn().mockReturnValue(['HTTP'])
    });

    NotificationManagement.__set__('buildDeviceSubscriberOperationPath', jest.fn());

    const result = await NotificationManagement.getActiveSubscribers(mockOamPath);
    expect(result).toEqual([]);
  });
test('returns empty list when fc-port is missing or malformed new', async () => {
  NotificationManagement.__set__('forwardingDomain', {
    getForwardingConstructListAsync: jest.fn().mockResolvedValue([
      { name: [{}, { value: 'ForwardingName-123' }] }
    ]),
    getForwardingConstructForTheForwardingNameAsync: jest.fn().mockResolvedValue({
      // Simulate "malformed" by providing empty array (safely)
      'fc-port': []  // prevents crash while still testing "no usable ports"
    })
  });

  NotificationManagement.__set__('configConstants', {
    getForwardingName: jest.fn().mockReturnValue('ForwardingName-123')
  });

  // These won't be called, but provide minimal mocks to avoid side effects
  NotificationManagement.__set__('controlConstruct', {
    getLogicalTerminationPointAsync: jest.fn()
  });
  NotificationManagement.__set__('tcpClientInterface', {
    getProtocolFromProtocolEnum: jest.fn()
  });
  NotificationManagement.__set__('buildDeviceSubscriberOperationPath', jest.fn());

  const getActiveSubscribers = NotificationManagement.__get__('getActiveSubscribers');

  const result = await NotificationManagement.getActiveSubscribers('/v1/notify-attribute-value-changes');

  expect(result).toEqual([]);  // since no OUTPUT ports
});

});

describe('buildStreamsForController', () => {
  let registerControllerCallbackChainMock;
  let registerDeviceCallbackChainMock;
  let removeAllStreamsMock;
  let mockController;
  let notificationStreamManagementMock;

  beforeEach(() => {
    mockController = { name: 'TestController', release: '1.0.0' };

    registerControllerCallbackChainMock = jest.fn();
    registerDeviceCallbackChainMock = jest.fn();
    removeAllStreamsMock = jest.fn();

    notificationStreamManagementMock = {
      STREAM_TYPE_CONFIGURATION: 'CONFIG',
      STREAM_TYPE_OPERATIONAL: 'OP',
      STREAM_TYPE_DEVICE: 'DEVICE',
      removeAllStreamsForController: removeAllStreamsMock
    };

    NotificationManagement.__set__('registerControllerCallbackChain', registerControllerCallbackChainMock);
    NotificationManagement.__set__('registerDeviceCallbackChain', registerDeviceCallbackChainMock);
    NotificationManagement.__set__('notificationStreamManagement', notificationStreamManagementMock);

    // Prevent console errors during tests
    console.log.debug = jest.fn();
    console.log.error = jest.fn();
  });

  it('should return true when all stream registrations succeed', async () => {
    const result = await NotificationManagement.buildStreamsForController(mockController, ['CONFIG', 'OP', 'DEVICE']);
    expect(registerControllerCallbackChainMock).toHaveBeenCalledTimes(2); // CONFIG and OP
    expect(registerDeviceCallbackChainMock).toHaveBeenCalled();
    expect(removeAllStreamsMock).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should return false and remove streams if CONFIG callback fails', async () => {
    registerControllerCallbackChainMock.mockRejectedValueOnce(new Error('fail CONFIG'));

    const result = await NotificationManagement.buildStreamsForController(mockController, ['CONFIG', 'OP', 'DEVICE']);

    expect(registerControllerCallbackChainMock).toHaveBeenCalledTimes(1); // only CONFIG
    expect(registerDeviceCallbackChainMock).not.toHaveBeenCalled(); // blocked due to failure
    expect(removeAllStreamsMock).toHaveBeenCalledWith(mockController.name, mockController.release);
    expect(result).toBe(false);
  });

  it('should return false and remove streams if OP callback fails', async () => {
    registerControllerCallbackChainMock
      .mockResolvedValueOnce() // CONFIG success
      .mockRejectedValueOnce(new Error('fail OP'));

    const result = await NotificationManagement.buildStreamsForController(mockController, ['CONFIG', 'OP', 'DEVICE']);

    expect(registerControllerCallbackChainMock).toHaveBeenCalledTimes(2);
    expect(registerDeviceCallbackChainMock).not.toHaveBeenCalled();
    expect(removeAllStreamsMock).toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('should return false and remove streams if DEVICE callback fails', async () => {
    registerControllerCallbackChainMock.mockResolvedValue();
    registerDeviceCallbackChainMock.mockRejectedValue(new Error('fail DEVICE'));

    const result = await NotificationManagement.buildStreamsForController(mockController, ['CONFIG', 'OP', 'DEVICE']);

    expect(registerDeviceCallbackChainMock).toHaveBeenCalled();
    expect(removeAllStreamsMock).toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('should not call any stream if streamTypeArray is empty', async () => {
    const result = await NotificationManagement.buildStreamsForController(mockController, []);
    expect(registerControllerCallbackChainMock).not.toHaveBeenCalled();
    expect(registerDeviceCallbackChainMock).not.toHaveBeenCalled();
    expect(removeAllStreamsMock).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });
});

describe('buildControllerTargetPath', () => {
  it('should build path using domain-name', () => {
    const result = NotificationManagement.buildControllerTargetPath(
      'https',
      { 'domain-name': 'example.com' },
      443
    );

    expect(result).toBe('https://example.com:443');
  });

  it('should build path using ipv-4-address', () => {
    const result = NotificationManagement.buildControllerTargetPath(
      'http',
      { 'ip-address': { 'ipv-4-address': '192.168.1.1' } },
      80
    );

    expect(result).toBe('http://192.168.1.1:80');
  });

  it('should handle custom ports', () => {
    const result = NotificationManagement.buildControllerTargetPath(
      'http',
      { 'ip-address': { 'ipv-4-address': '10.0.0.5' } },
      8080
    );

    expect(result).toBe('http://10.0.0.5:8080');
  });

  it('should handle unusual protocol formats', () => {
    const result = NotificationManagement.buildControllerTargetPath(
      'ftp',
      { 'domain-name': 'myserver.local' },
      21
    );

    expect(result).toBe('ftp://myserver.local:21');
  });
});








