const express = require('express');
const router = express.Router();

// Rendering the main page
router.get('/', function (req, res) {
    let username = false;
    
    // TODO: Display user name that is logged in (or nothing if not logged in)	
    res.render('index', {
        title: "DBs and Dragons Grocery Main Page",
        username: req.session.authenticatedUser,
        pageActive: {'home': true}
    });
})

module.exports = router;
