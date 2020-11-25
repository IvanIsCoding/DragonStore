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
    
    let pool;
    (async function() {
        pool = await sql.connect(dbConfig);
        throw "This page has not been implemented yet";

    	// Get product name to search for
    	// TODO: Retrieve and display info for the product

    	// TODO: If there is a productImageURL, display using IMG tag

    	// TODO: Retrieve any image stored directly in database. Note: Call displayImage.jsp with product id as parameter.

    	// TODO: Add links to Add to Cart and Continue Shopping
    })().then(() => {
        res.render('product', {
            title: 'DBs and Dragons Product Page',
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
