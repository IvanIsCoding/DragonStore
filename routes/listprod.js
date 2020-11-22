const express = require('express');
const router = express.Router();
const sql = require('mssql');
const writeHeader = require('../shared_functions/header');

router.get('/', function(req, res, next) {

    writeHeader(res, `DBs and Dragons Product List`, `listprod`);

    let productName = req.query.productName;
    if(productName === undefined) { // handle case equivalent to empty case
        productName = '';
    }
    let categoryName = req.query.categoryName;
    if (categoryName === undefined || categoryName === '') {
        categoryName = 'All';
    }

    /* Start of utilities to write product list */

    let createSingleOption = (category) => {
        return `<option>${category}</option>`
    };

    let createOptions = (categoryList) => {
        return categoryList.map(createSingleOption).join('\n');
    };

    let createForm = (categoryList) => {
        return `
            <h1> Search products: </h1>
            <form method="get" action="listprod">
            
                <select size="1" name="categoryName">
                    ${createOptions(categoryList)}      
                </select>

                <input type="text" name="productName" size="40">
                <input type="submit" value="Search"> <input type="reset" value="Clear">
            </form>

        `;
    };

    let createProductRow = (product) => {
        let result = product.result;
        return `
        <tr>
            <td> <a href="addcart?id=${result.productId}&name=${result.productName}&price=${result.productPrice}"> Add to Cart </a> </td> 
            <td>${result.productName}</td>
            <td>${result.categoryName}</td>
            <td>\$${result.productPrice.toFixed(2)}</td>
        </tr>
        `;
    };

    let createRows = (productList) => {
        return productList.map(createProductRow).join('\n');
    };

    let writeProducts = (res, productList, categoryList) => {
        res.write(
            `
            ${createForm(categoryList)}

            <h2>All Products</h2>
            <table class="dragon-table" >
                <thead>
                    <tr>
                        <th> </th> <th>Product Name</th> <th> Category </th> <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${createRows(productList)}
                </tbody>
            </table>
            `
        );
    };
    /* End of utilities to write product list */

    let pool;
    (async function() {
        try {
            pool = await sql.connect(dbConfig);

            let sqlQuery = `
                SELECT 
                    productId,
                    productName,
                    productPrice,
                    categoryName
                FROM product
                INNER JOIN category
                ON product.categoryId = category.categoryId
                WHERE productName LIKE CONCAT('%', @prodParam, '%')
                AND (categoryName = @catParam OR @catParam = 'All')
            `;

            let categoryQuery = `
                SELECT categoryName
                FROM category
                ORDER BY categoryName ASC
            `;

            const ps = new sql.PreparedStatement(pool);
            ps.input('prodParam', sql.VarChar(40));
            ps.input('catParam', sql.VarChar(50));
            await ps.prepare(sqlQuery);

            let results = await ps.execute({prodParam: productName, catParam: categoryName});
            let productList = [];

            for (let result of results.recordset) {
                productList.push({'result': result});
            };

            let categoryList = ["All"];
            let categoryResults = await pool.request().query(categoryQuery);
            for (let categoryResult of categoryResults.recordset) {
                categoryList.push(categoryResult.categoryName);
            }

            writeProducts(res, productList, categoryList);

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
