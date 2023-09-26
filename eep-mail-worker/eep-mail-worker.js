// BASE SETUP
// ==============================================
var amqp = require("amqp");
var nodemailer = require("nodemailer");
var smtpTransport = require("nodemailer-smtp-transport");
var cons = require("consolidate");
var config = require("./config");
var globals = require("./globals");
var templateDir = "/usr/local/ttc/tcp/workers/eep-mail-worker/email-templates/";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

// AMQP LISTENERS
// ==============================================
var amqp_options = {
  host: config.amqp_server_addr,
  port: config.amqp_server_port,
  heartbeat: config.amqp_heartbeat,
  login: config.amqp_server_username,
  password: config.amqp_server_password,
  ssl: {
    enabled: true,
    verify: false,
    rejectUnauthorized: false,
  },
};
// Connection to RabbitMQ
var amqp_connection = amqp.createConnection(amqp_options);

amqp_connection.addListener("error", function (e) {
  // exchange not found, redeclare it
  if (e.code === 404) {
    console.log("Error: exchange not found, trying to redeclare it...");
  } else {
    console.log("Error: " + e);
  }
});

amqp_connection.addListener("close", function (e) {
  console.log(e);
  console.log("* connection to AMQP server closed.");
});

amqp_connection.on("heartbeat", function () {
  //console.log("* Heartbeat event call.");
});

