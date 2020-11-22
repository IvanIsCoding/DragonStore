const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {

    let isInvalidPassword = req.session.invalidPassword;

    if(req.session.invalidPassword) {
		req.session.invalidPassword = false;	
	}
    
    res.render('checkout', {
        title: 'DBs and Dragons Grocery Order List',
        pageActive: {'checkout': true},
        isInvalid: isInvalidPassword,
        helpers: {}
    });

});

module.exports = router;
