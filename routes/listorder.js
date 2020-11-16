const express = require('express');
const router = express.Router();
const sql = require('mssql');
const moment = require('moment');

router.get('/', function(req, res, next) {
    res.setHeader('Content-Type', 'text/html');
    res.write('<title>DBs and Dragons Grocery Order List</title>');

    (async function() {
        try {
            let pool = await sql.connect(dbConfig);

            let sqlQuery = `
                SELECT 
                    ordersummary.orderId, 
                    orderDate,
                    customer.customerId,
                    CONCAT(customer.firstName, ' ', customer.lastName) AS customerName,
                    COALESCE(SUM(price), 0) AS total
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
            
            let dateFormatOptions = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            };

            for (let i = 0; i < results.recordset.length; i++) {
                let result = results.recordset[i];
                let formattedDate = result.orderDate.toLocaleDateString("en-US", dateFormatOptions);

                const ps = new sql.PreparedStatement(pool);
                ps.input('param', sql.Int);
                await ps.prepare(subQuery);

                let subResults = await ps.execute({param: result.orderId});
                let subResult = subResults.recordset;

                res.write(`orderId ${result.orderId} ${formattedDate} ${result.customerName} ${result.total} <br>`);

                subResults.recordset.forEach( (subResult) => {
                    res.write(`aaaaaaaaa         productId ${subResult.productId} ${subResult.quantity} ${subResult.price.toFixed(2)} <br>`);
                });

                res.write(`<br>`);

            };

        } catch(err) {
            console.dir(err);
            res.write(err)
        }
        finally {
            res.end();
        }
    })();
});

module.exports = router;
