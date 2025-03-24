const fs = require('fs');
const path = require("path");

// Start cyclic process
const cyclicProcessServicePath = '../service/individualServices/CyclicProcessService';
const temporarySupportFilesPath = './temporarySupportFiles';

const cp = require(cyclicProcessServicePath + '/cyclicProcess');

const SINGLE_DEVICE_LIST = false;
let devicelistSimulationIndex = 6;

//
// Get the device list from a json file at the moment (simulation)
//
module.exports.getNewDeviceListExp = async function getNewDeviceListExp() {
  try {
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        //simulatation of devicelist request
        resolve();
      }, 1000);
    })
    let fileName = ''
    if (SINGLE_DEVICE_LIST) {
      fileName = path.resolve(__dirname, "TestLabDeviceMinimal.Json");
    } else {
      /*
      if (devicelistSimulationIndex == 0) {
          fileName = path.resolve(__dirname, "TestLabDeviceMinimal.Json");
      } else if (devicelistSimulationIndex == 1) {
          fileName = path.resolve(__dirname, "TestLabDeviceMinimal1.Json");
      } else if (devicelistSimulationIndex == 2) {
          fileName = path.resolve(__dirname, "TestLabDeviceMinimal2.Json");
      } else if (devicelistSimulationIndex == 3) {
          fileName = path.resolve(__dirname, "TestLabDeviceMinimal3.Json");
      } else if (devicelistSimulationIndex == 4) {
          fileName = path.resolve(__dirname, "TestLabDeviceMinimal4.Json");
      } else if (devicelistSimulationIndex == 5) {
          fileName = path.resolve(__dirname, "TestLabDeviceMinimal5.Json");
      }
      */
      fileName = path.resolve(__dirname, "TestLabDeviceMinimal" + devicelistSimulationIndex + ".Json");
      devicelistSimulationIndex = (devicelistSimulationIndex == 13) ? 6 : (devicelistSimulationIndex + 1);
    }
    let deviceList = JSON.parse(fs.readFileSync(fileName, 'utf8'))["network-topology:network-topology"].topology[0].node;
    return deviceList;

  } catch (error) {
    console.log("Error in getNewDeviceList(): " + error);
  }
}

module.exports.start = async function start() {

  // Returns the deviceList with all equipments connected
  function filterConnectedDevices(deviceList) {
    try {
      return deviceList.filter(device => {
        return device['netconf-node-topology:connection-status'] === 'connected';
      })
    } catch (error) {

    }
  }

  // Get the device list from a json file at the moment (simulation)
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
        fileName = path.resolve(__dirname, "TestLabDeviceMinimal.Json");
      } else {
        if (devicelistSimulationIndex == 0) {
          fileName = path.resolve(__dirname, "TestLabDeviceMinimal1.Json");       // [A|B|C|D|E|F|G|H|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z]
        } else if (devicelistSimulationIndex == 1) {
          fileName = path.resolve(__dirname, "TestLabDeviceMinimal2.Json");       //                 [L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z]
        } else if (devicelistSimulationIndex == 2) {
          fileName = path.resolve(__dirname, "TestLabDeviceMinimal3.Json");       //                               [S|T|U|V|W|X|Y|Z]
        } else if (devicelistSimulationIndex == 3) {
          fileName = path.resolve(__dirname, "TestLabDeviceMinimal4.Json");       // [A|B|C|D|E]
        } else if (devicelistSimulationIndex == 4) {
          fileName = path.resolve(__dirname, "TestLabDeviceMinimal5.Json");       // []
        }
        devicelistSimulationIndex = (devicelistSimulationIndex == 4) ? 0 : (devicelistSimulationIndex + 1);
      }
      let deviceList = JSON.parse(fs.readFileSync(fileName, 'utf8'))["network-topology:network-topology"].topology[0].node;
      deviceList = filterConnectedDevices(deviceList);
      return deviceList;

    } catch (error) {
      console.log("Error in getNewDeviceList(): " + error);
    }
  }

  async function startDeviceListRealignmentSimulation() {

    const delay = 15 + Math.floor(Math.random() * 30);
    setTimeout(async () => {
      //let newDeviceList = await getNewDeviceList();
      cp.deviceListSynchronization();
      startDeviceListRealignmentSimulation();
    }, delay * 1000);
  }
  cp.startCyclicProcess(2);

}
