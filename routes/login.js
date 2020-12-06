const express = require('express');
const router = express.Router();
const mail = require('../models/mail');

router.get('/', function(req, res, next) {
    res.setHeader('Content-Type', 'text/html');
    // Set the message for the login, if present
    let loginMessage = false;
    if (req.session.loginMessage) {
        loginMessage = req.session.loginMessage;
        req.session.loginMessage = false;
    }

    res.render('login/index', {
        title: "Login Screen",
        loginMessage: loginMessage
    });
});

router.get('/forgotpass', function(req, res, next) {
    
    res.render('login/forgotpass', {
        title: "Forgot Password Form",
    });

});

router.post('/sendresetemail', function(req, res, next) {

    let body = req.body;
    let userId = body.userId;
    if (!userId) { // no userId in post, send 
        res.redirect('/login');
        return;
    }
    console.log(body);
    
    (async function() {
        let mailResult = await mail.sendResetEmail();
        return mailResult;
    })().then((mailResult) => {
        res.render('login/sendconfirmation', {
            title: "Password Reset Email Confirmation",
            mailResult: mailResult
        });
    }).catch((err) => {
        console.dir(err);
        res.render('error', {
            title: 'Send Reset Email',
            errorMessage: `${err}`,
        });
    });

});

module.exports = router;
