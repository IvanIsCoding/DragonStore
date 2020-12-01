const express = require('express');
const router = express.Router();
const sql = require('mssql');
const auth = require('../auth');

/* Start of Handlebars helpers */
const formatPrice = (price) => {
    return `\$${Number(price).toFixed(2)}`
};

const formatDate = (orderDate) => {
    let dateFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
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
        res.render('customer/index', {
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

router.get('/order', checkLogin, function(req, res, next) {

    let pool;
    (async function() {
        pool = await sql.connect(dbConfig);

        let sqlQuery = `
            SELECT 
                ordersummary.orderId, 
                orderDate,
                COALESCE(SUM(price*quantity), 0) AS total
            FROM ordersummary
            INNER JOIN customer
            ON ordersummary.customerId = customer.customerId
            INNER JOIN orderproduct
            ON ordersummary.orderId = orderproduct.orderId
            WHERE customer.userid = @param
            GROUP BY 
                ordersummary.orderId, 
                orderDate
        `;

        let subQuery = `
            SELECT
                productName,
                quantity,
                price
            FROM orderproduct
            INNER JOIN product
            ON orderproduct.productId = product.productId
            WHERE orderproduct.orderId = @param
        `;

        const globalPs = new sql.PreparedStatement(pool);
        globalPs.input('param', sql.VarChar(20));
        await globalPs.prepare(sqlQuery);
        let results = await globalPs.execute({param: req.session.authenticatedUser});
        let orderListData = [];

        for (let result of results.recordset) {
            const ps = new sql.PreparedStatement(pool);
            ps.input('param', sql.Int);
            await ps.prepare(subQuery);
            let subResults = await ps.execute({param: result.orderId});
            orderListData.push({'result': result, 'subResults': subResults.recordset});
        };

        return orderListData;
    })().then((orderListData) => {
        res.render('customer/order', {
            title: 'DBs and Dragons Your Orders',
            orderListData: orderListData,
            pageActive: {'customer': true},
            helpers: {
                formatPrice,
                formatDate
            }
        });
    }).catch((err) => {
        console.dir(err);
        res.render('error', {
            title: 'DBs and Dragons Your Orders',
            errorMessage: `Error, contact your admin: ${err}`,
        });
    }).finally(() => {
        pool.close();
    });
});

module.exports = router;
