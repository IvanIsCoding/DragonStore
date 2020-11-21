const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
    res.setHeader('Content-Type', 'text/html');
    // If the product list isn't set in the session,
    // create a new list.

    let productList = false;
    if (!req.session.productList) {
        productList = [];
    } else {
        productList = req.session.productList;
    }

    // Get product id and quantity
    let id = false;
    let qty = false;
    if (req.query.id && req.query.qty) {
        id = req.query.id;
        qty = Number(req.query.qty);
    } else {
        res.redirect("/listprod");
    }

    // Update quantity if product exists in list
    // And the quantity is a valid non-negative integer
    if (productList[id] && Number.isInteger(qty) && qty >= 0){
        productList[id].quantity = qty;
        if (qty == 0) { // special case: delete item
            delete productList[id];
        }
    }

    req.session.productList = productList;

    res.redirect("/showcart");
});

module.exports = router;