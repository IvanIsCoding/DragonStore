const express = require('express');
const router = express.Router();
const auth = require('../auth');
const sql = require('mssql');

router.get('/', checkLogin, function(req, res, next) {
    let body = req.body;
    valid = true
    
    if(!valid){
        res.render('inputShipment',{
            'authenticated': false
        });
        return;
    }else{
        shipmentInfo = {
            country: body.country,
            postalCode:body.postalCode,
            state:body.state,
            city:body.city,
            address:body.address
        }
        // Save payment information in a sessional variable (this is a horrible idea)
        req.session.shipmentInfo = shipmentInfo; 
        //res.render('inputPayment'{})
    }

});

module.exports = router;