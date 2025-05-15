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

**v1.3.0**  
Spec release 1.3.0 adds new functionality to improve and measure data quality of the cache in terms of the new qualityMeasurement process.
The qualityMeasurement process
- selects a new update candidate device every x minutes (configurable, intially set to 1 minute)
- retrieves both the already cached and the current ControlConstruct from live (thereby also updating the cache)
- compares both and scores the changes
- writes the results into ElasticSearch for evaluation and analysis purposes

The introduction of this mechanism required changes to
- slidingWindow process: the next update candidate for the slidingWindow is no longer taken from deviceList, but read from the metadata status table
- metadata status table:
  - new attribute for device-type
  - ordering according to the timestamp storing the last complete ControlConstruct update time
  - a new input filter (requestBody) for retrieving the next update candidate for both qualityMeasurement and slidingWindow process

(TBD) Moreover, an interface to Kafka has been introduced, to improve the performance of notification handling. (Receiving notifications from NotificationProxy was turned-off before, due to it not being performant enough.)

The list of related issues can be found in issue collection [MWDI v1.3.0_spec](https://github.com/openBackhaul/MicroWaveDeviceInventory/milestone/20)


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
