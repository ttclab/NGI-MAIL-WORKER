// BASE SETUP
// ==============================================
var amqp = require('amqp');
var config = require('./config');
var globals = require('./globals');
var reqJson = require('request-json');
var host = "http://" + config.host_api_endpoint + ":" + config.port_api_endpoint + '/';


// AMQP LISTENERS
// ==============================================
var amqp_options = {
    host: config.amqp_server_addr,
    port: config.amqp_server_port,
    heartbeat: config.amqp_heartbeat
};

// Connection to RabbitMQ
var amqp_connection = amqp.createConnection(amqp_options);

amqp_connection.addListener('error', function (e)
{
    // exchange not found, redeclare it
    if (e.code === 404) {
        console.log("Error: exchange not found, trying to redeclare it...");
    } else {
        console.log(e);
    }
});

amqp_connection.addListener('close', function (e) {
    console.log(e);
    console.log("* connection to AMQP server closed.");
});

amqp_connection.on('heartbeat', function () {
    //console.log("* Heartbeat event call.");
});

amqp_connection.on('ready', function () {
    var exchange;
    console.log("Message Broker connection ready.......");
    exchange = amqp_connection.exchange(config.exchange_name, {type: 'fanout', autoDelete: false, confirm: true, durable: true});

    // if the exchange is already declared by JMeter, don't redeclare: just use it
    exchange.on('error', function (error) {
        console.log("Exchange error: " + error);
        //exchange = amqp_connection.exchange(config.exchange_name, {type: 'direct', autoDelete: false, confirm: true, durable: true});
    });

    amqp_connection.queue(config.amqp_req_queue, {autoDelete: false, durable: true}, function (queue)
    {
        queue.bind(exchange, config.routing_key);
        console.log("* subscribed to '" + config.amqp_req_queue + "' queue.");

        queue.subscribe({ack: true, prefetchCount: 1}, function (msg) {
            try {
                if (checkMsgToWork(msg)) {
                    insertLogging(msg);
                }
            } catch (e) {
                console.log("Error: received an incorrect message structure from external subsystem - " + e);
            } finally {
                queue.shift(); // Message processed: ACK to listening queue
            }
        });
    });

});

function checkMsgToWork(jsonParam) {
    var check = false;
    var command = jsonParam.command;
    if (command) {
        switch (command) {
            case globals['ACTION_UPDATE_ASN']:
            case globals['ACTION_INSERT_ASN']:
            case globals['ACTION_DELETE_ASN']:
            case globals['ACTION_DELETE_ASN_LINES']:
            case globals['ACTION_ADVANCED_STATUS_ASN']:
            case globals['ACTION_LOGIN']:
            case globals['ACTION_GENERATE_OTP']:
            case globals['ACTION_UPDATE_READ_STATUS_CHAT']:
            case globals['ACTION_INSERT_CHAT']:
            case globals['ACTION_UPDATE_INVOICE']:
            case globals['ACTION_INSERT_INVOICE']:
            case globals['ACTION_DELETE_INVOICE']:
            case globals['ACTION_INSERT_INVOICES_LINES']:
            case globals['ACTION_DELETE_INVOICES_LINES']:
            case globals['ACTION_ADVANCED_STATUS_INVOICE']:
            case globals['ACTION_INSERT_SAL_ODA']:
            case globals['ACTION_DELETE_SAL_ODA']:
            case globals['ACTION_CREATE_RFI']:
            case globals['ACTION_DELETE_RFI']:
            case globals['ACTION_DELETE_SUPPLIERS_RFI']:
            case globals['ACTION_ADVANCED_STATUS_RFI']:
            case globals['ACTION_UPDATE_RFQ']:
            case globals['ACTION_INSERT_RFQ']:
            case globals['ACTION_DELETE_RFQ']:
            case globals['ACTION_DELETE_RFQ_LINES']:
            case globals['ACTION_INSERT_RFQ_SUPPLIER']:
            case globals['ACTION_DELETE_RFQ_SUPPLIER']:
            case globals['ACTION_RFQ_PUBLISH']:
            case globals['ACTION_ADVANCED_STATUS_RFQ']:
            case globals['ACTION_INSERT_BID']:
            case globals['ACTION_UPDATE_BID']:
            case globals['ACTION_DELETE_BID']:
            case globals['ACTION_BID_PUBLISH']:
            case globals['ACTION_ASSIGN_SUPPLIER']:
            case globals['ACTION_ASSIGN_ALL_SUPPLIER']:
            case globals['ACTION_CONFIRM_ASSIGNMENT']:
            case globals['ACTION_CHANGE_PASSWORD']:
            case globals['ACTION_INSERT_USER']:
            case globals['ACTION_UPDATE_USER']:
            case globals['ACTION_DELETE_USER']:
            case globals['ACTION_UPDATE_USER_STATUS']:
            case globals['ACTION_INSERT_C_GOODS_REQ']:
            case globals['ACTION_UPDATE_STATUS_C_GOODS_REQ']:
            case globals['ACTION_INSERT_RIC_ABILITAZIONE']:
            case globals['ACTION_UPDATE_STATO_RIC_ABIL']:
            case globals['ACTION_UPDATE_RIC_QUALIFICA']:
            case globals['ACTION_INSERT_RIC_QUALIFICA']:
            case globals['ACTION_UPDATE_STATO_RIC_QUAL']:
            case globals['ACTION_DELETE_RIC_QUALIFICA']:
            case globals['ACTION_INSERT_TC']:
            case globals['ACTION_ACCEPT_TC']:
            case globals['ACTION_NOTIFY_COMPANY_CREDENTIAL']:
            case globals['ACTION_UPDATE_COMPANY']:
            case globals['ACTION_SEND_NEW_ACCOUNT']:
            case globals['ACTION_SECURITY_UPLOAD_FILE']:
                check = true;
                break;
        }
    }
    return check;
}

