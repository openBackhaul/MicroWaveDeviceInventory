
const SubscriberManagement = require('./SubscriberManagement');
const individualServicesOperationsMapping = require('./IndividualServicesOperationsMapping');
const TcpObject = require("onf-core-model-ap/applicationPattern/onfModel/services/models/TcpObject");
const httpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpClientInterface');
const LogicalTerminationPointConfigurationInput = require('onf-core-model-ap/applicationPattern/onfModel/services/models/logicalTerminationPoint/ConfigurationInput');
const logicalTerminationPointServices = require('onf-core-model-ap/applicationPattern/onfModel/services/LogicalTerminationPointServices');
const forwardingDomain = require("onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain");
const forwardingConstruct = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingConstruct');
const configConstants = require('./ConfigConstants');
const fcPort = require('onf-core-model-ap/applicationPattern/onfModel/models/FcPort');


const notificationManagement = require('./NotificationManagement');
jest.mock('./NotificationManagement');

jest.mock("onf-core-model-ap/applicationPattern/onfModel/services/models/TcpObject");
jest.mock('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpClientInterface');
jest.mock('onf-core-model-ap/applicationPattern/onfModel/services/models/logicalTerminationPoint/ConfigurationInput');
jest.mock('onf-core-model-ap/applicationPattern/onfModel/services/LogicalTerminationPointServices');
jest.mock("onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain");
jest.mock('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingConstruct');
jest.mock('./ConfigConstants');
jest.mock('onf-core-model-ap/applicationPattern/onfModel/models/FcPort');





describe('logActiveSubscribers', () => {
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log active subscribers for each notification type', async () => {
    // Mock notification types
    configConstants.OAM_PATH_ATTRIBUTE_VALUE_CHANGES = '/notification/value-change';
    configConstants.OAM_PATH_ATTRIBUTE_OBJECT_CREATIONS = '/notification/object-create';
    configConstants.OAM_PATH_ATTRIBUTE_OBJECT_DELETIONS = '/notification/object-delete';

    // Mock active subscribers returned by notificationManagement
    notificationManagement.getActiveSubscribers
      .mockResolvedValueOnce([
        { name: 'sub1', release: '1.0.0' },
        { name: 'sub2', release: '2.0.0' }
      ])
      .mockResolvedValueOnce([
        { name: 'sub3', release: '1.1.1' }
      ])
      .mockResolvedValueOnce([]); // no subscribers for third type

    // Call the function
    await SubscriberManagement.logActiveSubscribers();

    // Assert logs
    expect(consoleLogSpy).toHaveBeenCalledWith("Active subscribers: ");
    expect(consoleLogSpy).toHaveBeenCalledWith("/notification/value-change -> sub1/1.0.0, sub2/2.0.0, ");
    expect(consoleLogSpy).toHaveBeenCalledWith("/notification/object-create -> sub3/1.1.1, ");
    expect(consoleLogSpy).toHaveBeenCalledWith("/notification/object-delete -> ");
  });

  it('should handle all notification types with empty subscriber lists', async () => {
    configConstants.OAM_PATH_ATTRIBUTE_VALUE_CHANGES = '/empty-1';
    configConstants.OAM_PATH_ATTRIBUTE_OBJECT_CREATIONS = '/empty-2';
    configConstants.OAM_PATH_ATTRIBUTE_OBJECT_DELETIONS = '/empty-3';

    notificationManagement.getActiveSubscribers
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await SubscriberManagement.logActiveSubscribers();

    expect(consoleLogSpy).toHaveBeenCalledWith("Active subscribers: ");
    expect(consoleLogSpy).toHaveBeenCalledWith("/empty-1 -> ");
    expect(consoleLogSpy).toHaveBeenCalledWith("/empty-2 -> ");
    expect(consoleLogSpy).toHaveBeenCalledWith("/empty-3 -> ");
  });

  it('should log even if getActiveSubscribers throws an error', async () => {
    configConstants.OAM_PATH_ATTRIBUTE_VALUE_CHANGES = '/fail-1';
    configConstants.OAM_PATH_ATTRIBUTE_OBJECT_CREATIONS = '/fail-2';
    configConstants.OAM_PATH_ATTRIBUTE_OBJECT_DELETIONS = '/fail-3';

    notificationManagement.getActiveSubscribers
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce([{ name: 'backup', release: '3.0.0' }])
      .mockResolvedValueOnce([]);

    await expect(SubscriberManagement.logActiveSubscribers()).rejects.toThrow('Network error');
  });

  it('should not log anything if config constants are undefined', async () => {
    configConstants.OAM_PATH_ATTRIBUTE_VALUE_CHANGES = undefined;
    configConstants.OAM_PATH_ATTRIBUTE_OBJECT_CREATIONS = undefined;
    configConstants.OAM_PATH_ATTRIBUTE_OBJECT_DELETIONS = undefined;

    notificationManagement.getActiveSubscribers.mockResolvedValue([]);

    await SubscriberManagement.logActiveSubscribers();

    expect(consoleLogSpy).toHaveBeenCalledWith("Active subscribers: ");
    expect(consoleLogSpy).toHaveBeenCalledWith("undefined -> ");
    expect(consoleLogSpy).toHaveBeenCalledTimes(4); // header + 3 undefined logs
  });
  
});





