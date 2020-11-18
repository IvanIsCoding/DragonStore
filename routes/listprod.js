const express = require('express');
const router = express.Router();
const sql = require('mssql');

router.get('/', function(req, res, next) {
    res.setHeader('Content-Type', 'text/html');
    res.write("<title>DBs and Dragons Product List</title>")

    // TODO: Handle name filtering & add HTML form elements
    // Get the product name to search for
    let name = req.query.productName;
    
    /** $name now contains the search string the user entered
     Use it to build a query and print out the results. **/

    /** Create and validate connection **/

    let createProductRow = (product) => {
        let result = product.result;
        return `
        <tr>
            <td> <a href="addcart?id=${result.productId}&name=${result.productName}&price=${result.productPrice}"> Add to Cart </a> </td> 
            <td>${result.productName}</td> 
            <td>\$${result.productPrice.toFixed(2)}</td>
        </tr>
        `;
    };

    let createRows = (productList) => {
        return productList.map(createProductRow).join('\n');
    };

    let writeProducts = (res, productList) => {
        res.write(
            `
            <h2>All Products</h2>
            <table>
                <tr>
                    <th> </th> <th>Product Name</th> <th>Price</th>
                </tr>
                ${createRows(productList)}
            </table>
            `
        );
    };

    (async function() {
        try {
            let pool = await sql.connect(dbConfig);

            let sqlQuery = `
                SELECT 
                    productId,
                    productName,
                    productPrice
                FROM product
            `;

            let results = await pool.request().query(sqlQuery);
            let productList = [];

            for (let result of results.recordset) {
                productList.push({'result': result});
            };

            writeProducts(res, productList);

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
