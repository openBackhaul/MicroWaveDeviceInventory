# Functional Testing of Completeness


## General

### Targets
- All individual services

### Criteria
- ResponseCode 204 OR 200 with ResponseBody according to the definitions in the OAS

### Comments  
- Need for Updates:  
  - Services paths (e.g. /v1/provide-list-of-links) depend on the release of the application  
  - Ressource paths (e.g. /core-model-1-4:network-control-domain=cache/control-construct={mountName}) might depend on the release of the management interface  
- Testing of Ressource Paths:  
  - Controller/mediator/device gets addressed first to prevent the MWDI testing to fail in case the mediator is faulty  
  - Live domain gets addressed next to assure the MWDI to cache the information requested afterwards


## MWDI v2.0.1  
- TestCaseCollection for testing Completeness is split, because of very high number of paths  
  - [Receivers of Notifications](./v2.0.1/Receiver/)  
  - [Providers of Data](./v2.0.1/Dataprovider/)  
  - [Offered Subscriptions](./v2.0.1/Subscriptions/)  
  - [CacheEnrichment](./v1/2.2/CacheEnrichement)  
  - [ControlConstruct](./v2.0.1/CC/)  
  - [Alarms](./v2.0.1/Alarms/)  
  - [Equipment](./v2.0.1/Equipment/)  
  - [Firmware](./v2.0.1/Firmware/)  
  - [Profiles](./v2.0.1/Profiles/)  
  - [Connections](./v2.0.1/Connections/)  
  - [Interfaces](./v2.0.1/Interfaces/)  

![Overview](./mwdi+diagram.completeness.png)  


