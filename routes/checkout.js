const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
    res.setHeader('Content-Type', 'text/html');
    res.write("<title>DBs and Dragons Grocery CheckOut Line</title>");

    /* Start of utilities to write checkout page */
    let createWarning = (isInvalid) => {
    	if (isInvalid) {
    		return `
    			<b>At least one of the user or password you entered was not correct. Please try again. </b> 
    			<br>
    			<br>
    		`;
    	}
    	return '';
    };

    let writeCheckout = (res, isInvalid) => {
	    res.write(
	    	`
	    	<h1>Enter your customer id and password to complete the transaction:</h1>
	    	${createWarning(isInvalid)}
			<form method="post" action="customerauthentication">
				<table>
					<tr>
						<td>Customer ID:</td><td><input type="text" name="customerId" size="20"></td>
					</tr>
					<tr>
						<td>Password:</td><td><input type="password" name="password" size="30"></td>
					</tr>
					<tr>
						<td> <input type="submit" value="Submit"> </td> <td> <input type="reset" value="Reset"> </td>
					</tr>
				</table>
			</form>
	    	`
	    );
	};
	/* End of utilities to write checkout page */

	writeCheckout(res, req.session.invalidPassword);
    
    if(req.session.invalidPassword) {
		req.session.invalidPassword = false;	
	}
    res.end();

});

module.exports = router;
