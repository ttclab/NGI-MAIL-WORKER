// Internal settings
exports.appname                = "eep-logging-worker";
// AMQP settings
//exports.amqp_server_addr       = "localhost";
exports.amqp_server_addr       = "litlnx21";
exports.amqp_server_port       = 5672;
exports.amqp_heartbeat         = 60;
exports.amqp_req_queue         = "eep-logging-queue";
exports.exchange_name          = "eep";
exports.routing_key            = "eep-queue-direct";
exports.msg_timeout            = 30000;
// API End-Point settings
exports.host_api_endpoint      = "localhost";
exports.port_api_endpoint      = 8084;
