const express = require('express');
const router = express.Router();
const sql = require('mssql');
const validation = require('../models/validation');


router.get('/', function(req, res, next) {

    let username = req.session.authenticatedUser;
    
    if (username) {
    	res.render('error', {
            title: 'DBs and Dragons Your Orders',
            errorMessage: `You cannot create an user account - you are already logged in!`,
        });
    }
    else {
	    res.render('createuser/index', {
	        title: 'DBs and Dragons Create User Account Page',
            userWarning: req.session.createUserWarning,
	        pageActive: {'createuser': true},
	    });

        if (req.session.createUserWarning) {
            delete req.session.createUserWarning;
        }

    }
});

router.post('/validate', function(req, res, next) {

    let body = req.body;

    if(!validation.validatePasswordMatch(body.password, req.body.confirmpassword)) {
        req.session.createUserWarning = "Error: your password confirmation does not match";
        res.redirect(`/createuser`);
        return;
    }

    if(!validation.validateEmail(body.email)){
        req.session.createUserWarning = "Error: Invalid email address";
        res.redirect(`/createuser`);
        return;
    }

    if(!validation.validatePhoneNumber(body.phonenumber)){
        req.session.createUserWarning = "Error: Invalid Phone Number";
        res.redirect(`/createuser`);
        return;
    }

    if(!validation.validatePostalCode(body.postalcode)){
        req.session.createUserWarning = "Error: Invalid Postal Code";
        res.redirect(`/createuser`);
        return;
    }

    if(!validation.validateCountry(body.country)){
        req.session.createUserWarning = "Error: We do not offer services in your country";
        res.redirect(`/createuser`);
        return;
    }

    if(!validation.validateProvince(body.country, body.province)){
        req.session.createUserWarning = "Error: We do not offer services in your province or state";
        res.redirect(`/createuser`);
        return;
    }

    let pool;
    (async function() {
        pool = await sql.connect(dbConfig);

        if (!(await validation.validateUserid(pool, body.userid))) {
            req.session.createUserWarning = "Error: Username already exists; pick a new username";
        }

        if (req.session.createUserWarning) { // user warning exists, something is invalid and user shouldn't be created
            return;
        }

        let insertQuery = `
        	INSERT INTO customer (
        		userid, email, firstName, lastName, phonenum, 
        		address, country, state, city, postalCode, password
        	)
        	VALUES (
        		@userid, @email, @firstname, @lastname, @phonenumber, 
        		@address, @country, @province, @city, @postalcode, @password
        	);
        	SELECT SCOPE_IDENTITY() AS customerId;
        `;

        // Create prepared statement     
        const ps = new sql.PreparedStatement(pool);
        ps.input('userid', sql.VarChar);
        ps.input('email', sql.VarChar);
        ps.input('firstname', sql.VarChar);
        ps.input('lastname', sql.VarChar);
        ps.input('phonenumber', sql.VarChar);
        ps.input('address', sql.VarChar);
        ps.input('country', sql.VarChar);
        ps.input('province', sql.VarChar);
        ps.input('city', sql.VarChar);
        ps.input('postalcode', sql.VarChar);
        ps.input('password', sql.VarChar);

        await ps.prepare(insertQuery);

        let insertionResults = await ps.execute(req.body);
        let customerId = insertionResults.recordset[0].customerId;

        return customerId;

    })().then((customerId) => {

        if (req.session.createUserWarning) {
            res.redirect(`/createuser`);
        }

        res.render('createuser/success', {
            title: 'DBs and Dragons User Account has Been Created',
            pageActive: {'create': true},
            customerId: customerId
        });
    }).catch((err) => {
        console.dir(err);
        res.render('error', {
            title: 'DBs and Dragons Create User Account Page',
            errorMessage: `Error, contact your admin: ${err}`,
        });
    }).finally(() => {
        pool.close();
    });
});

module.exports = router;
