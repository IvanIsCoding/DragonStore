const express = require('express');
const router = express.Router();
const sql = require('mssql');

/* Start of Handlebars helpers */
const formatPrice = (price) => {
    return `\$${Number(price).toFixed(2)}`
};

const formatDate = (orderDate) => {
    let dateFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
    };
    let formattedDate = orderDate.toLocaleDateString("en-US", dateFormatOptions);
    return formattedDate;
};

const formatAddToCartURL = (result) => {
    const spaceCode = '%20';
    let productName = result.productName.split(" ").join(spaceCode);
    return `addcart?id=${result.productId}&name=${productName}&price=${result.productPrice}`;
};

const formatDisplayImageURL = (productId) => {
    return `displayImage?id=${productId}`;
};

const formatReviewPageURL = (productId) => {
    return `review?id=${productId}`;
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
                productDesc,
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
            review.customerId,
            productId,
            reviewComment,
            firstName
        FROM review
        INNER JOIN customer
        ON review.customerId = customer.customerId
        WHERE productId = @pid
        `;
    const ps = new sql.PreparedStatement(pool);
    ps.input('param', sql.Int);
    await ps.prepare(sqlQuery);

    let results = await ps.execute({param: productId});

    const psReview = new sql.PreparedStatement(pool);
    psReview.input('pid', sql.Int);
    await psReview.prepare(sqlReviewQuery);

    let reviewResults = await psReview.execute({pid: productId});

    if(reviewResults.recordset.length > 0 && results.recordset.length > 0){
        let review = reviewResults.recordset;
        let product = results.recordset[0];
        console.log(review)
        return [product, review];
    }
    else if(results.recordset.length > 0 && reviewResults.recordset.length === 0){
        let product = results.recordset[0];
        console.log("review empty")
        return [product, {}];
    }
    else{
        throw "Product not found in the database"
    }

    })().then(([product, reviews]) => {
            res.render('product', {
                title: 'DBs and Dragons Product Page',
                product: product,
                reviews: reviews,
                helpers: {
                    formatPrice,
                    formatDate,
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
