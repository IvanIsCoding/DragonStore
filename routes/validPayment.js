const express = require('express');
const router = express.Router();
const auth = require('../auth');
const sql = require('mssql');
const validate = require('../models/validation');

router.post('/', function(req, res, next) {
    let body = req.body;

    valid = true
    if(!validate.validatePaymentMethod(body.paymentMethod)){
        console.log("bad method")
        valid=false;
    }
    if(!validate.validateCardNumber(body.paymentNumber)){
        console.log("bad number")
        valid=false;
    }
    if(!validate.validatePaymentType(body.paymentType)){
        console.log("bad type")
        valid=false;
    }
    if(!validate.validateExpiryDate(body.expiryDate)){
        console.log("bad date")
        valid=false;
    }
    if(!req.session.shipmentInfo){ // got here without getting shipment info first?
        valid=false;
    }
    
    if(!valid){
        res.render('inputPayment',{
            invalidPayment: true
        });
        return;
    }else{
        paymentInfo = {
            paymentMethod: body.paymentMethod,
            paymentType:body.paymentType,
            paymentNumber:body.paymentNumber,
            expiryDate:body.expiryDate
        }
        // Save payment information in a sessional variable (this is a horrible idea)
        req.session.paymentInfo = paymentInfo; 
        res.redirect('/order')
    }

});

module.exports = router;