describe('addSubscriberToConfig  new', () => {

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const requestUrl = '/v1/subscribe';
  const name = 'subscriber-app';
  const release = '1.0.0';
  const protocol = 'http';
  const address = '127.0.0.1';
  const port = 3000;
  const notificationOp = '/v1/notify';

  const httpClientUuid = 'uuid-http-client';
  const operationUuid = 'uuid-operation';
  const forwardingConstructInstance = { uuid: 'uuid-fc' };

 

  beforeEach(() => {
  jest.clearAllMocks();
  SubscriberManagement.logActiveSubscribers = jest.fn().mockResolvedValue();
  configConstants.getForwardingName.mockReturnValue('mock-forwarding-name');
  httpClientInterface.getHttpClientUuidExcludingOldReleaseAndNewRelease.mockResolvedValue(httpClientUuid);
  logicalTerminationPointServices.createOrUpdateApplicationLtpsAsync.mockResolvedValue({
    operationClientConfigurationStatusList: [{ uuid: operationUuid }]
  });
  forwardingDomain.getForwardingConstructForTheForwardingNameAsync.mockResolvedValue(forwardingConstructInstance);
});


  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should add a subscriber and create new fcPort if it does not exist', async () => {
    forwardingConstruct.isFcPortExists.mockReturnValue(false);
    fcPort.generateNextLocalId.mockReturnValue('next-local-id');
    forwardingConstruct.addFcPortAsync.mockResolvedValue();

    const result = await SubscriberManagement.addSubscriberToConfig(
      requestUrl, name, release, protocol, address, port, notificationOp
    );

    expect(result).toBe(true);
    expect(TcpObject).toHaveBeenCalledWith(protocol, address, port);
    expect(LogicalTerminationPointConfigurationInput).toHaveBeenCalledWith(
      httpClientUuid,
      name,
      release,
      expect.any(Array),
      notificationOp,
      expect.any(Map),
      individualServicesOperationsMapping.individualServicesOperationsMapping
    );

    // Check operationNamesByAttributes Map content
    const passedMap = LogicalTerminationPointConfigurationInput.mock.calls[0][5];
    expect(passedMap.has(notificationOp)).toBe(true);
    expect(passedMap.get(notificationOp)).toBe(notificationOp);

    expect(forwardingConstruct.addFcPortAsync).toHaveBeenCalledWith('uuid-fc', {
      'local-id': 'next-local-id',
      'port-direction': 'core-model-1-4:PORT_DIRECTION_TYPE_OUTPUT',
      'logical-termination-point': operationUuid
    });

    expect(SubscriberManagement.logActiveSubscribers).toHaveBeenCalled();
  });

it('should return false if operationClientConfigurationStatusList is empty', async () => {
  httpClientInterface.getHttpClientUuidExcludingOldReleaseAndNewRelease.mockResolvedValue(httpClientUuid);
  logicalTerminationPointServices.createOrUpdateApplicationLtpsAsync.mockResolvedValue({
    operationClientConfigurationStatusList: []
  });

  const result = await SubscriberManagement.addSubscriberToConfig(
    requestUrl, name, release, protocol, address, port, notificationOp
  );

  expect(result).toBe(false);
});

  it('should not create fcPort if it already exists', async () => {
    forwardingConstruct.isFcPortExists.mockReturnValue(true);

    const result = await SubscriberManagement.addSubscriberToConfig(
      requestUrl, name, release, protocol, address, port, notificationOp
    );

    expect(result).toBe(true);
    expect(forwardingConstruct.addFcPortAsync).not.toHaveBeenCalled();
    expect(SubscriberManagement.logActiveSubscribers).toHaveBeenCalled();
  });

  it('should return false if an exception is thrown during client lookup', async () => {
    //const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
   httpClientInterface.getHttpClientUuidExcludingOldReleaseAndNewRelease = jest.fn();
  httpClientInterface.getHttpClientUuidExcludingOldReleaseAndNewRelease.mockRejectedValueOnce(new Error('Mock error'));

    const result = await SubscriberManagement.addSubscriberToConfig(
      requestUrl, name, release, protocol, address, port, notificationOp
    );

    expect(result).toBe(false);
    expect(forwardingConstruct.addFcPortAsync).not.toHaveBeenCalled();
    expect(SubscriberManagement.logActiveSubscribers).not.toHaveBeenCalled();

   // logSpy.mockRestore();
  });

  it('should return false if operationClientConfigurationStatusList is empty', async () => {
    logicalTerminationPointServices.createOrUpdateApplicationLtpsAsync.mockResolvedValue({
      operationClientConfigurationStatusList: []
    });

    const result = await SubscriberManagement.addSubscriberToConfig(
      requestUrl, name, release, protocol, address, port, notificationOp
    );

    expect(result).toBe(false);
    expect(forwardingConstruct.addFcPortAsync).not.toHaveBeenCalled();
    expect(SubscriberManagement.logActiveSubscribers).not.toHaveBeenCalled();
  });
});
