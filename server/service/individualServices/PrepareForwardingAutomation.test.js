
const ForwardingConstructAutomationInput = require('onf-core-model-ap/applicationPattern/onfModel/services/models/forwardingConstruct/AutomationInput');
const TcpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpServerInterface');
const onfFormatter = require('onf-core-model-ap/applicationPattern/onfModel/utility/OnfAttributeFormatter');
const HttpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpServerInterface');
const prepareALTForwardingAutomation = require('onf-core-model-ap-bs/basicServices/services/PrepareALTForwardingAutomation');
  const PrepareForwardingAutomation = require('./PrepareForwardingAutomation')

jest.mock('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpServerInterface', () => ({
  getApplicationNameAsync: jest.fn(),
  getReleaseNumberAsync: jest.fn()
}));

jest.mock('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpServerInterface', () => ({
  getLocalAddressForForwarding: jest.fn(),
  getLocalPort: jest.fn(),
  getLocalProtocol: jest.fn()
}));

jest.mock('onf-core-model-ap/applicationPattern/onfModel/utility/OnfAttributeFormatter', () => ({
  modifyJsonObjectKeysToKebabCase: jest.fn()
}));

jest.mock('onf-core-model-ap/applicationPattern/onfModel/services/models/forwardingConstruct/AutomationInput'); // class constructor

jest.mock('onf-core-model-ap-bs/basicServices/services/PrepareALTForwardingAutomation', () => ({
  getALTForwardingAutomationInputForOamRequestAsync: jest.fn()
}));

describe('regardApplication - All Scenarios', () => {
  const applicationName = 'MyApp';
  const releaseNumber = '1.0.0';
  const inputList = [{ dummy: true }];

  beforeEach(() => {
    jest.clearAllMocks();

    HttpServerInterface.getApplicationNameAsync.mockResolvedValue('AppResolved');
    HttpServerInterface.getReleaseNumberAsync.mockResolvedValue('1.2.3');
    TcpServerInterface.getLocalAddressForForwarding.mockResolvedValue('127.0.0.1');
    TcpServerInterface.getLocalPort.mockResolvedValue(3000);
    TcpServerInterface.getLocalProtocol.mockResolvedValue('http');
    onfFormatter.modifyJsonObjectKeysToKebabCase.mockImplementation(obj => ({
      ...obj,
      kebabed: true
    }));
    ForwardingConstructAutomationInput.mockImplementation((name, body, context) => ({
      name, body, context
    }));
  });

  test('should return merged forwarding automation list', async () => {
    const result = await PrepareForwardingAutomation.regardApplication(inputList, applicationName, releaseNumber);

    expect(HttpServerInterface.getApplicationNameAsync).toHaveBeenCalled();
    expect(HttpServerInterface.getReleaseNumberAsync).toHaveBeenCalled();
    expect(TcpServerInterface.getLocalAddressForForwarding).toHaveBeenCalled();
    expect(TcpServerInterface.getLocalPort).toHaveBeenCalled();
    expect(TcpServerInterface.getLocalProtocol).toHaveBeenCalled();
    expect(onfFormatter.modifyJsonObjectKeysToKebabCase).toHaveBeenCalled();

    expect(ForwardingConstructAutomationInput).toHaveBeenCalledWith(
      'ApprovedApplicationCausesRequestForServiceRequestInformation',
      expect.objectContaining({
        serviceLogApplication: 'AppResolved',
        serviceLogApplicationReleaseNumber: '1.2.3',
        serviceLogOperation: '/v1/record-service-request',
        serviceLogAddress: '127.0.0.1',
        serviceLogPort: 3000,
        serviceLogProtocol: 'http',
        kebabed: true
      }),
      'MyApp1.0.0'
    );

    expect(result).toEqual([
      expect.objectContaining({ name: 'ApprovedApplicationCausesRequestForServiceRequestInformation' }),
      ...inputList
    ]);
  });

  test('throws if getApplicationNameAsync fails', async () => {
    HttpServerInterface.getApplicationNameAsync.mockRejectedValue(new Error('App error'));
    await expect(PrepareForwardingAutomation.regardApplication(inputList, applicationName, releaseNumber)).rejects.toThrow('App error');
  });

  test('throws if getReleaseNumberAsync fails', async () => {
    HttpServerInterface.getReleaseNumberAsync.mockRejectedValue(new Error('Release error'));
    await expect(PrepareForwardingAutomation.regardApplication(inputList, applicationName, releaseNumber)).rejects.toThrow('Release error');
  });

  test('throws if getLocalAddressForForwarding fails', async () => {
    TcpServerInterface.getLocalAddressForForwarding.mockRejectedValue(new Error('Address error'));
    await expect(PrepareForwardingAutomation.regardApplication(inputList, applicationName, releaseNumber)).rejects.toThrow('Address error');
  });

  test('throws if getLocalPort fails', async () => {
    TcpServerInterface.getLocalPort.mockRejectedValue(new Error('Port error'));
    await expect(PrepareForwardingAutomation.regardApplication(inputList, applicationName, releaseNumber)).rejects.toThrow('Port error');
  });

  test('throws if getLocalProtocol fails', async () => {
    TcpServerInterface.getLocalProtocol.mockRejectedValue(new Error('Protocol error'));
    await expect(PrepareForwardingAutomation.regardApplication(inputList, applicationName, releaseNumber)).rejects.toThrow('Protocol error');
  });

  test('throws if formatter fails', async () => {
    onfFormatter.modifyJsonObjectKeysToKebabCase.mockImplementation(() => {
      throw new Error('Formatter error');
    });
    await expect(PrepareForwardingAutomation.regardApplication(inputList, applicationName, releaseNumber)).rejects.toThrow('Formatter error');
  });

  test('throws if constructor fails', async () => {
    ForwardingConstructAutomationInput.mockImplementation(() => {
      throw new Error('Constructor error');
    });
    await expect(PrepareForwardingAutomation.regardApplication(inputList, applicationName, releaseNumber)).rejects.toThrow('Constructor error');
  });
});


describe('OAMLayerRequest - All Scenarios', () => {
  const mockUuid = '1234-5678-uuid';

  
  afterEach(() => {
    jest.clearAllMocks();
   

  });

  test('✅ should resolve with forwarding input list when data is returned', async () => {
    const mockResult = [{ input: 'mocked-input' }];
    prepareALTForwardingAutomation.getALTForwardingAutomationInputForOamRequestAsync
      .mockResolvedValue(mockResult);

    const result = await PrepareForwardingAutomation.OAMLayerRequest(mockUuid);

    expect(prepareALTForwardingAutomation.getALTForwardingAutomationInputForOamRequestAsync)
      .toHaveBeenCalledWith(mockUuid);
    expect(result).toEqual(mockResult);
  });

 
  test('✅ should reject when an error is thrown by the async call', async () => {
    const mockError = new Error('Service call failed');
    prepareALTForwardingAutomation.getALTForwardingAutomationInputForOamRequestAsync
      .mockRejectedValue(mockError);

    await expect(PrepareForwardingAutomation.OAMLayerRequest(mockUuid)).rejects.toThrow('Service call failed');
  });

  test('✅ should reject if called with invalid UUID (e.g., null)', async () => {
    const mockError = new Error('Invalid UUID');
    prepareALTForwardingAutomation.getALTForwardingAutomationInputForOamRequestAsync
      .mockImplementation((uuid) => {
        if (!uuid) throw mockError;
      });

    await expect(PrepareForwardingAutomation.OAMLayerRequest(null)).rejects.toThrow('Invalid UUID');
  });

});
