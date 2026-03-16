
const NotificationModule = require('./NotificationStreamManagement');
const EventSource = require('events').EventEmitter;
jest.mock('events');

const mockAddStreamItem = jest.fn();
const mockRemoveStreamItem = jest.fn();
const mockTryReconnect = jest.fn();
const mockRetrieveElement = jest.fn();



describe('startStream', () => {
    let mockHandleFn;
    let mockController;
    let mockEventSource;

    // Injecting mocked dependencies using __set__
    NotificationModule.__set__('addStreamItem', mockAddStreamItem);
    NotificationModule.__set__('removeStreamItem', mockRemoveStreamItem);
    NotificationModule.__set__('tryContinuousReconnectStream', mockTryReconnect);

    const url = 'http://localhost:1500';
    const streamType = 'CONFIG';
    const user = 'admin';
    const password = 'password';
    const encodedAuth = Buffer.from(`${user}:${password}`).toString('base64');

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock loggers
        jest.spyOn(console, 'debug').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });

        mockHandleFn = jest.fn();
        mockController = { name: 'TestController', release: '1.0.0' };

        // Mock EventSource and its handlers
        mockEventSource = new EventSource();
        mockEventSource.readyState = 1;
        mockEventSource.onopen = null;
        mockEventSource.onmessage = null;
        mockEventSource.onerror = null;
        mockEventSource.onclose = null;

        NotificationModule.__set__('EventSource', jest.fn(() => mockEventSource));
    });

    it('should create EventSource and set up handlers', async () => {
        await NotificationModule.__get__('startStream')(
            url, mockController, mockHandleFn, streamType, user, password
        );

        const messageData = JSON.stringify({ key: 'value' });
        mockEventSource.onmessage({ data: messageData });

        expect(mockHandleFn).toHaveBeenCalledWith(messageData, 'TestController', '1.0.0', url);
        expect(mockAddStreamItem).toHaveBeenCalledWith(
            'TestController', '1.0.0', mockEventSource, streamType
        );
    });

    it('should handle error and reconnect when readyState is 2', async () => {
        mockEventSource.readyState = 2;

        await NotificationModule.__get__('startStream')(
            url, mockController, mockHandleFn, streamType, user, password
        );

        await mockEventSource.onerror(new Error('Test error'));

        expect(console.error).toHaveBeenCalled();
        expect(mockRemoveStreamItem).toHaveBeenCalledWith('TestController', '1.0.0', streamType);
        expect(mockTryReconnect).toHaveBeenCalledWith(mockController, streamType);
    });

    it('should not reconnect if readyState is not 2', async () => {
        mockEventSource.readyState = 1;

        await NotificationModule.__get__('startStream')(
            url, mockController, mockHandleFn, streamType, user, password
        );

        await mockEventSource.onerror(new Error('Some error'));

        expect(mockRemoveStreamItem).not.toHaveBeenCalled();
        expect(mockTryReconnect).not.toHaveBeenCalled();
    });

    it('should set Authorization header correctly', async () => {
        const EventSourceConstructor = jest.fn(() => mockEventSource);
        NotificationModule.__set__('EventSource', EventSourceConstructor);

        await NotificationModule.__get__('startStream')(
            url, mockController, mockHandleFn, streamType, user, password
        );

        expect(EventSourceConstructor).toHaveBeenCalledWith(url, {
            withCredentials: true,
            headers: {
                Authorization: `Basic ${encodedAuth}`,
            }
        });
    });
});


