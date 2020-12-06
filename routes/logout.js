const express = require('express');
const router = express.Router();
const cartManager = require('../models/cart_manager');

router.get('/', function(req, res, next) {
    console.log("loging out")
    req.session.authenticatedUser = false;
    req.session.productList = []
    res.redirect("/");
});

module.exports = router;
