const express = require('express');
const router = express.Router();
const sql = require('mssql');
const moment = require('moment');

// Helper functions

router.get('/', function(req, res, next) {
    // we don't need this with render res.setHeader('Content-Type', 'text/html');
    // TODO: Get order id

    // TODO: Check if valid order id
    let pool;
    (async function() {
        pool = await sql.connect(dbConfig);
        let orderId = false;
        // See if the get request has our paramater, or if it is something valid
        if(req.query.orderId === "" ||  typeof req.query.orderId == 'undefined'){
            return  // something here for our render program to identify as a massive error
        }
        else{ // For readability
            orderId = req.query.orderId; // Assign orderId to a parameter
        }
        // Validate order id (see if it exists in the DB)
        let validOrderQuery = `
            SELECT
                orderId
            FROM orderSummary
            WHERE orderId = @param
        `;

        const psOrder = new sql.PreparedStatement(pool);
        psOrder.input('param',sql.Int);
        await psOrder.prepare(validOrderQuery);
        let validOrderResult = await psOrder.execute({param: orderId});
        if (validOrderResult.recordset.length === 0){
            return
        }
        // We know orderID exists, now we need to create a shipment and start reducing inventories
        // Get all products in this order, with the existing inventory and how much inventory is demanded
        let productQuery = `
        SELECT
        orderproduct.productId AS pid,
        orderproduct.quantity AS qtyNeed,
        productinventory.quantity AS qtyHave
        FROM orderproduct INNER JOIN productinventory ON orderproduct.productId = productinventory.productId
        WHERE orderproduct.orderId = @oid AND warehouseId = 1;
        `;

        const psProductData = new sql.PreparedStatement(pool)
        psProductData.input('oid',sql.Int);
        await psProductData.prepare(productQuery);
        let productDataResult = await psProductData.execute({oid: orderId})
        productData = productDataResult.recordset;
        let updateQuery = `
        UPDATE productinventory 
        SET quantity = @qtyUpdate
        WHERE warehouseId = 1 AND productId = @pid
        `;
        const psUpdateInventory = new sql.PreparedStatement(pool);
        psUpdateInventory.input('qtyUpdate',sql.Int);
        psUpdateInventory.input('pid', sql.Int);
        await psUpdateInventory.prepare(updateQuery)
        let productUpdateResult;
        for(let product of productData){
            if(product.qtyNeed < product.qtyHave){
                let newQty = product.qtyHave - product.qtyNeed;
                // Save the old qty and new qty somewhere
                productUpdateResult = await psUpdateInventory.execute({qtyUpdate: newQty, pid: product.pid})
            }else{ // Insufficent qty in warehouse one: break the loop, rollback
                
                break;
            }
        }
if pro() pro

    

        // for loop here
        
        return productData;

        
    })().then((shipmentData) => {
        console.log(shipmentData);
        res.render('error', {
            title: 'DBs and Dragons Admin Page',
            errorMessage: `Error, contact your admin: Not implemented yet`,
        });
    }).catch((err) => {
        console.dir(err);
        res.render('error', {
            title: 'DBs and Dragons Admin Page',
            errorMessage: `Error, contact your admin: ${err}`,
        });
    }).finally(() => {
        pool.close();
    });

});
		  
           // TODO: Start a transaction
	   	
	   	// TODO: Retrieve all items in order with given id
	   	// TODO: Create a new shipment record.
	   	// TODO: For each item verify sufficient quantity available in warehouse 1.
	   	// TODO: If any item does not have sufficient inventory, cancel transaction and rollback. Otherwise, update inventory for each item.

module.exports = router;
