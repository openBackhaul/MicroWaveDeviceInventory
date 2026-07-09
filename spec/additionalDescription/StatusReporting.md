# Status Reporting

MWDI shall collect status data about regularly carried out updates on its cache to support its operation.  
The data will be gathered as described below made available by a dedicated service.  

## Status metrics

The metrics count how often ControlConstruct updates were successful or failed
- for specific events
- across all devices
- aggregated per hour for a configurable number of hours

The events and related metrics are
1. periodic CC update by either slidingWindow or qualityMeasurement
   - periodicCcUpdateSuccesses
   - periodicCcUpdateFails
2. CC update based on device notifications
   - notificationCcUpdateSuccesses
   - notificationCcUpdateFails
3. changed connection status of devices (from connected to another state or vice versa)
   - connectionStateCcUpdateSuccesses
   - connectionStateCcUpdateFails

**Metric arrays**  
- Each metric has an array with a configurable number of elements (*n*), where each element represents one hour of the recent *n* hours.
- Access key for these elements is the combination of date and hour, e.g. for `2010-11-20T14:00:00+01:00` the key would be `2010-11-20T14`.
- When a new hour begins, a rollover occurs: the oldest element is removed and a new element for the current hour is added.
- Each element is initialized with 0 and is increased upon the associated event.
- The metrics are gathered across all devices.

**Metrics and update events**  

The table outlines when the different metrics are to be updated.  

![statusMetrics](./pictures/statusMetrics.png)
