const express = require('express');
const router = express.Router();
const sql = require('mssql');
const auth = require('../auth');

// Authenticates that user has logged in previously
function checkLogin(req, res, next) {
    if (req.session.authenticatedUser) {
        next();
    }
    else { // Your password is invalid, send you back to checkout
        req.session.loginMessage = "Access denied to the Customer page. Log in with your credentials first.";
        res.redirect("/login");
    }
}

router.get('/', checkLogin, function(req, res, next) {

    let username = req.session.authenticatedUser;
    let pool;
    (async function() {
        pool = await sql.connect(dbConfig);

        let sqlQuery = `
            SELECT
                customerId,
                firstName,
                lastName,
                email,
                phonenum,
                address,
                city,
                state,
                postalCode,
                country,
                userid
            FROM customer
            WHERE userid = @param
        `;

        const ps = new sql.PreparedStatement(pool);
        ps.input('param', sql.VarChar(20));
        await ps.prepare(sqlQuery);

        let results = await ps.execute({param: username});
        let data = results.recordset[0];

        return [
            {keyname: "Id", keyval: data.customerId},
            {keyname: "First Name", keyval: data.firstName},
            {keyname: "Last Name", keyval: data.lastName},
            {keyname: "Email", keyval: data.email},
            {keyname: "Phone Number", keyval: data.phonenum},
            {keyname: "Address", keyval: data.address},
            {keyname: "City", keyval: data.city},
            {keyname: "State", keyval: data.state},
            {keyname: "Country", keyval: data.country},
            {keyname: "User Id", keyval: data.userid},
        ];

    })().then((userData) => {
        console.log(userData);
        res.render('customer', {
            title: 'DBs and Dragons Customer Page',
            pageActive: {'customer': true},
            userData: userData,
            helpers: {
            }
        });
    }).catch((err) => {
        console.dir(err);
        res.render('error', {
            title: 'DBs and Dragons Customer Page',
            errorMessage: `Error, contact your admin: ${err}`,
        });
    }).finally(() => {
        pool.close();
    });
    
});

module.exports = router;
