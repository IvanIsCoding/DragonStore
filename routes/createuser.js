const express = require('express');
const router = express.Router();
const sql = require('mssql');

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
	        pageActive: {'createuser': true},
	    });
    }
});

router.post('/validate', function(req, res, next) {

	console.log(req.body);

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
        	SELECT SCOPE_IDENTITY() AS id;
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

    })().then(() => {
        res.render('createuser/success', {
            title: 'DBs and Dragons User Account has Been Created',
            pageActive: {'create': true},
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
