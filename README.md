# MicroWaveDeviceInventory  

### Location  
The MicroWaveDeviceInventory is part of the HighPerformanceNetworkInterface.  

### Description  
The MicroWaveDeviceInventory supports GETting device information and documenting connection information.  
The GET requests to the MicroWaveDeviceInventory can either be addressed to the  
 - /cache/ paths (quick response time) or the  
 - /live/ paths  (real-time network data).  

The purpose of the /cache/ paths of the MWDI is to shorten the response time and to minimize the number and size of accesses to the devices.  
The /live/ paths of the MWDI serve as a gateway that restricts GET requests to the devices to approved applications and pre-defined classes.  

The API of the MWDI is made in such a way that consuming applications could easily switch between /cache/ or /live/ paths.  

The cache of the MicroWaveDeviceInventory covers Capability, Configuration, Status, Historical Performance and Alarm information.  
Also internal (ForewardingDamain and ForewardingConstruct) and external (Link) connection information can be read from the cache.

Current counter readings (e.g. current dropped frames count) are provided via the /live/ paths of the MWDI only.  

No matter which path chosen, the information provided by the MicroWaveDeviceInventory is limited to devices that are currently connected to the controller.  

The MicroWaveDeviceInventory is updating its cache by retrieving the entire data tree from the devices at a configurable periode and continuously updating individual attributes based on value change notifications and requests to the /live/ paths in between.  

The MWDI supports directly addressing entire classes only.  
Individual attributes or combinations of attributes are indirectly addressed by using the fields filter.  
The RESTCONF interface of the controller could process the same requests, too.  

The MWDI offers subscribing for ONF-TR-532-like notifications (webhook based method) that relate to the content of its cache.  

### Latest Update  

**v2.0.0**  
**Summary of changes:**  
- Optimized sliding window  
- Cache quality measurement added  
- Kafka integration added  
- Switch for re-use as HistoricalMicrowaveDeviceInventory added  

**Details on the changes:**  
This release introduced some major changes to the underlying processes for updating the cache.  

First of all, the deviceList and metadataTable have been merged into **deviceMetadataList**:
- before the MWDI was going over the deviceList with a slidingWindow to find the next device update candidate device. Devices were removed from the deviceList when the were no longer in connected state and their ControlConstructs in the cache as well. In addition there was the metadataTable, which also included information about devices, which had been added to the MWDI before, but no longer were in connected state
- now this has been changed:
  - the deviceMetadataList is now sorted according to retrieval priority (based on timestamp of last complete ControlConstruct update attempt) and slidingWindow takes the next update device according to the sorting (or possibly it could use a (reduced) sorted in-memory copy of the list instead): highest priority have those devices without a ControlConstruct copy in the cache, followed by the device with the oldest ControlConstruct (or oldest update attempt) in the cache
  - when a device currently in MWDI is deleted from Controller: it is deleted from deviceMetadataList along with its ControlConstruct in the cache
  - handling of devices changing into disconnected state depends on the *historicalControlConstructPolicy* (allowing for historical-MWDI functionality):
    - default configuration is delete: i.e. the devices are deleted from the deviceMetadataList and also their ControlConstructs in the cache
    - if the policy is configured to keep-on-disconnect: devices are kept in the deviceMetadataList, as well as their ControlConstructs in the cache until they (a) expire according to the configured retention period or (b) the policy is changed back to the default
- the metadata has been enriched with deviceType, which is mapped from airInterface information (via new regex profile), and vendor, which in turn is mapped from the deviceType; per default both are set to *unknown* (periodical retries to update it to a proper value)
- adds new service */v1/provide-list-of-cached-mwdi-devices*, which returns all devices for which MWDI has a ControlConstruct in its cache (if historical data is to be kept, this can also include ControlConstructs of disconnected devices)
- service */v1/provide-list-of-connected-devices* has been deprecated; if other applications want to retrieve the list of connected devices, they instead need to query the Controller directly

Next is the introduction of a **cache quality measurement process**:
- it selectes a new candidate device from the deviceMetadataList every x minutes (configurable, initially set to 1 minute)
  - works in tandem with the slidingWindow process and selects the next device with oldest ControlConstruct in the cache, not yet found in the slidingWindow
  - retrieves the ControlConstruct from live (thereby updating the cache) and the copy from the cache
  - compares both and scores the changes
  - writes the results into ElasticSearch for evaluation and analysis purposes
  - if either/or retrieval of live or cache ControlConstruct fails, there is no comparison for the given device, i.e. no statistics record written to the cache
- new service */v1/provide-cache-quality-statistics* returns aggregated statistics on demand (data is aggregated from the stored *qualityMeasurementSampleNumber* samples, either aggregated over all the samples at once, or aggregated per deviceType)

Also **notification handling** has been changed:
- before, MWDI had subscriptions for receiving notifications from NotificationProxy (NP).
  - In case of a new notification, NP was pushing the notification to MWDI.
  - Due to performance problems this had been disabled in production
- now, Kafka has been added in between NP and MWDI to overcome the performance problems
  - NP will push the notifications to Kafka ("proper" notification topic)
  - MWDI will pull the notifications from Kafka ("proper" notification topic)
  - the *regard*-services previously called by NP to push the notifications to MWDI have been deprecated (but are kept in order to be able to switch back)
    - as their functionality shall be used internally, their callbacks have been modified slightly (input descriptions now consider whether the callbacks are called from the *regard*-service or via the internal process)
  - however, to process the notifications the functionality from the *regard*-services shall be executed internally (i.e. without opening new http sessions).
    - for each proper notification type, there is a new callback under /v1/embed-yourself, which calls the related *regard*-service via javascript interface 

The list of related issues can be found in issue collection [MWDI v2.0.0_spec](https://github.com/openBackhaul/MicroWaveDeviceInventory/milestone/20).  

Any issues found during implementer review will be found in [MWDI v2.0.1_spec](https://github.com/openBackhaul/MicroWaveDeviceInventory/milestone/21).  
- this e.g. contains updating the testcases
- but also contains an issue related to a possible change in how MWDI interacts with Kafka

**v1.2.1**  
Spec release version 1.2.2 fixes further findings found by implementers during implementation of v1.2.1.  
The list of issues can be found in issue collection [MWDI v1.2.2_spec](https://github.com/openBackhaul/MicroWaveDeviceInventory/milestone/18).  

**v1.2.0 and v1.2.1**  
The v1.2.0 release adds the following new functionality:  
- new convenience services for retrieving stored information of external connections (link, linkport)  
- a new metadata table which contains status information for all devices, not only those, which are currently in connected state at the Controller. This includes the connection status, as well as e.g. timestamp information about controlConstruct updates. (Note: this does not include storing of controlConstructs of not connected devices.)  
- services for wred-template-profile have been added.  
- also the specification has been updated to use the latest release of the ApplicationPattern (v2.1.2)  

As release v1.2.0 was a pre-release of the specification handed over to implementers for effort estimation, some open issues were fixed with 1.2.1.  

#### Open issues
./. 

### Relevance
The MicroWaveDeviceInventory holds the inventory of the live MW network at Telefonica Germany.  
As such, it is more close to be a component of the controller than of the application layer.  
It is a precondition for most applications.  

### Resources
- [Specification](./spec/)
- [TestSuite](./testing/)
- [Implementation](./server/)

### Comments
This application has been specified during training for ApplicationOwners.