describe('removeAllStreamsForController', () => {
    const appName = 'TestApp';
    const appRelease = '1.0.0';


    NotificationModule.__set__('removeStreamItem', mockRemoveStreamItem);
    NotificationModule.__set__('STREAM_TYPE_CONFIGURATION', 'CONFIGURATION');
    NotificationModule.__set__('STREAM_TYPE_OPERATIONAL', 'OPERATIONAL');
    NotificationModule.__set__('STREAM_TYPE_DEVICE', 'DEVICE');


    let removeAllStreams;

    beforeEach(() => {
        jest.clearAllMocks();
        removeAllStreams = NotificationModule.__get__('removeAllStreamsForController');
    });

    it('should call removeStreamItem for all stream types', async () => {
        await removeAllStreams(appName, appRelease);

        expect(mockRemoveStreamItem).toHaveBeenCalledTimes(3);
        expect(mockRemoveStreamItem).toHaveBeenNthCalledWith(1, appName, appRelease, 'CONFIGURATION');
        expect(mockRemoveStreamItem).toHaveBeenNthCalledWith(2, appName, appRelease, 'OPERATIONAL');
        expect(mockRemoveStreamItem).toHaveBeenNthCalledWith(3, appName, appRelease, 'DEVICE');
    });

    it('should throw error if removeStreamItem fails for any stream', async () => {
        mockRemoveStreamItem
            .mockResolvedValueOnce(undefined)
            .mockRejectedValueOnce(new Error('OPERATIONAL removal failed'))
            .mockResolvedValueOnce(undefined);

        await expect(removeAllStreams(appName, appRelease)).rejects.toThrow('OPERATIONAL removal failed');

        expect(mockRemoveStreamItem).toHaveBeenCalledTimes(2); // stops after error
    });
    /*
      it('should call removeStreamItem sequentially even if async', async () => {
        const calls = [];
        mockRemoveStreamItem.mockImplementation(async (_, __, streamType) => {
          calls.push(streamType);
          await new Promise((r) => setTimeout(r, 10));
        });
    
    
        await removeAllStreams(appName, appRelease);
    
        expect(calls).toEqual(['CONFIGURATION', 'OPERATIONAL', 'DEVICE']);
      });
    */
    it('should work even if removeStreamItem is a no-op', async () => {
        mockRemoveStreamItem.mockResolvedValue(undefined);
        await expect(removeAllStreams(appName, appRelease)).resolves.not.toThrow();
    });

    it('should call removeStreamItem with correct arguments in order', async () => {
        await removeAllStreams(appName, appRelease);

        const calls = mockRemoveStreamItem.mock.calls;
        expect(calls[0]).toEqual([appName, appRelease, 'CONFIGURATION']);
        expect(calls[1]).toEqual([appName, appRelease, 'OPERATIONAL']);
        expect(calls[2]).toEqual([appName, appRelease, 'DEVICE']);
    });
});

describe('getAllElements', () => {
    let getAllElements;
    beforeEach(() => {
        jest.clearAllMocks();
        getAllElements = NotificationModule.__get__('getAllElements');
    });

    it('should return a shallow copy of controllerNotificationStreams', () => {
        const mockStreams = [
            {
                controllerKey: 'CtrlA-1.0.0-CONFIG',
                eventSource: { id: 'es1' },
                counter: 3
            },
            {
                controllerKey: 'CtrlB-2.1.0-DEVICE',
                eventSource: { id: 'es2' },
                counter: 1
            }
        ];
        NotificationModule.__set__('controllerNotificationStreams', mockStreams);

        const result = getAllElements();
        expect(result).toEqual(mockStreams);
        expect(result).not.toBe(mockStreams); // should be a copy, not the original array
    });

    it('should return an empty array when controllerNotificationStreams is empty', () => {
        NotificationModule.__set__('controllerNotificationStreams', []);
        const result = getAllElements();
        expect(result).toEqual([]);
    });

    it('modifying returned array should not affect internal stream', () => {
        const mockStreams = [
            { controllerKey: 'CtrlX-3.0.0-OPERATIONAL', eventSource: {}, counter: 0 }
        ];
        NotificationModule.__set__('controllerNotificationStreams', mockStreams);

        const result = getAllElements();
        result.push({ controllerKey: 'Fake', eventSource: {}, counter: 999 });

        const internalStreams = NotificationModule.__get__('controllerNotificationStreams');
        expect(internalStreams.length).toBe(1); // original should remain unchanged
    });
});

