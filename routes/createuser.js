const express = require('express');
const router = express.Router();
const sql = require('mssql');

/* Start of back-end validator functions */
const validatePasswordMatch = (password1, password2) => {
    return password1 === password2;
};

const validateUserid = () => {
    return true;
};

const validatePhoneNumber = (phoneNumber, optional=true) => {
    if(phoneNumber === '' || phoneNumber === null || phoneNumber === undefined) {
        return optional;
    }
    const matchedValue = phoneNumber.match(/^[+]?[\s./0-9]*[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/g);
    return !!phoneNumber;
}

const validatePostalCode = (postalCode) => {
    const matchedValue = postalCode.match(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/);
    return !!matchedValue;
}

const validateEmail = (email) => {
    const matchedValue = email.match(/^\S+@\S+$/);
    return !!matchedValue;
};
/* End of back-end validator functions */

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
	console.log(req.body);

    if(!validatePasswordMatch(body.password, req.body.confirmpassword)) {
        req.session.createUserWarning = "Error: your password confirmation does not match";
        res.redirect(`/createuser`);
        return;
    }

    if(!validateEmail(body.email)){
        req.session.createUserWarning = "Error: Invalid email address";
        res.redirect(`/createuser`);
        return;
    }

    if(!validatePhoneNumber(body.phonenumber)){
        req.session.createUserWarning = "Error: Invalid Phone Number";
        res.redirect(`/createuser`);
        return;
    }

    if(!validatePostalCode(body.postalcode)){
        req.session.createUserWarning = "Error: Invalid Postal Code";
        res.redirect(`/createuser`);
        return;
    }

    let pool;
    (async function() {
        pool = await sql.connect(dbConfig);

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
