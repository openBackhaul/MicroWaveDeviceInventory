// File to manage constants

// -- Application
export const OPENDAYLIGHT_STR = "OpenDayLight";
export const ELASTICSEARCH_STR = "ElasticSearch";

// ----------------------------------------------------
export const LiveDeviceList =
    "/rests/data/network-topology:network-topology/topology=topology-netconf?fields=node(node-id;netconf-node-topology:connection-status)";

export const resolveApplicationNameAndHttpClientLtpUuidFromForwardingNameForDeviceList = 
    "/rests/data/network-topology:network-topology/topology=topology-netconf?fields=node(node-id;netconf-node-topology:connection-status)"
