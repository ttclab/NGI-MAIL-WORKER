var amqp = require('amqp');
var config = require('./config');

// AMQP LISTENERS
// ==============================================
var amqp_options = {
    host: config.amqp_server_addr,
    port: config.amqp_server_port,
    heartbeat: config.amqp_heartbeat
};

// Connection to RabbitMQ
var amqp_connection = amqp.createConnection(amqp_options);

amqp_connection.addListener('error', function (e) {
    // exchange not found, redeclare it
    if (e.code === 404) {
        console.log("Error: exchange not found, trying to redeclare it...");
    } else {
        console.log("Error amqp connection: " + e);
    }
});

amqp_connection.addListener('close', function () {
    console.log("Connection to AMQP server closed.");
});

amqp_connection.on('heartbeat', function () {
    //console.log("* Heartbeat event call.");
});

amqp_connection.on('ready', function () {
    var exchange;

    console.log("Message Broker connection ready.......");

    exchange = amqp_connection.exchange(config.exchange_name, {type: 'fanout', autoDelete: false, confirm: true, durable: true});

    exchange.on('error', function (error) {
        console.log("Exchange error: " + error);
    });

    amqp_connection.queue(config.amqp_req_queue, {autoDelete: false, durable: true}, function (queue) {
        queue.bind(exchange, config.routing_key);
        console.log("* subscribed to '" + config.amqp_req_queue + "' queue.");

        queue.subscribe({ack: true, prefetchCount: 1}, function (msg) {
            try {
                if(checkMessage(msg)) {
                    
                }
            } catch (e) {
                console.log("Error: received an incorrect message structure from external subsystem - " + e);
            } finally {
                queue.shift(); // Message processed: ACK to listening queue
            }
        });
    });
});

function checkMessage(msg) {
    var check = false;
    var jsonMsg = {};
    var command;
    try {
        // Transform msg to json  
        jsonMsg = JSON.parse(msg.data);
        command = jsonMsg.command;
        switch(command) {
            case '':
                break;
            case '':
                break;
        }
    }
    catch(e) {
        console.log('Exception check message: ' + e);
    }
    finally {
        return check;
    }
}