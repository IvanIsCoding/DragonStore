const express = require('express');
const router = express.Router();
const sql = require('mssql');

router.get('/', function(req, res, next) {
    
    res.setHeader('Content-Type', 'text/html');
    res.write("<title>DBs and Dragons Product List</title>")
    res.write(
        `
        <h1> Search products: </h1>
        <form method="get" action="listprod">
            <input type="text" name="productName" size="40">
            <input type="submit" value="Search"> <input type="reset" value="Clear">
        </form>
        `
    );


    let name = req.query.productName;
    if(name === undefined) { // handle case equivalent to empty case
        name = '';
    }

    /* Start of utilities to write product list */
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
    /* End of utilities to write product list */

    (async function() {
        try {
            let pool = await sql.connect(dbConfig);

            let sqlQuery = `
                SELECT 
                    productId,
                    productName,
                    productPrice
                FROM product
                WHERE productName LIKE CONCAT('%', @param, '%')
            `;

            const ps = new sql.PreparedStatement(pool);
            ps.input('param', sql.VarChar(40));
            await ps.prepare(sqlQuery);

            let results = await ps.execute({param: name});
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