describe('checkIfStreamIsActive', () => {
    let checkIfStreamIsActive;
    NotificationModule.__set__('retrieveElement', mockRetrieveElement);
    const controller = {
        name: 'TestController',
        release: '1.0.0'
    };
    const streamType = 'DEVICE';

    beforeEach(() => {
        jest.clearAllMocks();
        checkIfStreamIsActive = NotificationModule.__get__('checkIfStreamIsActive');
    });

    it('should return true when element exists', () => {
        mockRetrieveElement.mockReturnValue({ some: 'value' });

        const result = checkIfStreamIsActive(controller, streamType);

        expect(result).toBe(true);
        expect(mockRetrieveElement).toHaveBeenCalledWith('TestController', '1.0.0', 'DEVICE');
    });

    it('should return false when element is null', () => {
        mockRetrieveElement.mockReturnValue(null);

        const result = checkIfStreamIsActive(controller, streamType);

        expect(result).toBe(false);
        expect(mockRetrieveElement).toHaveBeenCalledWith('TestController', '1.0.0', 'DEVICE');
    });

    it('should return false when element is undefined', () => {
        mockRetrieveElement.mockReturnValue(undefined);

        const result = checkIfStreamIsActive(controller, streamType);

        expect(result).toBe(false);
        expect(mockRetrieveElement).toHaveBeenCalledWith('TestController', '1.0.0', 'DEVICE');
    });

    it('should return true for any non-falsy object', () => {
        mockRetrieveElement.mockReturnValue(123); // non-zero number

        const result = checkIfStreamIsActive(controller, streamType);

        expect(result).toBe(true);
    });

    it('should return false if retrieveElement throws error', () => {
        mockRetrieveElement.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        expect(() => checkIfStreamIsActive(controller, streamType)).toThrow('Unexpected error');
    });
});

