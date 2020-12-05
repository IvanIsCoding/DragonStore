const express = require('express');
const router = express.Router();
const auth = require('../auth');
const sql = require('mssql');

/* Start of Handlebars helpers */
const formatPrice = (price) => {
    return `\$${Number(price).toFixed(2)}`
};

const formatDate = (orderDate) => {
    let dateFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
    };
    let formattedDate = orderDate.toLocaleDateString("en-US", dateFormatOptions);
    return formattedDate;
};
/* End of Handlebars helpers */

// Authenticates that user has logged in previously
function checkLogin(req, res, next) {
    if (req.session.authenticatedUser) {
        next();
    }
    else { // Your password is invalid, send you back to checkout
        req.session.loginMessage = "Access denied to the Admin page. Log in with your credentials first.";
        res.redirect("/login");
    }
}

router.get('/', checkLogin, function(req, res, next) {
	
    let pool;
    (async function() {
        pool = await sql.connect(dbConfig);

        let sqlQuery = `
            SELECT
                CAST(orderDate AS DATE) AS groupDate,
                COALESCE(SUM(totalAmount), 0) AS totalOrderAmount
            FROM ordersummary
            GROUP BY CAST(orderDate AS DATE)
            ORDER BY CAST(orderDate AS DATE) DESC;
        `;

        let sqlCustomerQuery = `
            SELECT firstname, lastname, COUNT(orderId) AS TotalOrder
            FROM customer JOIN ordersummary ON customer.customerId = ordersummary.customerId
            GROUP BY firstname, lastname
        `

        const psCus = new sql.PreparedStatement(pool);
        await psCus.prepare(sqlCustomerQuery);
        let Cusresults = await psCus.execute();

        let results = await pool.request().query(sqlQuery);

        return [results.recordset, Cusresults.recordset];
        })().then(([salesData, Customer]) => {
        res.render('admin', {
            title: 'DBs and Dragons Admin Page',
            salesData: salesData,
            Customer: Customer,
            pageActive: {'order': true},
            helpers: {
                formatPrice,

                formatDate
            }
        });
    }).catch((err) => {
        console.dir(err);
        res.render('error', {
            title: 'DBs and Dragons Admin Page',
            errorMessage: `Error, contact your admin: ${err}`,
        });
    }).finally(() => {
        pool.close();
    });

});

module.exports = router;