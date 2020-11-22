const express = require('express');
const router = express.Router();
const writeHeader = require('../shared_functions/header');

/* Start of Handlebars helpers */
const formatPrice = (price) => {
    return `\$${Number(price).toFixed(2)}`
};

const formatMultiplicationPrice = (product) => {
    return `\$${(Number(product.price)*Number(product.quantity)).toFixed(2)}`;
};

const calculateTotal = (productList) => {
    let total = 0;
    for(product of productList){
        if(product){
            total += Number(product.price)*Number(product.quantity);
        }
    }
    return `\$${Number(total).toFixed(2)}`;
};

const formatNewQty = (productId) => {
    return `newqty${productId}`;
};

const formatKeydown = (productId) => {
    return `handleKeyDown(event,${productId})`;
};

const formatRemovecart = (productId) => {
    return `removecart?id=${productId}`;
};

const formatProductButtonId = (productId) => {
    return `updateProductButton${productId}`;
};

const formatOnClick = (productId) => {
    return `updateProduct(${productId},document.cart1.newqty${productId}.value)`;
};
/* End of Handlebars helpers */

router.get('/', function(req, res, next) {
 
    res.render('showcart', {
        title: 'Your Shopping Cart',
        pageActive: {'showcart': true},
        productList: req.session.productList,
        helpers: {
            formatPrice,
            formatMultiplicationPrice,
            calculateTotal,
            formatNewQty,
            formatKeydown,
            formatRemovecart,
            formatProductButtonId,
            formatOnClick
        }
    });

});

module.exports = router;
