// Action name
exports.ACTION_UPDATE_ASN = "updateAsn";
exports.ACTION_INSERT_ASN = "insertAsn";
exports.ACTION_DELETE_ASN = "deleteAsn";
exports.ACTION_DELETE_ASN_LINES = "deleteAsnLines";
exports.ACTION_ADVANCED_STATUS_ASN = "advancedStatusAsn";
exports.ACTION_LOGIN = "login";
exports.ACTION_GENERATE_OTP = "generateOtp";
exports.ACTION_UPDATE_READ_STATUS_CHAT = "updateReadStatusChat";
exports.ACTION_INSERT_CHAT = "insertChat";
exports.ACTION_UPDATE_INVOICE = "updateInvoice";
exports.ACTION_INSERT_INVOICE = "insertInvoice";
exports.ACTION_DELETE_INVOICE = "deleteInvoice";
exports.ACTION_INSERT_INVOICES_LINES = "insertInvoicesLines";
exports.ACTION_DELETE_INVOICES_LINES = "deleteInvoiceLines";
exports.ACTION_ADVANCED_STATUS_INVOICE = "advancedStatusInvoice";
exports.ACTION_INSERT_SAL_ODA = "insertSalOda";
exports.ACTION_DELETE_SAL_ODA = "deleteSalOda";
exports.ACTION_CREATE_RFI = "createRfi";
exports.ACTION_DELETE_RFI = "deleteRfi";
exports.ACTION_DELETE_SUPPLIERS_RFI = "deleteSuppliersRfi";
exports.ACTION_ADVANCED_STATUS_RFI = "advancedStatusRfi";
exports.ACTION_UPDATE_RFQ = "updateRFQ";
exports.ACTION_INSERT_RFQ = "insertRFQ";
exports.ACTION_DELETE_RFQ = "deleteRFQ";
exports.ACTION_DELETE_RFQ_LINES = "deleteRFQLines";
exports.ACTION_INSERT_RFQ_SUPPLIER = "insertRfqSupplier";
exports.ACTION_DELETE_RFQ_SUPPLIER = "deleteRfqSupplier";
exports.ACTION_RFQ_PUBLISH = "rfqPublish";
exports.ACTION_ADVANCED_STATUS_RFQ = "advancedStatusRFQ";
exports.ACTION_INSERT_BID = "insertBid";
exports.ACTION_UPDATE_BID = "updateBid";
exports.ACTION_DELETE_BID = "deleteBid";
exports.ACTION_BID_PUBLISH = "bidPublish";
exports.ACTION_ASSIGN_SUPPLIER = "assignSupplier";
exports.ACTION_ASSIGN_ALL_SUPPLIER = "assignAllSupplier";
exports.ACTION_CONFIRM_ASSIGNMENT = "confirmAssignment";
exports.ACTION_CHANGE_PASSWORD = "changePassword";
exports.ACTION_INSERT_USER = "insertUser";
exports.ACTION_UPDATE_USER = "updateUser";
exports.ACTION_DELETE_USER = "deleteUser";
exports.ACTION_UPDATE_USER_STATUS = "updateUserStatus";
exports.ACTION_INSERT_C_GOODS_REQ = "insertCGoodsRequest";
exports.ACTION_UPDATE_STATUS_C_GOODS_REQ = "updateStatusCGoodsRequest";
exports.ACTION_INSERT_RIC_ABILITAZIONE = "insertRichiestaAbilitazione";
exports.ACTION_UPDATE_STATO_RIC_ABIL = "updateStatoRichiestaAbilitazione";
exports.ACTION_UPDATE_RIC_QUALIFICA = "updateRichiestaQualificazione";
exports.ACTION_INSERT_RIC_QUALIFICA = "insertRichiestaQualificazione";
exports.ACTION_UPDATE_STATO_RIC_QUAL = "updateStatoRichiestaQualificazione";
exports.ACTION_DELETE_RIC_QUALIFICA = "deleteRichiestaQualificazione";
exports.ACTION_INSERT_TC = "insertTC";
exports.ACTION_ACCEPT_TC = "acceptTC";
exports.ACTION_NOTIFY_COMPANY_CREDENTIAL = "notifyCompanyCredentials";
exports.ACTION_UPDATE_COMPANY = "updateCompany";
exports.ACTION_SEND_NEW_ACCOUNT = "sendNewAccount";
exports.ACTION_SECURITY_UPLOAD_FILE = "securityUploadFile";
exports.ACTION_SEND_COMPANY_CREDENTIAL = "sendCompanyCredential";
exports.ACTION_QUALIFICATION_RENEWAL = "rinnovoQualificazione";
exports.ACTION_UPDATE_STATUS_ODA = "updateStatusOda";
exports.ACTION_RESEND_CREDENTIAL = "resendCredential";
exports.ACTION_SEND_ODA_MAIL = "sendOdaMail";
exports.ACTION_SEND_ODA_MAIL_AGENT = "sendOdaMailAgent";
// Service email
exports.SERVICE_EMAIL = "it_service@northropgrumman.it";

//MARA
exports.ADVANCE_STATUS_RFP = "updateWorkflow";
exports.ADVANCE_STATUS_RFP_FASE2 = "updateWorkflowFaseDue";
exports.ALLEGATO4_INSERT = "insertAllegato4";
exports.WORKFLOW_CREATO = "creazioneWorkflow";
exports.RFF_RILASCIATA_EEP = "rfpRilasciataEep";
exports.WORKFLOW_REMINDER = "workflowReminder";
exports.RDA_NO_BUDGET = "rdaNoBudget";
exports.RFP_DELETED = "rfpDeleted";

exports.UPDATE_WF_EMENDAMENTO = "updateWorkflowEmendamento";
exports.FINE_WF_EMENDAMENTO_ELIMINAZIONE = "wfEliminazioneEmendamentoFinito";
exports.FINE_WF_EMENDAMENTO_MODIFICA = "wfModificaEmendamentoFinito";
exports.CREAZIONE_WF_EMENDAMENTO_ELIMINAZIONE = "workflowEmendamentoEliminazioneCreato";
exports.CREAZIONE_WF_EMENDAMENTO_MODIFICA = "workflowEmendamentoModificaCreato";


exports.WORKFLOW_SEND_NOTE_MAIL = "sendNoteByMailWorkflow";
exports.WORKFLOW_EXTRATIME = "extraTimeWorkflow";

exports.WORKFLOW_APS_CREATO = "creazioneWorkflowAps";
exports.WORKFLOW_APS_SEND_NOTE_MAIL = "sendNoteByMailWorkflowAps";
exports.WORKFLOW_APS_ADVANCE = "updateWorkflowAps";

exports.MTA_OBJECT_ASSIGNED = "ASSIGNEMENT";
exports.MTA_OBJECT_CONFIRMED = "TAKING CHARGE OK";
exports.MTA_OBJECT_REFUSED = "TAKING CHARGE KO";
