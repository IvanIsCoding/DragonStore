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

const formatDisplayImageURL = (productId) => {
    return `displayImage?id=${productId}`;
};
/* End of Handlebars helpers */

router.get('/', function(req, res, next) {
    
    let productId = req.query.id;

    let pool;
    (async function() {
        pool = await sql.connect(dbConfig);

        let sqlQuery = `
            SELECT
                productId,
                productName,
                productPrice,
                productImageURL,
                CASE 
                    WHEN productImage IS NOT NULL THEN 1
                    ELSE NULL
                END AS displayImage
            FROM product
            WHERE productId = @param
        `;

        const ps = new sql.PreparedStatement(pool);
        ps.input('param', sql.Int);
        await ps.prepare(sqlQuery);

        let results = await ps.execute({param: productId});
        if(results.recordset.length > 0) { // product exists in database
            let product = results.recordset[0];
            return product;
        } else {
            throw "Product not found in the database"
        }

    })().then((product) => {
        res.render('product', {
            title: 'DBs and Dragons Product Page',
            product: product,
            helpers: {
                formatPrice,
                formatAddToCartURL,
                formatDisplayImageURL
            }
        });
    }).catch((err) => {
        console.dir(err);
        res.render('error', {
            title: 'DBs and Dragons Product Page',
            errorMessage: `Error, contact your admin: ${err}`,
        });
    }).finally(() => {
        pool.close();
    });

});

module.exports = router;
