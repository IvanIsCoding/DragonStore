const nodemailer = require("nodemailer");

const TEST_TOGGLE = true;

/* Star of SMTP Settings */
const getHost = () => {
    if (TEST_TOGGLE) {
        return "smtp.ethereal.email";
    } else {
        return "smtp.gmail.com";
    }
};

const getPort = () => {
    if (TEST_TOGGLE) {
        return 587;
    } else {
        return 465;
    }
};

const getAccount = async () => {
    let account = null;
    if (TEST_TOGGLE) { // Generate test account from ethereal.email
        account = await nodemailer.createTestAccount();
    } else {
        account = {
            user: 'noReplyDragonstore@gmail.com',
            pass: 'verySecurePassword',
        }
    };
    return account;
};

const getTransporter = (account) => {
    return nodemailer.createTransport({
        host: getHost(),
        port: getPort(),
        secure: false,
        auth: {
            user: account.user,
            pass: account.pass,
        },
    });
};
/* End of SMTP Settings */

const sendResetEmail = async () => {
    try {

        let account = await getAccount();

        // create SMTP transport
        let transporter = getTransporter(account);

        // send email
        let info = await transporter.sendMail({
            from: '"DBs and Dragons 👻" <no-reploy@dragonstore.hopto.org>', // sender address
            to: "useremail@example.com", // list of receivers
            subject: "Password Reset ✔", // Subject line
            text: "Hello world?", // plain text body
            html: "<b>Hello world?</b>", // html body
        });
        
        // Get message URL if sent from an Ethereal account
        let messageUrl = null;
        if (TEST_TOGGLE) {
            messageUrl = nodemailer.getTestMessageUrl(info);
        }

        return {
            "status": "success",
            "displayMessage": "A message with the instructions to reset your password was sent to your email",
            "messageUrl": messageUrl,
        }

    } catch(err) {
        return {
            "status": "fail",
            "displayMessage": "An error occured when sending the email. Try again.",
        };
    };

};

module.exports = {
    sendResetEmail
};