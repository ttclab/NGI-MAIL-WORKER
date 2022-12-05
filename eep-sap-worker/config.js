// Internal settings
exports.appname               = "eep-sap-worker";
// AMQP settings
// Indirizzo amqp locale
//exports.amqp_server_addr       = "localhost";
// Indirizzo amqp server produzione
//exports.amqp_server_addr      = "litlnx17";
// Indirizzo amqp server test
exports.amqp_server_addr      = "litlnx21";
exports.amqp_server_port      = 5672;
exports.amqp_heartbeat        = 60;
exports.amqp_req_queue        = "eep-sap-queue";
exports.exchange_name         = "eep-manager";
exports.routing_key           = "eep-manager-direct";
// EEP Api End Point settings
exports.httpPost_host         = "localhost";
exports.httpPost_port         = 8081;
// ERP settings
exports.sap_host              = "sappro";
exports.sap_port              = 8000;