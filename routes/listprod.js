const express = require('express');
const router = express.Router();
const sql = require('mssql');

/* Start of Handlebars helpers */
const formatPrice = (price) => {
    return `\$${Number(price).toFixed(2)}`
};

const formatAddToCartURL = (result) => {
    const spaceCode = '%20';
    let productName = result.productName.split(" ").join(spaceCode);
    return `addcart?id=${result.productId}&name=${productName}&price=${result.productPrice}`;
};

const formatProductPageURL = (productId) => {
    return `product?id=${productId}`;
};

/* End of Handlebars helpers */

router.get('/', function(req, res, next) {

    let productName = req.query.productName;
    if(productName === undefined) { // handle case equivalent to empty case
        productName = '';
    }
    let categoryName = req.query.categoryName;
    if (categoryName === undefined || categoryName === '') {
        categoryName = 'All';
    }

    let pool;
    (async function() {

        pool = await sql.connect(dbConfig);

        let sqlQuery = `
            SELECT 
                productId,
                productName,
                productPrice,
                categoryName,
                productImageURL
            FROM product
            INNER JOIN category
            ON product.categoryId = category.categoryId
            WHERE productName LIKE CONCAT('%', @prodParam, '%')
            AND (categoryName = @catParam OR @catParam = 'All')
            ORDER BY product.qtySold
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

        return [productList, categoryList];

    })().then(([productList, categoryList]) => {
        res.render('listprod', {
            title: 'DBs and Dragons Product List',
            productList: productList,
            categoryList: categoryList,
            pageActive: {'listprod': true},
            helpers: {
                formatPrice,
                formatAddToCartURL,
                formatProductPageURL
            }
        });
    }).catch((err) => {
        console.dir(err);
        res.render('error', {
            title: 'DBs and Dragons Product List',
            errorMessage: `Error, contact your admin: ${err}`,
        });
    }).finally(() => {
        pool.close();
    });

});

module.exports = router;