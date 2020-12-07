const express = require('express');
const router = express.Router();
const auth = require('../auth');
const sql = require('mssql');
const cartManager = require('../models/cart_manager');

router.post('/', function(req, res) {
    // Have to preserve async context since we make an async call
    // to the database in the validateLogin function.
    let pool;
    (async () => {
        pool = await sql.connect(dbConfig);
        let authenticatedUser = await validateLogin(req, pool);
        if (authenticatedUser) {
            req.session.authenticatedUser = authenticatedUser;
            req.session.isAdmin = await checkAdminUser(req, pool);
            await cartManager.loadCart(req.session, pool)
            res.redirect("/");
        } else {
            req.session.loginMessage = "Access denied. At least one of the username or password is incorrect.";
            res.redirect("/login");
        }
     })().then( () => {
         pool.close();
     });
});

async function validateLogin(req, pool) {
    if (!req.body || !req.body.username || !req.body.password) {
        return false;
    }

    let username = req.body.username;
    let password = req.body.password;
    let authenticatedUser =  await (async function() {
        try {
            let dbPassword = false;

            let sqlQuery = `
                SELECT 
                    password
                FROM customer
                WHERE userid = @param;
            `;

            const ps = new sql.PreparedStatement(pool);
            ps.input('param', sql.VarChar(20));
            await ps.prepare(sqlQuery);

            let results = await ps.execute({param: username});
            if(results.recordset.length > 0) { // userid exists in database
                let result = results.recordset[0];
                dbPassword = result.password;
            }

            if(dbPassword && password && dbPassword === password) {
                return username;
            } else{
                return false;
            }
        } catch(err) {
            console.dir(err);
            return false;
        }
    })();

    return authenticatedUser;
}

async function checkAdminUser(req, pool) {
    try {

        if (!req.body || !req.body.username || !req.body.password) {
            return false;
        }

        let username = req.body.username;

        let sqlQuery = `
            SELECT 
                dragonadmin.userid AS userid
            FROM customer
            INNER JOIN dragonadmin
            ON customer.userid = dragonadmin.userid
            WHERE customer.userid = @param;
        `;

        const ps = new sql.PreparedStatement(pool);
        ps.input('param', sql.VarChar(20));
        await ps.prepare(sqlQuery);

        let results = await ps.execute({param: username});
        if(results.recordset.length > 0) { // userid exists in database
            return true;
        }

        return false;
    } catch (err) {
        console.dir(err);
        return false;
    }
}

module.exports = router;
