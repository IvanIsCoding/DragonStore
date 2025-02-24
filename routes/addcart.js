const express = require('express');
const router = express.Router();
const cartManager = require('../models/cart_manager');
const sql = require('mssql');

router.get('/', function(req, res, next) {
    res.setHeader('Content-Type', 'text/html');
    // If the product list isn't set in the session,
    // create a new list.
    /*
    let productList = false;
    if (!req.session.productList) {
        productList = [];
    } else {
        productList = req.session.productList;
    }
    */
    // Add new product selected
    // Get product information
    let id = false;
    let name = false;
    let price = false;
    if (req.query.id && req.query.name && req.query.price) {
        id = req.query.id;
        name = req.query.name;
        price = req.query.price;
    } else {
        res.redirect("/listprod");
        return;
    }
    /*
    // Update quantity if add same item to order again
    if (productList[id]){
        productList[id].quantity = productList[id].quantity + 1;
    } else {
        productList[id] = {
            "id": id,
            "name": name,
            "price": price,
            "quantity": 1
        };
    }

    req.session.productList = productList;
    */

    let pool;
    (async function() {
        pool = await sql.connect(dbConfig);
        await cartManager.addItem(req.session, pool, id, name, price);
    })().then(() => {
        res.redirect("/showcart");
    }).then(() => {
        pool.close();
    });

});

module.exports = router;
