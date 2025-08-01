function getCandidateDevice(deviceMetadataList) {
  let result = deviceMetadataList.find(device => {
    return (
    device["connection-status"] == "connected" &&
    device["locked-status"] == false &&
    device["exclude-from-qm"] == false
    );
    }
  );
  return result;
}

module.exports = { getCandidateDevice };