amqp_connection.on("ready", function () {
  var emailEventJson = {};
  var exchange;

  console.log("Message Broker connection ready.......");

  exchange = amqp_connection.exchange(config.exchange_name, { type: "fanout", autoDelete: false, confirm: true, durable: true });

  // if the exchange is already declared by JMeter, don't redeclare: just use it
  exchange.on("error", function (error) {
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

              if (emailEventJson.service != undefined && emailEventJson.to != undefined) {
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

          if (emailEventJson.service != undefined && emailEventJson.to != undefined) {
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
    console.log("Exception getMessageBody parse body msg: " + e);
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
    case globals.ACTION_GENERATE_OTP:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.email;
      emailParams.subject = "OTP Communications";
      emailParams.template = templateDir + "otp.html";
      break;
    case globals.ACTION_SEND_COMPANY_CREDENTIAL:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.email;
      emailParams.subject = "Company Credential";
      emailParams.template = templateDir + "sendCompanyCredential.html";
      break;
    case globals.ACTION_QUALIFICATION_RENEWAL:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mailList;
      emailParams.subject = "Qualification renewal";
      emailParams.template = templateDir + "qualificationRenewal.html";
      break;
    case globals.ACTION_UPDATE_STATUS_ODA:
      if (jsonParam.data.stato == "1") {
        emailParams.service = command;
        emailParams.from = globals.SERVICE_EMAIL;
        emailParams.to = jsonParam.data.mailList;
        emailParams.subject = "ODA published";
        emailParams.template = templateDir + "odaPublished.html";
      }
      /*if (jsonParam.data.stato == "3" || jsonParam.data.stato == "2") {
             emailParams.service = command;
             emailParams.from = globals.SERVICE_EMAIL;
             emailParams.to = jsonParam.data.mailList;
             if (jsonParam.data.stato == "2") {
             emailParams.subject = "ODA accepted.";
             emailParams.template = templateDir + 'odaAccepted.html';
             } else if (jsonParam.data.stato == "3") {
             emailParams.subject = "ODA rejected.";
             emailParams.template = templateDir + 'odaRejected.html';
             }
             }*/
      break;
    case globals.ACTION_INSERT_C_GOODS_REQ:
      if (jsonParam.data.mailTo) {
        emailParams.service = command;
        emailParams.from = globals.SERVICE_EMAIL;
        emailParams.to = jsonParam.data.mailTo;
        emailParams.subject = "New request commodity goods";
        emailParams.template = templateDir + "requestCGoods.html";
      }
      break;
    case globals.ACTION_INSERT_RIC_QUALIFICA:
      if (jsonParam.data.mailTo) {
        emailParams.service = command;
        emailParams.from = globals.SERVICE_EMAIL;
        emailParams.to = jsonParam.data.mailTo;
        emailParams.subject = "New qualification request";
        emailParams.template = templateDir + "qualificationRequest.html";
      }
      break;
    case globals.ACTION_UPDATE_STATO_RIC_QUAL:
      if (jsonParam.data.action != 0 && jsonParam.data.action != "0") {
        if (jsonParam.data.mailTo) {
          emailParams.service = command;
          emailParams.from = globals.SERVICE_EMAIL;
          emailParams.to = jsonParam.data.mailTo;
          emailParams.subject = "New qualification request";
          emailParams.template = templateDir + "qualificationRequest.html";
        }
      }
      break;
    case globals.ACTION_RFQ_PUBLISH:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mailTo;
      //            emailParams.to = jsonParam.data.mailList;
      emailParams.subject = "Rfq published";
      emailParams.template = templateDir + "rfqPublished.html";
      break;
    case globals.ACTION_CONFIRM_ASSIGNMENT:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mailList;
      emailParams.subject = "Rfq awarded";
      emailParams.template = templateDir + "rfqAwarded.html";
      break;
    case globals.ACTION_UPDATE_STATO_RIC_ABIL:
      if (jsonParam.data.sendMail) {
        emailParams.service = command;
        emailParams.from = globals.SERVICE_EMAIL;
        emailParams.to = jsonParam.data.MAIL;
        emailParams.username = jsonParam.data.USERNAME;
        emailParams.password = jsonParam.data.PASSWORD;
        emailParams.subject = "NGI Enterprise Web Portal Account";
        emailParams.template = templateDir + "account.html";
      }
      break;
    case globals.ACTION_SECURITY_UPLOAD_FILE:
    case globals.ACTION_SEND_NEW_ACCOUNT:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.email;
      emailParams.username = jsonParam.username;
      emailParams.password = jsonParam.password;
      emailParams.subject = "NGI Enterprise Web Portal Account";
      emailParams.template = templateDir + "account.html";
      break;
    case globals.ACTION_RESEND_CREDENTIAL:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mail;
      emailParams.subject = "Resend Credential";
      emailParams.template = templateDir + "resendCredential.html";
      break;
    case globals.ACTION_ADVANCED_STATUS_RFI:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mailList;
      emailParams.subject = "Rfi published";
      emailParams.template = templateDir + "rfiPublished.html";
      break;
    case globals.ACTION_SEND_ODA_MAIL:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.email;
      emailParams.subject = jsonParam.data.oggetto;
      emailParams.template = templateDir + "sendOdaExp.html";
      break;
    case globals.ACTION_SEND_ODA_MAIL_AGENT:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.email;
      emailParams.subject = jsonParam.data.oggetto;
      emailParams.template = templateDir + "sendOdaExpAgent.html";
      break;
    // mara
    case globals.ADVANCE_STATUS_RFP:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mailList;
      emailParams.subject = "RFP Status updated";
      emailParams.template = templateDir + "rfpStatusAdvanced.html";
      break;
    case globals.ALLEGATO4_INSERT:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mailList;
      emailParams.subject = "Allegato 4 Inserito";
      emailParams.template = templateDir + "allegato4Inserito.html";
      break;
    case globals.ADVANCE_STATUS_RFP_FASE2:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mailList;
      emailParams.subject = "Inizio rilascio RFP ";
      emailParams.template = templateDir + "rfpStatusAdvancedFase2.html";
      break;
    case globals.WORKFLOW_CREATO:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mailList;
      emailParams.subject = "Nuova RFP creata";
      emailParams.template = templateDir + "rfpCreata.html";
      break;
    case globals.RFF_RILASCIATA_EEP:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mailList;
      emailParams.subject = "Nuova RFP rilasciata su EEP";
      emailParams.template = templateDir + "rfpRilasciataEep.html";
      break;
    case globals.WORKFLOW_REMINDER:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mailList;
      emailParams.subject = "RFP in attesa di essere firmata su MARA";
      emailParams.template = templateDir + "workflowReminder.html";
      break;
    case globals.WORKFLOW_SEND_NOTE_MAIL:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mailList;
      emailParams.subject = "RFP NOTA";
      emailParams.template = templateDir + "workflowNota.html";
      break;
    case globals.WORKFLOW_EXTRATIME:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mailList;
      emailParams.subject = "RFP Richiesta EXTRA TIME";
      emailParams.template = templateDir + "workflowExtratime.html";
      break;
    case globals.RDA_NO_BUDGET:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mailList;
      emailParams.subject = "Errore RFQ/RDA per superamento Budget";
      emailParams.template = templateDir + "rdaNoBudget.html";
      break;
    case globals.RFP_DELETED:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mailList;
      emailParams.subject = "RFP Eliminata";
      emailParams.template = templateDir + "rfpDeleted.html";
      break;
    case globals.WORKFLOW_APS_CREATO:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mailList;
      emailParams.subject = "RICHIESTA APPROVAZIONE PER APS";
      emailParams.template = templateDir + "workflowApsCreato.html";
      break;
    case globals.WORKFLOW_APS_SEND_NOTE_MAIL:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mailList;
      emailParams.subject = "APS NOTA";
      emailParams.template = templateDir + "apsNota.html";
      break;
    case globals.WORKFLOW_APS_ADVANCE:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mailList;
      emailParams.subject = "Workflow APS aggiornato";
      emailParams.template = templateDir + "workflowApsUpdate.html";
      break;
    case globals.MTA_OBJECT_ASSIGNED:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mailList;
      emailParams.subject = "Oggetto assegnato in MTA";
      emailParams.template = templateDir + "mtaOggettoAssegnato.html";
      break;
    case globals.MTA_OBJECT_CONFIRMED:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mailList;
      emailParams.subject = "Oggetto assegnato accettato in MTA";
      emailParams.template = templateDir + "mtaOggettoAssegnatoRispostaOk.html";
      break;
    case globals.MTA_OBJECT_REFUSED:
      emailParams.service = command;
      emailParams.from = globals.SERVICE_EMAIL;
      emailParams.to = jsonParam.data.mailList;
      emailParams.subject = "Oggetto assegnato rifiutato in MTA";
      emailParams.template = templateDir + "mtaOggettoAssegnatoRispostaKo.html";
      break;
  }
  console.log("EmailParams : " + JSON.stringify(emailParams));

  return emailParams;
}

function sendHtmlEmail(emailEventJson, msg) {
  var jsonParam = msg;

  try {
    console.log("Swig : " + JSON.stringify(jsonParam));

    cons
      .swig(emailEventJson.template, jsonParam.data)
      .then(function (html) {
        console.log(html);
        sendEmail(emailEventJson, html);
      })
      .catch(function (err) {
        throw err;
      });
  } catch (e) {
    console.log("Exception sendHtmlEmail: " + e);
  }
}

function sendEmail(emailEventJson, mailHtml) {
  try {
    var transporter = nodemailer.createTransport(config.smtp_host);

    var mailOptions = {
      from: emailEventJson.from,
      to: emailEventJson.to,
      subject: emailEventJson.subject,
      html: mailHtml,
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("Message sent: " + JSON.stringify(error));
        return console.log(error);
      }
      console.log("Message sent: " + JSON.stringify(info));
    });
  } catch (e) {
    console.log("Exception sendEmail : " + e);
  }
}

function displayMsgReceivedFromQueue(msg) {
  console.log("Msg received from ERP queue : " + JSON.stringify(msg.data));
}
