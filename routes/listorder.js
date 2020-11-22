const express = require('express');
const router = express.Router();
const sql = require('mssql');
const moment = require('moment');
const writeHeader = require('../shared_functions/header');

router.get('/', function(req, res, next) {

    writeHeader(res, `DBs and Dragons Grocery Order List`, `listorder`);

    /* Start of utilities to write orders list */
    let createProductRow = (subResult) => {
        return `
        <tr> 
            <td>${subResult.productId}</td> <td>${subResult.quantity}</td> <td>\$${subResult.price.toFixed(2)}</td> 
        </tr>
        `;
    };

    let createProducts = (subResults) => {
        return subResults.map(createProductRow).join('\n');
    };

    let createProductTable = (subResults) => {
        return `
        <tr align="right">
            <td colspan="5">
                <table border="1">
                    <th>Product Id</th> <th>Quantity</th> <th>Price</th>
                    ${createProducts(subResults)}
                </table>
            </td>
        </tr>
        `;
    };

    let createTableRow = (data) => {
        
        let result = data.result;
        
        let dateFormatOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        };
        let formattedDate = result.orderDate.toLocaleDateString("en-US", dateFormatOptions);

        return `
        <tr> 
            <td>${result.orderId}</td> <td>${formattedDate}</td> <td>${result.customerId}</td> 
            <td>${result.customerName}</td> <td>\$${result.total.toFixed(2)}</td>
            ${createProductTable(data.subResults)}
        </tr>
        `;
    };

    let createRows = (orderListData) => {
        return orderListData.map(createTableRow).join('\n');
    };

    let writeTable = (res, orderListData) => {
        res.write(
            `
            <table border=1 align="center">
                <tr> 
                    <th>Order Id</th> <th>Order Date</th> <th>Customer Id</th> <th>Customer Name</th> <th>Total Amount</th> 
                </tr>
                ${createRows(orderListData)}
            </table>
            `
        );
    };
    /* End of utilities to write orders list */

    let pool;
    (async function() {
        try {
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

            writeTable(res, orderListData);

        } catch(err) {
            console.dir(err);
            res.write(err)
        }
        finally {
            pool.close();
            res.end();
        }
    })();
});

module.exports = router;
