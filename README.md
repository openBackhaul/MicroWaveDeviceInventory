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
The v1.2.0 release adds the following new functionality:  
- new convenience services for retrieving stored information of external connections (link, linkport)  
- a new metadata table which contains status information for all devices, not only those, which are currently in connected state at the Controller. This includes the connection status, as well as e.g. timestamp information about controlConstruct updates. (Note: this does not include storing of controlConstructs of not connected devices.)  
- services for wred-template-profile have been added.  
- also the specification has been updated to use the latest release of the ApplicationPattern (v2.1.2)  

Details can be found in the issue collection [MWDI v1.2.0_spec](https://github.com/openBackhaul/MicroWaveDeviceInventory/milestone/11).  

#### Open issues
Spec release v1.2.0 will be a prerelease of the specification handed over to the implementers for effort estimation.  
There are still some open issues, which will be fixed and delivered with spec release 1.2.1.  
The list of open issues in scope can be found in the issue collection [MWDI v1.2.1_spec](https://github.com/openBackhaul/MicroWaveDeviceInventory/milestone/15).  

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
