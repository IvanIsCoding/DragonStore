const express = require('express');
const { updateQty } = require('../models/cart_manager');
const router = express.Router();
const sql = require('mssql');
const cartManager = require('../models/cart_manager');

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

    let pool;
    (async function () {
        pool = await sql.connect(dbConfig);
        await cartManager.updateQty(req.session,pool,id,qty)
    })().then(()=>{
        res.redirect("/showcart");
    }).then(() => {
        pool.close();
    });
});

module.exports = router;