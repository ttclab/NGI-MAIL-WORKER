// Internal settings
exports.appname                = "eep-mail-worker";
// AMQP settings
//exports.amqp_server_addr       = "localhost";
exports.amqp_server_addr       = "litlnx21";
exports.amqp_server_port       = 5672;
exports.amqp_heartbeat         = 60;
exports.amqp_req_queue         = "eep-mail-queue";
exports.exchange_name          = "eep";
exports.routing_key            = "eep-queue-direct";
exports.msg_timeout            = 30000;
// TEST
exports.amqp_server_username    = "admin";
exports.amqp_server_password    = "2Rb!t1Mq";
// PRODUZIONE
//exports.amqp_server_username    = "admin";
//exports.amqp_server_password    = "1Rb!t7Mq";

// SMTP data settings
//exports.smtp_host = "smtp://ngiexch03";
exports.smtp_host = "smtp://smtp";
