const express = require('express');
const router = express.Router();
const auth = require('../auth');
const sql = require('mssql');

router.post('/', function(req, res) {
    // Have to preserve async context since we make an async call
    // to the database in the validateLogin function.
    (async () => {
        let authenticatedUser = await validateLogin(req);
        if (authenticatedUser) {
            req.session.authenticatedUser = authenticatedUser;
            res.redirect("/");
        } else {
            req.session.loginMessage = "Access denied. At least one of the username or password is incorrect.";
            res.redirect("/login");
        }
     })();
});

async function validateLogin(req) {
    if (!req.body || !req.body.username || !req.body.password) {
        return false;
    }

    let username = req.body.username;
    let password = req.body.password;
    let authenticatedUser =  await (async function() {
        try {
            let pool = await sql.connect(dbConfig);
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

module.exports = router;
