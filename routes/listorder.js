const express = require('express');
const router = express.Router();
const sql = require('mssql');
const moment = require('moment');

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
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    };
    let formattedDate = orderDate.toLocaleDateString("en-US", dateFormatOptions);
    return formattedDate;
};
/* End of Handlebars helpers */

router.get('/', function(req, res, next) {

    let pool;
    (async function() {
        pool = await sql.connect(dbConfig);

        let sqlQuery = `
            SELECT 
                ordersummary.orderId, 
                orderDate,
                customer.customerId,
                CONCAT(customer.firstName, ' ', customer.lastName) AS customerName,
                COALESCE(SUM(price*quantity), 0) AS total
            FROM ordersummary
            INNER JOIN customer
            ON ordersummary.customerId = customer.customerId
            INNER JOIN orderproduct
            ON ordersummary.orderId = orderproduct.orderId
            GROUP BY 
                ordersummary.orderId, 
                orderDate, customer.customerId, 
                CONCAT(customer.firstName, ' ', customer.lastName)
        `;

        let subQuery = `
            SELECT
                productId,
                quantity,
                price
            FROM orderproduct
            WHERE orderId = @param
        `;

        let results = await pool.request().query(sqlQuery);
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
        res.render('listorder', {
            title: 'DBs and Dragons Grocery Order List',
            orderListData: orderListData,
            pageActive: {'listorder': true},
            helpers: {
                formatPrice,
                formatDate
            }
        });
    }).catch((err) => {
        console.dir(err);
        res.render('error', {
            title: 'DBs and Dragons Grocery Order List',
            errorMessage: `Error, contact your admin: ${err}`,
        });
    }).finally(() => {
        pool.close();
    });
});

module.exports = router;
