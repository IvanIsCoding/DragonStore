const sql = require('mssql');

const auth = {
    checkAuthentication: function(req, res) {
        let authenticated = false;
    
        if (req.session.authenticatedUser) {
            authenticated = true;
        }
    
        if (!authenticated) {
            let url = req.protocol + '://' + req.get('host') + req.originalUrl;
            let loginMessage = "You have not been authorized to access the URL " + url;
            req.session.loginMessage = loginMessage;
            res.redirect("/login");
        }
    
        return authenticated;
    }
}

module.exports = auth;