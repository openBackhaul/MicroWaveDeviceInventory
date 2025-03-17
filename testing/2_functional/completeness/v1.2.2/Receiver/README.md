# Functional Testing of Completeness of the Receivers of Notifications

![Overview](./mwdi+diagram.completeness.receiver.png)  

Note that when the services under test are normally called by NotificationProxy to trigger an update in the MWDI cache.  
Therefore there are some limitations and things to be aware of:
- `/v1/regard-controller-attribute-value-change`
  - indicates that a device has changed its connection state at the Controller
  - test can be called with a dummy mount name as input (so there will be no actual change on the MWDI cache)
- `/v1/regard-device-alarm`
- `/v1/regard-device-attribute-value-change`
- `/v1/regard-device-object-creation`
- `/v1/regard-device-object-deletion`

---

Additional notes:
- All of the above regard-services answer with 204 in case of success, i.e. without response body.
- The datafile contains the entries "serverToBeApplied" and "controllerToBeApplied". For now only serverToBeApplied is required. The controller would be queried if an regard-operation on MWDI is called, which would require the MWDI to fetch data from the Controller. However, this is done within a callback and thus, encapsulated. The controllerToBeApplied however could be added as an information to reflect with which Controller the MWDI is connected. It is kept for now, but may be removed later on. 