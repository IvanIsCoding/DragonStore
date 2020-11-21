const express = require('express');
const router = express.Router();
const sql = require('mssql');

router.use(express.urlencoded({extended: true}));

router.post('/', function(req, res, next) {
    res.setHeader('Content-Type', 'text/html');

    let body = req.body;
    let reqCustomerId = false;
    let reqPassword = false;
    if (body.customerId && body.password) {
    	reqCustomerId = Number(body.customerId);
    	reqPassword = body.password;
    }

    let dbPassword = false;

    (async function() {
        try {

            let sqlQuery = `
                SELECT 
                    password
                FROM customer
                WHERE customerId = @param;
            `;

            if(Number.isInteger(reqCustomerId)){ // avoid SQL error because of casting invalid int
            	let pool = await sql.connect(dbConfig);
            	const ps = new sql.PreparedStatement(pool);
            	ps.input('param', sql.Int);
            	await ps.prepare(sqlQuery);

            	let results = await ps.execute({param: reqCustomerId});
            	if(results.recordset.length > 0) { // customer exists in database
            		let result = results.recordset[0];
            		dbPassword = result.password;
            	}
        	}

        } catch(err) {
            console.dir(err);
        }
    })().then(() => {
    	if (reqPassword && dbPassword && dbPassword === reqPassword) {
    		req.session.authentication = {
    			'customerId': reqCustomerId,
    			'authenticated': true
    		};
    		res.redirect(`/order`);
	    } else {
	    	req.session.invalidPassword = true;
	    	res.redirect("/checkout");
	    }
    });
  
});

router.get('/', function(req, res, next) { // get is not allowed, just redirect with invalid password
    res.setHeader('Content-Type', 'text/html');

    req.session.invalidPassword = true;
    res.redirect("/checkout");
});

module.exports = router;
