const  NotificationConverter = require('./NotificationConverter'); // Replace with actual module path

const configConstants = require("./ConfigConstants");


describe('convertNotification', () => {
  const dummyControllerNotification = { some: 'data' };
  const dummyControllerName = 'controller-1';
  const dummyControllerRelease = 'v1.0';
  const dummyEventTime = '2025-06-10T12:00:00Z';

  let convertDeviceNotificationMock;
  let convertControllerNotificationEventMock;

  beforeEach(() => {
    convertDeviceNotificationMock = jest.fn();
    convertControllerNotificationEventMock = jest.fn();

    NotificationConverter.__set__('convertDeviceNotification', convertDeviceNotificationMock);
    NotificationConverter.__set__('convertControllerNotificationEvent', convertControllerNotificationEventMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const deviceNotificationTypes = [
    configConstants.OAM_PATH_DEVICE_ATTR_VALUE_CHANGES,
    configConstants.OAM_PATH_DEVICE_OBJECT_DELETIONS,
    configConstants.OAM_PATH_DEVICE_OBJECT_CREATIONS,
    configConstants.OAM_PATH_DEVICE_ALARMS
  ];

  it.each(deviceNotificationTypes)(
    'should call convertDeviceNotification when notificationType is %s',
    (notificationType) => {
      convertDeviceNotificationMock.mockReturnValue({ type: 'device' });

      const result = NotificationConverter.convertNotification(
        dummyControllerNotification,
        notificationType,
        dummyControllerName,
        dummyControllerRelease,
        dummyEventTime
      );

      expect(convertDeviceNotificationMock).toHaveBeenCalledWith(
        dummyControllerNotification,
        dummyControllerName,
        dummyControllerRelease,
        notificationType
      );
      expect(result).toEqual({ type: 'device' });
      expect(convertControllerNotificationEventMock).not.toHaveBeenCalled();
    }
  );

  it('should call convertControllerNotificationEvent for other notification types', () => {
    const otherType = 'some-other-type';
    convertControllerNotificationEventMock.mockReturnValue({ type: 'controller' });

    const result = NotificationConverter.convertNotification(
      dummyControllerNotification,
      otherType,
      dummyControllerName,
      dummyControllerRelease,
      dummyEventTime
    );

    expect(convertControllerNotificationEventMock).toHaveBeenCalledWith(
      dummyControllerNotification,
      dummyControllerName,
      dummyControllerRelease,
      dummyEventTime,
      otherType
    );
    expect(result).toEqual({ type: 'controller' });
    expect(convertDeviceNotificationMock).not.toHaveBeenCalled();
  });
});


describe('convertControllerNotification', () => {
  let convertControllerNotification;

  const controllerName = 'TestController';
  const controllerRelease = '1.0.0';
  const eventTime = '2025-06-10T12:00:00Z';

  const mockEventBase = {
    path: '/example/path',
    value: { some: 'data' }
  };

  beforeEach(() => {
    convertControllerNotification = NotificationConverter.__get__('convertControllerNotification');

    NotificationConverter.__set__('configConstants', {
      OAM_PATH_ATTRIBUTE_OBJECT_CREATIONS: '/v1/notify-object-creations',
      OAM_PATH_ATTRIBUTE_VALUE_CHANGES: '/v1/notify-attribute-value-changes',
      OAM_PATH_ATTRIBUTE_OBJECT_DELETIONS: '/v1/notify-object-deletions'
    });

    NotificationConverter.__set__('convertNotification', jest.fn().mockReturnValue({
      someKey: 'someValue'
    }));
  });

  test('should convert "created" notification', () => {
    const notification = {
      "urn-ietf-params-xml-ns-netconf-notification-1.0:notification": {
        "event-time": eventTime,
        "urn-opendaylight-params-xml-ns-yang-controller-md-sal-remote:data-changed-notification": {
          "data-change-event": [
            { ...mockEventBase, operation: 'created' }
          ]
        }
      }
    };

    const result = NotificationConverter.convertControllerNotification(notification, controllerName, controllerRelease);

    expect(result).toEqual([
      {
        subscriberNotificationType: '/v1/notify-object-creations',
        notificationMessage: { someKey: 'someValue' }
      }
    ]);
  });

  test('should convert "updated" notification', () => {
    const notification = {
      "urn-ietf-params-xml-ns-netconf-notification-1.0:notification": {
        "event-time": eventTime,
        "urn-opendaylight-params-xml-ns-yang-controller-md-sal-remote:data-changed-notification": {
          "data-change-event": [
            { ...mockEventBase, operation: 'updated' }
          ]
        }
      }
    };

    const result = NotificationConverter.convertControllerNotification(notification, controllerName, controllerRelease);

    expect(result).toEqual([
      {
        subscriberNotificationType: '/v1/notify-attribute-value-changes',
        notificationMessage: { someKey: 'someValue' }
      }
    ]);
  });

  test('should convert "deleted" notification', () => {
    const notification = {
      "urn-ietf-params-xml-ns-netconf-notification-1.0:notification": {
        "event-time": eventTime,
        "urn-opendaylight-params-xml-ns-yang-controller-md-sal-remote:data-changed-notification": {
          "data-change-event": [
            { ...mockEventBase, operation: 'deleted' }
          ]
        }
      }
    };

    const result = NotificationConverter.convertControllerNotification(notification, controllerName, controllerRelease);

    expect(result).toEqual([
      {
        subscriberNotificationType: '/v1/notify-object-deletions',
        notificationMessage: { someKey: 'someValue' }
      }
    ]);
  });

  test('should ignore unknown operation', () => {
    const notification = {
      "urn-ietf-params-xml-ns-netconf-notification-1.0:notification": {
        "event-time": eventTime,
        "urn-opendaylight-params-xml-ns-yang-controller-md-sal-remote:data-changed-notification": {
          "data-change-event": [
            { ...mockEventBase, operation: 'something-unknown' }
          ]
        }
      }
    };

    const result = NotificationConverter.convertControllerNotification(notification, controllerName, controllerRelease);

    expect(result).toEqual([]);
  });

  test('should return empty array if no notification present', () => {
    const result = NotificationConverter.convertControllerNotification({}, controllerName, controllerRelease);
    expect(result).toEqual([]);
  });

  test('should return only valid notifications if one is unknown', () => {
    const notification = {
      "urn-ietf-params-xml-ns-netconf-notification-1.0:notification": {
        "event-time": eventTime,
        "urn-opendaylight-params-xml-ns-yang-controller-md-sal-remote:data-changed-notification": {
          "data-change-event": [
            { ...mockEventBase, operation: 'created' },
            { ...mockEventBase, operation: 'unknown-op' }
          ]
        }
      }
    };

    const result = NotificationConverter.convertControllerNotification(notification, controllerName, controllerRelease);

    expect(result).toEqual([
      {
        subscriberNotificationType: '/v1/notify-object-creations',
        notificationMessage: { someKey: 'someValue' }
      }
    ]);
  });

  test('should skip null/undefined notification message', () => {
    const mockConvert = jest.fn()
      .mockReturnValueOnce(null);

    NotificationConverter.__set__('convertNotification', mockConvert);

    const notification = {
      "urn-ietf-params-xml-ns-netconf-notification-1.0:notification": {
        "event-time": eventTime,
        "urn-opendaylight-params-xml-ns-yang-controller-md-sal-remote:data-changed-notification": {
          "data-change-event": [
            { ...mockEventBase, operation: 'created' }
          ]
        }
      }
    };

    const result = convertControllerNotification(notification, controllerName, controllerRelease);

    expect(result).toEqual([]);
  });
});


