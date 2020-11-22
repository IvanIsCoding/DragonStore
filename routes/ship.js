const express = require('express');
const router = express.Router();
const sql = require('mssql');
const moment = require('moment');

router.get('/', function(req, res, next) {
    res.setHeader('Content-Type', 'text/html');

	// TODO: Get order id

          
	// TODO: Check if valid order id
		  

    (async function() {
        try {
            let pool = await sql.connect(dbConfig);

           // TODO: Start a transaction
	   	
	   	// TODO: Retrieve all items in order with given id
	   	// TODO: Create a new shipment record.
	   	// TODO: For each item verify sufficient quantity available in warehouse 1.
	   	// TODO: If any item does not have sufficient inventory, cancel transaction and rollback. Otherwise, update inventory for each item.
	   		
 
        } catch(err) {
            console.dir(err);
            res.write(err + "")
            res.end();
        }
    })();
});

module.exports = router;
