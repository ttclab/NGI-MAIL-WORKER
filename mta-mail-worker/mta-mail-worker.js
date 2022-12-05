// BASE SETUP
// ==============================================
var amqp = require('amqp');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var cons = require('consolidate');
var config = require('./config');
var globals = require('./globals');
var templateDir = "/usr/local/ttc/tcp/workers/eep-mail-worker/email-templates/";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

// AMQP LISTENERS
// ==============================================
var amqp_options = {
    host: config.amqp_server_addr,
    port: config.amqp_server_port,
    heartbeat: config.amqp_heartbeat,
    login: config.amqp_server_username,
    password: config.amqp_server_password
};
// Connection to RabbitMQ
var amqp_connection = amqp.createConnection(amqp_options);

amqp_connection.addListener('error', function (e) {
    // exchange not found, redeclare it
    if (e.code === 404) {
        console.log("Error: exchange not found, trying to redeclare it...");
    } else {
        console.log("Error: " + e);
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
    var emailEventJson = {};
    var exchange;

    console.log("Message Broker connection ready.......");

    exchange = amqp_connection.exchange(config.exchange_name, { type: 'fanout', autoDelete: false, confirm: true, durable: true });

    // if the exchange is already declared by JMeter, don't redeclare: just use it
    exchange.on('error', function (error) {
        console.log("Exchange error: " + error);
        //exchange = amqp_connection.exchange(config.exchange_name, {type: 'direct', autoDelete: false, confirm: true, durable: true});
    });

    amqp_connection.queue(config.amqp_req_queue, { autoDelete: false, durable: true }, function (queue) {
        queue.bind(exchange, config.routing_key);
        console.log("* subscribed to '" + config.amqp_req_queue + "' queue.");

        queue.subscribe({ ack: true, prefetchCount: 1 }, function (msg) {
            try {
                console.log("INCOMING MSG...");
                // Get message body
                var jsonMsg = getMessageBody(msg);

                console.log("jsonMsg..." + jsonMsg);

                // Check if the parameter "multi" is present. if present then send multi mail.
                if (jsonMsg.data.multi) {
                    if (jsonMsg.data.mailList) {
                        var listUser = jsonMsg.data.mailList.split(",");
                        for (var i = 0; i < listUser.length; i++) {
                            jsonMsg.data.mailTo = listUser[i].trim();

                            // Create email event object 
                            emailEventJson = createEmailEventObject(jsonMsg);

                            if ((emailEventJson.service != undefined) &&
                                (emailEventJson.to != undefined)) {
                                console.log("SERVICE : " + emailEventJson.service);
                                console.log("TO : " + emailEventJson.to);
                                // Format and send html email
                                sendHtmlEmail(emailEventJson, jsonMsg);
                            }
                        }
                    }
                } else {

                    // Create email event object 
                    emailEventJson = createEmailEventObject(jsonMsg);

                    if ((emailEventJson.service != undefined) &&
                        (emailEventJson.to != undefined)) {
                        console.log("SERVICE : " + emailEventJson.service);
                        console.log("TO : " + emailEventJson.to);
                        // Format and send html email
                        sendHtmlEmail(emailEventJson, jsonMsg);
                    }

                }
            } catch (e) {
                console.log("Error: received an incorrect message structure from external subsystem - " + e);
            } finally {
                queue.shift(); // Message processed: ACK to listening queue
            }
        });
    });

    //    amqp_connection.queue(config.amqp_req_queue, {autoDelete: false, durable: true}, function (queue) {
    //        queue.bind(exchange, config.routing_key);
    //        console.log("* subscribed to '" + config.amqp_req_queue + "' queue.");
    //
    //        queue.subscribe({ack: true, prefetchCount: 1}, function (msg) {
    //            try {
    //                console.log("INCOMING MSG...");
    //
    //                // Get message body
    //                var jsonMsg = getMessageBody(msg);
    //
    //                // Create email event object 
    //                emailEventJson = createEmailEventObject(jsonMsg);
    //
    //                if ((emailEventJson.service != undefined) &&
    //                        (emailEventJson.to != undefined)) {
    //                    console.log("SERVICE : " + emailEventJson.service);
    //                    console.log("TO : " + emailEventJson.to);
    //                    // Format and send html email
    //                    sendHtmlEmail(emailEventJson, jsonMsg);
    //                }
    //            } catch (e) {
    //                console.log("Error: received an incorrect message structure from external subsystem - " + e);
    //            } finally {
    //                queue.shift(); // Message processed: ACK to listening queue
    //            }
    //        });
    //    });
});

// Utils
function getMessageBody(msg) {
    var json = {};
    try {
        json = JSON.parse(msg.data);
    } catch (e) {
        console.log('Exception getMessageBody parse body msg: ' + e);
        json = msg.data;
    } finally {
        return json;
    }
}


function createEmailEventObject(msg) {
    var jsonParam = msg;
    var emailParams = {};
    var command;

    displayMsgReceivedFromQueue(msg);

    emailParams.from = "noreply@tcp-notifier.it";
    command = jsonParam.command;
    console.log("Command: " + command);
    switch (command) {
        case globals.MTA_OBJECT_ASSIGNED:
            emailParams.service = command;
            emailParams.from = globals.SERVICE_EMAIL;
            emailParams.to = jsonParam.data.mailList;
            emailParams.subject = "Oggetto assegnato in MTA";
            emailParams.template = templateDir + 'mtaOggettoAssegnato.html';
            break;
        case globals.MTA_OBJECT_CONFIRMED:
            emailParams.service = command;
            emailParams.from = globals.SERVICE_EMAIL;
            emailParams.to = jsonParam.data.mailList;
            emailParams.subject = "Oggetto assegnato accettato in MTA";
            emailParams.template = templateDir + 'mtaOggettoAssegnatoRispostaOk.html';
            break;
        case globals.MTA_OBJECT_REFUSED:
            emailParams.service = command;
            emailParams.from = globals.SERVICE_EMAIL;
            emailParams.to = jsonParam.data.mailList;
            emailParams.subject = "Oggetto assegnato rifiutato in MTA";
            emailParams.template = templateDir + 'mtaOggettoAssegnatoRispostaKo.html';
            break;
    }
    console.log('EmailParams : ' + JSON.stringify(emailParams));

    return (emailParams);
}

function sendHtmlEmail(emailEventJson, msg) {
    var jsonParam = msg;

    try {
        console.log('Swig : ' + JSON.stringify(jsonParam));

        cons.swig(emailEventJson.template, jsonParam.data)
            .then(function (html) {
                console.log(html);
                sendEmail(emailEventJson, html);
            })
            .catch(function (err) {
                throw err;
            });
    } catch (e) {
        console.log('Exception sendHtmlEmail: ' + e);
    }
}

function sendEmail(emailEventJson, mailHtml) {
    try {
        var transporter = nodemailer.createTransport(config.smtp_host);

        var mailOptions = {
            from: emailEventJson.from,
            to: emailEventJson.to,
            subject: emailEventJson.subject,
            html: mailHtml
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log('Message sent: ' + JSON.stringify(error));
                return console.log(error);
            }
            console.log('Message sent: ' + JSON.stringify(info));
        });
    } catch (e) {
        console.log('Exception sendEmail : ' + e);
    }
}

function displayMsgReceivedFromQueue(msg) {
    console.log("Msg received from ERP queue : " + JSON.stringify(msg.data));
}