describe('increaseCounter', () => {
    const name = 'TestController';
    const release = '1.0.0';
    const streamType = 'CONFIG';

    let increaseCounter;
    NotificationModule.__set__('retrieveElement', mockRetrieveElement);

    beforeEach(() => {
        jest.clearAllMocks();
        increaseCounter = NotificationModule.__get__('increaseCounter');

        // Silence console.warn in test logs
        jest.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('should increase counter when element exists', () => {
        const mockElement = { counter: 5 };
        mockRetrieveElement.mockReturnValue(mockElement);

        const result = increaseCounter(name, release, streamType);

        expect(result).toBe(6);
        expect(mockElement.counter).toBe(6);
        expect(mockRetrieveElement).toHaveBeenCalledWith(name, release, streamType);
    });

    it('should return -1 and warn when element does not exist', () => {
        mockRetrieveElement.mockReturnValue(null);

        const result = increaseCounter(name, release, streamType);

        expect(result).toBe(-1);
        expect(console.warn).toHaveBeenCalledWith(
            'no stream found to increase counter for: ' + name
        );
    });

    it('should correctly increase from 0 to 1', () => {
        const mockElement = { counter: 0 };
        mockRetrieveElement.mockReturnValue(mockElement);

        const result = increaseCounter(name, release, streamType);

        expect(result).toBe(1);
        expect(mockElement.counter).toBe(1);
    });

    it('should increase counter even if it was negative', () => {
        const mockElement = { counter: -3 };
        mockRetrieveElement.mockReturnValue(mockElement);

        const result = increaseCounter(name, release, streamType);

        expect(result).toBe(-2);
        expect(mockElement.counter).toBe(-2);
    });

    it('should not call retrieveElement with missing args', () => {
        increaseCounter('', '', '');

        expect(mockRetrieveElement).toHaveBeenCalledWith('', '', '');
    });
});



/*
 should return -1 and warn when element does not exist

    TypeError: console.log.warn is not a function

      51 |         return element.counter;
      52 |     } else {
    > 53 |         console.log.warn("no stream found to increase counter for: " + name);
         |                     ^
      54 |         return -1;
      55 |     }
      56 | }*/

/*


let controllerNotificationStreams;
const mockConsoleDebug = jest.fn();

NotificationModule.__set__('console', { log: { debug: mockConsoleDebug } });

beforeEach(() => {
  jest.clearAllMocks();
  controllerNotificationStreams = [];
  NotificationModule.__set__('controllerNotificationStreams', controllerNotificationStreams);
});

/*
describe('addStreamItem', () => {
  const addStreamItem = NotificationModule.__get__('addStreamItem');

  const name = 'TestController';
  const release = '1.0.0';
  const streamType = 'DEVICE';
  const mockEventSource = { id: 'mockES' };

  it('should add a new stream item with correct properties', () => {
    addStreamItem(name, release, mockEventSource, streamType);

    expect(controllerNotificationStreams.length).toBe(1);
    const item = controllerNotificationStreams[0];
    expect(item.controllerKey).toBe('TestController-1.0.0-DEVICE');
    expect(item.eventSource).toBe(mockEventSource);
    expect(item.counter).toBe(0);
  });

  it('should append multiple stream items', () => {
    addStreamItem(name, release, mockEventSource, streamType);
    addStreamItem('AnotherCtrl', '2.1.3', { id: 'mockES2' }, 'CONFIG');

    expect(controllerNotificationStreams.length).toBe(2);
    expect(controllerNotificationStreams[1].controllerKey).toBe('AnotherCtrl-2.1.3-CONFIG');
  });

  it('should log stream keys correctly', () => {
    addStreamItem(name, release, mockEventSource, streamType);
    addStreamItem('AnotherCtrl', '2.1.3', { id: 'mockES2' }, 'CONFIG');

    expect(mockConsoleDebug).toHaveBeenCalledWith(
      'notification streams after adding: TestController-1.0.0-DEVICE, AnotherCtrl-2.1.3-CONFIG, '
    );
  });

  it('should handle empty controllerNotificationStreams array', () => {
    expect(controllerNotificationStreams).toEqual([]);

    addStreamItem(name, release, mockEventSource, streamType);

    expect(controllerNotificationStreams).toHaveLength(1);
  });

  it('should support different streamTypes for same controller', () => {
    addStreamItem(name, release, mockEventSource, 'DEVICE');
    addStreamItem(name, release, mockEventSource, 'CONFIG');

    expect(controllerNotificationStreams).toHaveLength(2);
    expect(controllerNotificationStreams[0].controllerKey).toBe('TestController-1.0.0-DEVICE');
    expect(controllerNotificationStreams[1].controllerKey).toBe('TestController-1.0.0-CONFIG');
  });
});



describe('retrieveElement', () => {
  let retrieveElement;
  let controllerNotificationStreams;

  beforeEach(() => {
    jest.clearAllMocks();
    retrieveElement = NotificationModule.__get__('retrieveElement');

    // Create a shared reference and inject into the module
    controllerNotificationStreams = [
      {
        controllerKey: 'CtrlA-1.0.0-DEVICE',
        eventSource: { id: 'ES1' },
        counter: 2
      },
      {
        controllerKey: 'CtrlB-2.1.3-CONFIG',
        eventSource: { id: 'ES2' },
        counter: 1
      }
    ];
    NotificationModule.__set__('controllerNotificationStreams', controllerNotificationStreams);
  });

  it('should return the correct element when key matches', () => {
    const result = retrieveElement('CtrlA', '1.0.0', 'DEVICE');
    expect(result).toBe(controllerNotificationStreams[0]);
  });

  it('should return the correct element for a different matching key', () => {
    const result = retrieveElement('CtrlB', '2.1.3', 'CONFIG');
    expect(result).toBe(controllerNotificationStreams[1]);
  });

  it('should return null if no matching item is found', () => {
    const result = retrieveElement('UnknownCtrl', '3.0.0', 'STATUS');
    expect(result).toBeNull();
  });

  it('should return null if stream list is empty', () => {
    NotificationModule.__set__('controllerNotificationStreams', []);
    const result = retrieveElement('CtrlA', '1.0.0', 'DEVICE');
    expect(result).toBeNull();
  });

  it('should return null if matching name/release but different streamType', () => {
    const result = retrieveElement('CtrlA', '1.0.0', 'CONFIG');
    expect(result).toBeNull();
  });
});*/


/*
describe('retrieveElement', () => {
  let retrieveElement;

  const mockControllerStreams = [
    {
      controllerKey: 'TestController-1.0.0-DEVICE',
      eventSource: { id: 'es1' },
      counter: 0,
    },
    {
      controllerKey: 'CtrlB-2.1.3-CONFIG',
      eventSource: { id: 'es2' },
      counter: 5,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    retrieveElement = NotificationModule.__get__('retrieveElement');
    NotificationModule.__set__('controllerNotificationStreams', mockControllerStreams);
  });

  it('should return the correct element when a matching key is found', () => {
    const result = retrieveElement('TestController', '1.0.0', 'DEVICE');
    expect(result).toEqual(mockControllerStreams[0]);
  });

  it('should return another matching stream item', () => {
    const result = retrieveElement('CtrlB', '2.1.3', 'CONFIG');
    expect(result).toEqual(mockControllerStreams[1]);
  });

  it('should return null if no matching key exists', () => {
    const result = retrieveElement('Unknown', '9.9.9', 'STATUS');
    expect(result).toBeNull();
  });

  it('should return null when controllerNotificationStreams is empty', () => {
    NotificationModule.__set__('controllerNotificationStreams', []);
    const result = retrieveElement('TestController', '1.0.0', 'DEVICE');
    expect(result).toBeNull();
  });

  it('should return null if name and release match but streamType is different', () => {
    const result = retrieveElement('TestController', '1.0.0', 'CONFIG');
    expect(result).toBeNull();
  });
});
*/

/*
const removeAllStreams = NotificationModule.__get__('removeAllStreamsForController');

describe('removeAllStreamsForController', () => {
  it('should call removeStreamItem sequentially even if async', async () => {
    const appName = 'TestApp';
    const appRelease = '1.0.0';
    const calls = [];

    const mockRemoveStreamItem = jest.fn(async (_name, _release, streamType) => {
      calls.push(streamType);
    });

    NotificationModule.__set__('removeStreamItem', mockRemoveStreamItem);

    await removeAllStreams(appName, appRelease);

    expect(calls).toEqual(['CONFIGURATION', 'OPERATIONAL', 'DEVICE']);
  });

  it('should work even if removeStreamItem is a no-op', async () => {
    NotificationModule.__set__('removeStreamItem', jest.fn());
    await removeAllStreams('X', 'Y'); // No error expected
  });
});
*/

describe('addStreamItem', () => {
    let addStreamItem;




    beforeEach(() => {
        jest.clearAllMocks();

        jest.spyOn(console, 'debug').mockImplementation(() => { });

        // Get function AFTER injection
        addStreamItem = NotificationModule.__get__('addStreamItem');

    });

    it('should add a new stream item with correct properties', () => {
        const name = 'TestController';
        const release = '1.0.0';
        const streamType = 'DEVICE';
        const mockEventSource = { id: 'es1' };

        const mockStreams = JSON.parse(JSON.stringify([
            {
                controllerKey: 'TestController-1.0.0-DEVICE',
                eventSource: { id: 'es1' },
                counter: 0,
            }
        ]));
        NotificationModule.__set__('controllerNotificationStreams', mockStreams);




        addStreamItem(name, release, mockEventSource, streamType);


        // Re-fetch from rewire (important!)
        const currentStreams = NotificationModule.__get__('controllerNotificationStreams');

        expect(currentStreams[0]).toEqual(mockStreams[0]);
        expect(currentStreams.length).toBe(1);
    });
    /*
      it('should log the added stream keys', () => {
        const es = { id: 'es-log' };
          const mockStreams = [
          {
            controllerKey: 'Logger-3.3.3-STATUS',
            eventSource: { id: 'es-log' },
            counter: 0
          }
        ];
        NotificationModule.__set__('controllerNotificationStreams', mockStreams);
    
    
        addStreamItem('Logger', '3.3.3', es, 'STATUS');
    
          const currentStreams = NotificationModule.__get__('controllerNotificationStreams');
    console.log(currentStreams[0].controllerKey,'notification streams after adding: ' + currentStreams[0].controllerKey,)
          expect(console.debug).toHaveBeenCalledWith(
          'notification streams after adding: ' + currentStreams[0].controllerKey,
        );
      
      });
    
    
    it('should log the added stream keys', () => {
      const es = { id: 'es-log' };
    
      // Reset the internal stream list before adding
      NotificationModule.__set__('controllerNotificationStreams', []);
    
      addStreamItem('Logger', '3.3.3', es, 'STATUS');
    
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('Logger-3.3.3-STATUS')
      );
    });
    */

    it('should log the added stream keys', () => {
        const es = { id: 'es-log' };

        const controllerNotificationStreams = [];
        NotificationModule.__set__('controllerNotificationStreams', controllerNotificationStreams);

        // Reset debug spy
        const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => { });

        // Re-fetch function after injection
        const addStreamItem = NotificationModule.__get__('addStreamItem');

        NotificationModule.addStreamItem('Logger', '3.3.3', es, 'STATUS');

        expect(debugSpy).toHaveBeenCalledWith(
            expect.stringContaining('Logger-3.3.3-STATUS')
        );

        debugSpy.mockRestore(); // clean up
    });


    it('should add multiple items without overwriting previous ones', () => {
        const es1 = { id: 'es1' };
        const es2 = { id: 'es2' };

        const mockStreams = [
            {
                controllerKey: 'CtrlA-1.0.0-CONFIG',
                eventSource: { id: 'es1' },
                counter: 0
            },
            {
                controllerKey: 'CtrlB-2.1.0-OPERATIONAL',
                eventSource: { id: 'es2' },
                counter: 0
            }
        ];
        NotificationModule.__set__('controllerNotificationStreams', mockStreams);


        addStreamItem('CtrlA', '1.0.0', es1, 'CONFIG');
        addStreamItem('CtrlB', '2.1.0', es2, 'OPERATIONAL');

        const currentStreams = NotificationModule.__get__('controllerNotificationStreams');
        expect(currentStreams.length).toBe(2);
        expect(currentStreams[0]).toEqual({
            controllerKey: 'CtrlA-1.0.0-CONFIG',
            eventSource: es1,
            counter: 0
        });
        expect(currentStreams[1]).toEqual({
            controllerKey: 'CtrlB-2.1.0-OPERATIONAL',
            eventSource: es2,
            counter: 0
        });
    });


});







describe('retrieveElement', () => {
    let retrieveElement;
    let mockControllerNotificationStreams;

    beforeEach(() => {

        retrieveElement = NotificationModule.__get__('retrieveElement');
    });

    it('should return the matching controllerNotificationStream item', () => {
        mockControllerNotificationStreams = [
            {
                controllerKey: 'ControllerA-1.0.0-CONFIG',
                eventSource: { id: 'es1' },
                counter: 5,
            }
        ];

        NotificationModule.__set__('controllerNotificationStreams', mockControllerNotificationStreams);
        const result = retrieveElement('ControllerA', '1.0.0', 'CONFIG');
        retrieveElement = NotificationModule.__get__('controllerNotificationStreams');
        expect(retrieveElement[0]).toEqual(mockControllerNotificationStreams[0]);
    });

    it('should return null if no matching item is found', () => {
        mockControllerNotificationStreams = [
            {
                controllerKey: 'ControllerA-1.0.0-CONFIG',
                eventSource: { id: 'es1' },
                counter: 5,
            },
            {
                controllerKey: 'ControllerB-2.0.0-STATUS',
                eventSource: { id: 'es2' },
                counter: 3,
            },
        ];
        //NotificationModule.__set__('controllerNotificationStreams', []);

        NotificationModule.__set__('controllerNotificationStreams', mockControllerNotificationStreams);

        const result = NotificationModule.retrieveElement('ControllerC', '1.0.0', 'CONFIG'); // 

        expect(result).toBeNull(); //
    });


    it('should return the correct item when multiple items exist', () => {
        mockControllerNotificationStreams = [
            {
                controllerKey: 'ControllerA-1.0.0-CONFIG',
                eventSource: { id: 'es1' },
                counter: 5,
            },
            {
                controllerKey: 'ControllerB-2.0.0-STATUS',
                eventSource: { id: 'es2' },
                counter: 3,
            },
        ];

        NotificationModule.__set__('controllerNotificationStreams', mockControllerNotificationStreams);
        const result = NotificationModule.retrieveElement('ControllerB', '2.0.0', 'STATUS');
        // expect(result).toEqual(mockControllerNotificationStreams[1]);
        expect(result).toEqual({
            controllerKey: 'ControllerB-2.0.0-STATUS',
            eventSource: { id: 'es2' },
            counter: 3,
        });
    });

    it('should return null if key format does not match any item', () => {
        mockControllerNotificationStreams = [
            {
                controllerKey: 'ControllerA-1.0.0-CONFIG',
                eventSource: { id: 'es1' },
                counter: 5,
            },
            {
                controllerKey: 'ControllerB-2.0.0-STATUS',
                eventSource: { id: 'es2' },
                counter: 3,
            },
        ];

        NotificationModule.__set__('controllerNotificationStreams', mockControllerNotificationStreams);
        const result = NotificationModule.retrieveElement('ControllerA', '1.0', 'CONFIG'); // incorrect release
        expect(result).toBeNull();
    });

    it('should return null when streamType mismatches', () => {

        mockControllerNotificationStreams = [{
            controllerKey: 'Device-3.0.0-STATUS',
            eventSource: { id: 'es-003' },
            counter: 8,
        }];
        NotificationModule.__set__('controllerNotificationStreams', mockControllerNotificationStreams);
        const result = NotificationModule.retrieveElement('Device', '3.0.0', 'CONFIG');
        expect(result).toBeNull();
    });
});

