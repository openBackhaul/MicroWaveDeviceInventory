Delete this link at the end of the specification process:  
- [Roadmap to Specification](../../issues/1)

# MicroWaveDeviceInventory

### Location
The MicroWaveDeviceInventory is part of the HighPerformanceNetworkInterface.

### Description
_Copy from Roadmap:_
This application provides cached device information, including Capability, Configuration, Status and Historical Performance information. The MicroWaveDeviceInventory shall periodically retrieve the entire data tree from the microwave device and update individual attributes based on value change notifications in between. The MicroWaveDeviceInventory shall massively accelerate response time for providing live data and reduce load on device controllers. It is a precondition for many other applications.
If need would be confirmed: MicroWaveDeviceInventory shall either automatically retrieve the latest historical performance data set as soon as it is available, or the latest ones at a configurable frequency.
Open Question: Shall the MWDI represent the RESTCONF interface at its API or a service request that receives the RESTCONF path as an attribute?
_Original Text:_
- This application provides cached device information, including Capability, Configuration and Historical Performance information.  
- The MicroWaveDeviceInventory shall periodically retrieve the entire data tree from the microwave device and update individual attributes based on value change notifications in between.  
- The MicroWaveDeviceInventory shall massively accelerate response time for providing live data and reduce load on device controllers.  
- It is a precondition for many other applications.

### Relevance
The MicroWaveDeviceInventory holds the inventory of the live network at Telefonica Germany.
As such, it is more close to be a component of the controller than of the application layer.

### Resources
- [Specification](./spec/)
- [TestSuite](./testing/)
- [Implementation](./server/)

### Comments
This application will be specified during training for ApplicationOwner.
