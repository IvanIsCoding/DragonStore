const express = require('express');
const router = express.Router();
const auth = require('../auth');
const sql = require('mssql');

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


        let sqlReviewQuery = `
        SELECT
            reviewId,
            reviewRating,
            reviewDate,
            customerId,
            productId,
            reviewComment
        FROM review
        WHERE productId = @pid
    `;
    const ps = new sql.PreparedStatement(pool);
    ps.input('param', sql.Int);
    await ps.prepare(sqlQuery);

    let results = await ps.execute({param: productId});

    const psReview = new sql.PreparedStatement(pool);
    psReview.input('pid', sql.Int);
    await psReview.prepare(sqlReviewQuery);

    let reviewResults = await psReview.execute({param: productId});

    if(reviewResults.recordset.length > 0){
        let review = reviewResults.recordset;
        return review;
    }
    else if(reviewResults.recordset.length === 0){
        throw "No review"
    }

    if(results.recordset.length > 0) { // product exists in database
        let product = results.recordset[0];
        return product;
    } else {
         throw "Product not found in the database"
    }


    })().then(([product, reviews]) => {
        res.render('product', {
            title: 'DBs and Dragons Product Page',
            product: product,
            reviews: reviews,
            helpers: {
                formatPrice,
                formatAddToCartURL,
                formatDisplayImageURL,
                formatReviewPageURL
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