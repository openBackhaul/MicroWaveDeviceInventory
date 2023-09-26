'use strict';

var path = require('path');
var http = require('http');

var oas3Tools = require('oas3-tools');
var serverPort = 8080;

// swaggerRouter configuration
var options = {
    routing: {
        controllers: path.join(__dirname, './controllers')
    },
};

var expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api/openapi.yaml'), options);
var app = expressAppConfig.getApp();

// Initialize the Swagger middleware
http.createServer(app).listen(serverPort, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
});


// Start cyclic process 
const cyclicProcessServicePath = './service/individualServices/CyclicProcessService';
const temporarySupportFilesPath = './temporarySupportFiles';
const fs = require('fs');
const cp = require(cyclicProcessServicePath + '/cyclicProcess');

const SINGLE_DEVICE_LIST = false;
let devicelistSimulationIndex = 0;

async function start() {
    //
    // Returns the deviceList with all equipments connected
    //
    function filterConnectedDevices(deviceList){
        try {
            return deviceList.filter(device =>{
                return device['netconf-node-topology:connection-status'] === 'connected';
            })
        } catch(error) {

        }
    }

    //
    // Get the device list from a json file at the moment (simulation)
    //
    async function getNewDeviceList() {
        try {
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    //simula richiesta deviceList
                    resolve();
                }, 1000);
            })            
            let fileName = ''
            if (SINGLE_DEVICE_LIST) {
                fileName = temporarySupportFilesPath + '/TestLabDeviceMinimal.Json';
            } else {
                if (devicelistSimulationIndex == 0) {
                    fileName = temporarySupportFilesPath + '/TestLabDeviceMinimal1.Json';     // [A|B|C|D|E|F|G|H|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z]
                } else if (devicelistSimulationIndex == 1) {
                    fileName = temporarySupportFilesPath + '/TestLabDeviceMinimal2.Json';     //                 [L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z]
                } else if (devicelistSimulationIndex == 2) {
                    fileName = temporarySupportFilesPath + '/TestLabDeviceMinimal3.Json';     //                               [S|T|U|V|W|X|Y|Z]
                } else if (devicelistSimulationIndex == 3) {
                    fileName = temporarySupportFilesPath + '/TestLabDeviceMinimal4.Json';     // [A|B|C|D|E]
                } else if (devicelistSimulationIndex == 4) {
                    fileName = temporarySupportFilesPath + '/TestLabDeviceMinimal5.Json';     // []
                }  
                devicelistSimulationIndex = (devicelistSimulationIndex == 4) ? 0 : (devicelistSimulationIndex + 1);
            }
            let deviceList = JSON.parse(fs.readFileSync(fileName, 'utf8'))["network-topology:network-topology"].topology[0].node;
            deviceList = filterConnectedDevices(deviceList);
            return deviceList;

        } catch (error) {
            console.log("Error in getNewDeviceList(): " + error);
            debugger;
        }
    }

    async function startDeviceListRealignmentSimulation() {

        const delay = 15 + Math.floor(Math.random() * 30);
        setTimeout(async () => {
            let newDeviceList = await getNewDeviceList();
            cp.deviceListSynchronization(newDeviceList);
            startDeviceListRealignmentSimulation();
        }, delay * 1000);
    }


    
    let deviceList = await getNewDeviceList();
    
    cp.startCyclicProcess(deviceList,2);
    if (SINGLE_DEVICE_LIST == false) {
        startDeviceListRealignmentSimulation();
    }
}

start()
