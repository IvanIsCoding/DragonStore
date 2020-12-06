const express = require('express');
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

    // Get product id
    let id = false;
    if (req.query.id) {
        id = req.query.id;
    } else {
        res.redirect("/listprod");
    }
    /*
       // Delete product from list if id exists
    if (productList[id]){
        delete productList[id];
    } 

    req.session.productList = productList;
    res.redirect("/showcart");
    */

    let pool;
    (async function () {
        pool = await sql.connect(dbConfig);
        await cartManager.removeItem(req.session,pool,id)
    })().then(()=>{
        res.redirect("/showcart");
    }).then(() => {
        pool.close();
    });
});

module.exports = router;