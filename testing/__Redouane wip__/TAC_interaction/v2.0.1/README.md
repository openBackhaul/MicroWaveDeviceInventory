# Functional Testing of eatl logging

## General
In the MWDI , every service implementation must call the EATL record-service-request API at the end of its execution. This ensures that each service invocation is logged in EATL
EATL logs all service requests and provides functionality to retrieve information such as:
 - A list of all service records
 - A list of service records belonging to the same flow
 - A list of unsuccessful service requests

### Targets
All individual services


### Criteria
- Valid Mount Name : when the mountName is valid (i.e. found in the list of connected devices), the expected response is a 2XX status
- Steps :
 - Use a filter to retrieve valid IDs from CC
 - Send the request to MWDI using those valid IDs
 - Check that a corresponding log entry exists in EATL
 - Verify that the following fields are correctly logged 
  - application-name
  - application-release
  - operation-name
  - response-code = 2XX
- Invalid Mount Name : when the mountName is invalid (i.e. not found in the list of connected devices), the expected response is a 4XX or 5XX status
- Steps:
 - Send a request to MWDI with invalid IDs
 - Check for the corresponding EATL log 
 - Verify that the following fields are correctly logged
  - application-name
  - application-release
  - operation-name
  - response-code = 4XX or 5XX


### Comments  
- If a validMountName is not found in the list of connected devices, skip the valid request folder in the collection
- If an invalidMountName is found in the list of connected devices, skip the invalid request folder in the collection
- xCorrelator:
 - The xCorrelator is a unique identifier for each tested request.
 - It is composed as follows: xCorrelatorPrefix + "_" + [valid | invalid] + "_" + operationId + "_" + <random string>
 - Where:
  - xCorrelatorPrefix: input parameter from the dataFile
  - valid or invalid: based on the test case
  - operationId: the operationId of the resource path (from the OAS specification)
  - <random string>: varies depending on whether tests run against a mock EATL or the actual EATL
  - The resulting xCorrelator is encoded to match the expected format/pattern


### Scope
- This test case collection only verifies that request information exists and is correctly logged in EATL.
- Requests with missing header parameters or invalid request body with known issues (tracked in GitHub)


## MWDI v2.0.1  
- TestCaseCollection is split into the following folders:
 - [validRequest]
 - [invalidRequest]
  - [invalidResourcePathRequest]
  - [invalidNoResourcePathRequest]

![Overview](./mwdi+diagram.eatLogging.png)  