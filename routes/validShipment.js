const express = require('express');
const router = express.Router();
const auth = require('../auth');
const sql = require('mssql');
const validate = require('../models/validation');

router.post('/', function(req, res, next) {
    let body = req.body;
    valid = true
    if(!validate.validateCountry(body.country)){
        // console.log("bad country")
        valid=false;
    }
    if(!validate.validateProvince(body.country, body.state)){
        // console.log("bad state")
        valid=false;
    }
    if(!validate.validatePostalCode(body.postalCode)){
        // console.log("bad postal code")
        valid=false;
    }
    if(!validate.notEmpty(body.city)){
        // console.log("bad city")
        valid=false;
    }
    if(!validate.notEmpty(body.address)){
        // console.log("bad address")
        valid=false;
    }
    
    // Not authenticating city or address to real locations (way out of project scope)
    if(!valid){
        res.render('inputShipment',{
            invalidShipmentInfo: true
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
        res.render('inputPayment',{
            invalidPayment: false
        })
    }

});

module.exports = router;