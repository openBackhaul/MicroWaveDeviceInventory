Delete this link at the end of the specification process:  
- [Roadmap to Specification](../../issues/1)

# MicroWaveDeviceInventory  

### Location  
The MicroWaveDeviceInventory is part of the HighPerformanceNetworkInterface.  

### Description  
The MicroWaveDeviceInventory supports GETting device information.  
The GET requests to the MicroWaveDeviceInventory can either be addressed to the  
 - /cache/ paths (quick response time) or the  
 - /live/ paths  (real-time network data).  

The purpose of the /cache/ paths of the MWDI is to shorten the access time and to minimize the number and size of accesses to the devices.  
The /live/ paths of the MWDI serve as a gateway that restricts GET requests to the devices to approved applications and pre-defined classes.  

The API of the MWDI is made in such a way that consuming applications could easily switch between /cache/ or /live/ paths of the MWDI and original NBI of the MW SDN controller without changes to the coding.  

The cache of the MicroWaveDeviceInventory covers Capability, Configuration, Historical Performance, Alarm and discrete Status information.  
Continuous measurement values (e.g. instantaneous receive level) and current counter readings (e.g. current dropped frames count) are provided via the /live/ paths of the MWDI only.  

No matter which path chosen, the information provided by the MicroWaveDeviceInventory is limited to devices that are currently connected to the controller.  

The MicroWaveDeviceInventory is updating its cache by retrieving the entire data tree from the devices at a configurable periode and continuously updating individual attributes based on value change notifications and requests to the /live/ paths in between.  

The MWDI supports directly addressing entire classes only.  
Individual attributes or combinations of attributes are indirectly addressed by using the fields filter.  
The RESTCONF interface of the controller could process the same requests, too.  

The MWDI offers subscribing for ONF-TR-532-like notifications (webhook based method) that relate to the content of its cache.  

### Relevance
The MicroWaveDeviceInventory holds the inventory of the live MW network at Telefonica Germany.  
As such, it is more close to be a component of the controller than of the application layer.  
It is a precondition for most applications.  

### Resources
- [Specification](./spec/)
- [TestSuite](./testing/)
- [Implementation](./server/)

---
### Comments
This application will be specified during [training for ApplicationOwners](https://gist.github.com/openBackhaul/5aabdbc90257b83b9fe7fc4da059d3cd).