function getJsonService(jsonParam) {
    var jsonService = {
        azione: jsonParam.command,
        timestamp: jsonParam.timestamp,
        errore: jsonParam.error,
        dati: jsonParam.data,
        utente: jsonParam.userToken.nome + " " + jsonParam.userToken.cognome
    };
    jsonService.codice = getCodiceJsonService(jsonService.azione, jsonService.dati);

    return jsonService;
}

function getCodiceJsonService(command, data) {
    var codice = '-';
    switch (command) {
        case globals['ACTION_UPDATE_READ_STATUS_CHAT']:
        case globals['ACTION_INSERT_CHAT']:
            codice = data.oggetto;
            break;
        case globals['ACTION_UPDATE_ASN']:
        case globals['ACTION_INSERT_ASN']:
            codice = data.codiceAsn;
            break;
        case globals['ACTION_INSERT_INVOICE']:
        case globals['ACTION_UPDATE_INVOICE']:
        case globals['ACTION_DELETE_INVOICES_LINES']:
            codice = data.codiceFattura;
            break;
        case globals['ACTION_ADVANCED_STATUS_INVOICE']:
            codice = data.invoiceCode;
            break;
        case globals['ACTION_INSERT_SAL_ODA']:
            codice = data.ordine;
            break;
        case globals['ACTION_CREATE_RFI']:
            codice = data.codiceRfi;
            break;
        case globals['ACTION_INSERT_BID']:
            codice = data.codiceOfferta;
            break;
        case globals['ACTION_INSERT_C_GOODS_REQ']:
        case globals['ACTION_UPDATE_STATUS_C_GOODS_REQ']:
            codice = data.codiceCGoods;
            break;
        case globals['ACTION_INSERT_RIC_QUALIFICA']:
            codice = data.codiceRicQualifica;
            break;
        case globals['ACTION_NOTIFY_COMPANY_CREDENTIAL']:
            codice = data.codice;
            break;
        // Verificare i dati che vengono inviati da interfaccia grafica
        case globals['ACTION_DELETE_ASN']:
        case globals['ACTION_DELETE_ASN_LINES']:
        case globals['ACTION_ADVANCED_STATUS_ASN']:
        case globals['ACTION_DELETE_INVOICE']:
        case globals['ACTION_INSERT_INVOICES_LINES']:
        case globals['ACTION_DELETE_SAL_ODA']:
        case globals['ACTION_DELETE_RFI']:
        case globals['ACTION_DELETE_SUPPLIERS_RFI']:
        case globals['ACTION_ADVANCED_STATUS_RFI']:
        case globals['ACTION_DELETE_RFQ']:
        case globals['ACTION_UPDATE_RFQ']:
        case globals['ACTION_DELETE_RFQ_LINES']:
        case globals['ACTION_INSERT_RFQ_SUPPLIER']:
        case globals['ACTION_DELETE_RFQ_SUPPLIER']:
        case globals['ACTION_RFQ_PUBLISH']:
        case globals['ACTION_ADVANCED_STATUS_RFQ']:
        case globals['ACTION_UPDATE_BID']:
        case globals['ACTION_DELETE_BID']:
        case globals['ACTION_BID_PUBLISH']:
        case globals['ACTION_ASSIGN_SUPPLIER']:
        case globals['ACTION_ASSIGN_ALL_SUPPLIER']:
        case globals['ACTION_CONFIRM_ASSIGNMENT']:
        case globals['ACTION_UPDATE_STATO_RIC_ABIL']:
        case globals['ACTION_UPDATE_RIC_QUALIFICA']:
        case globals['ACTION_UPDATE_STATO_RIC_QUAL']:
        case globals['ACTION_DELETE_RIC_QUALIFICA']:
        // Modificare il servizio in modo da avere i dati necessari
        case globals['ACTION_INSERT_RFQ']:
        case globals['ACTION_INSERT_RIC_ABILITAZIONE']:
        //
        case globals['ACTION_UPDATE_COMPANY']:
            break;
        default:
            break;
    }
    return codice;
}

function insertLogging(jsonParam)
{
    var service = "insertLog";
    var jsonMsg = getJsonService(jsonParam);

    try {
        var client = reqJson.createClient(host);

        console.log("insertLog : " + JSON.stringify(jsonMsg));
        console.log("Service : " + host + service);
        client.post(service, jsonMsg, function (err, res, body) {
            if (err) {
                console.log("Error code : " + err.code);
            } else {
                displayMsgReceivedFromQueue(JSON.stringify(body));
            }
            return;
        });
    } catch (e) {
        console.log('Error : ' + e);
    }
}

function displayMsgReceivedFromQueue(msg) {
    console.log("Msg received from ERP queue : " + msg);
}

