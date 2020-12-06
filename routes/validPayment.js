const express = require('express');
const router = express.Router();
const auth = require('../auth');
const sql = require('mssql');

router.get('/', checkLogin, function(req, res, next) {
    let body = req.body;
    valid = true
    
    if(!valid){
        res.render('inputPayment',{
            'authenticated': false
        });
    }else{
        paymentInfo = {
            paymentMethod: body.paymentMethod,
            paymentType:body.paymentType,
            paymentNumber:body.paymentNumber,
            expiryDate:body.expiryDate
        }
        // Save payment information in a sessional variable (this is a horrible idea)
        req.session.paymentInfo = paymentInfo; 
        //res.redirect('/order')
    }

});

module.exports = router;