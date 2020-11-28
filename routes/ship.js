const express = require('express');
const router = express.Router();
const sql = require('mssql');
const moment = require('moment');

// Helper functions

router.get('/', function(req, res, next) {
    let pool;
    (async function() {
        pool = await sql.connect(dbConfig);
        let orderId = false;
        // See if the get request has our paramater, or if it is something valid
        if(req.query.orderId === "" ||  typeof req.query.orderId == 'undefined'){
            throw "Order not found";
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
        // No hits in db for our order
        if (validOrderResult.recordset.length === 0){ 
            throw "Order not found";
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

        // Have product data, prepare our repeated update query
        let updateQuery = `
        UPDATE productinventory 
        SET quantity = @qtyUpdate
        WHERE warehouseId = 1 AND productId = @pid
        `;
        const psUpdateInventory = new sql.PreparedStatement(pool);
        psUpdateInventory.input('qtyUpdate',sql.Int);
        psUpdateInventory.input('pid', sql.Int);
        await psUpdateInventory.prepare(updateQuery)
        // Prepare our initial variable states for the for loop
        let failedId = null;
        let shipmentSucceeded = true;
        successfulShipment = [];

        const transaction = await new sql.Transaction(pool);

        // Update statmenets will be below: start transaction here and have rollback code prepared

        await transaction.begin();
        for(let product of productData){
            // We have sufficent qty, update DB and add to successfulShipment
            if(product.qtyNeed <= product.qtyHave){
                let newQty = product.qtyHave - product.qtyNeed;
                // Save the old qty and new qty somewhere
                productUpdateResult = await psUpdateInventory.execute({qtyUpdate: newQty, pid: product.pid})
                successfulShipment.push({
                    id: product.pid, 
                    qty: product.qtyNeed, 
                    oldInventory: product.qtyHave,
                    newInventory: newQty
                })
            }
            else{
                failedId = product.pid;
                shipmentSucceeded = false;
                await transaction.rollback();
                return [successfulShipment,shipmentSucceeded,failedId];
            }
        }
            
        // Shipment success: insert a shipment record using the orderData we retrived earlier
        let shipmentQuery = `
        INSERT INTO shipment(shipmentDate,warehouseId)
        VALUES(@date,1)
        `;
        const psInsertshipment = new sql.PreparedStatement(pool);
        psInsertshipment.input('date', sql.DateTime);
        await psInsertshipment.prepare(shipmentQuery);
        shipmentResult = await psInsertshipment.execute({date: new Date()});
        await transaction.commit();

        return [successfulShipment, shipmentSucceeded, failedId];
    })().then(([successfulShipment, shipmentSucceeded, failedProductId]) => {
        console.log(successfulShipment);
        console.log(failedProductId);
        res.render('ship', {
            title: 'DBs and Dragons Shipment Page',
            successfulShipment: successfulShipment,
            shipmentSucceeded: shipmentSucceeded,
            failedProductId: failedProductId
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

        /*
        Data format:
            successfulShipment: what could be shipped (right quantity) found on the for loop before the failedProductId
            :type: array of JSONS of type shipment
            [{id: 1, qty: 3, oldInventory: 5, newInventory: 2}, {id: 2, qty: 1, oldInventory: 2, newInventory: 1}]

            :shipment: has:
                id: productId
                qty: quantity from order
                oldInventory: quantity in stock before
                newInventory: oldInventory - qty

            example: {id: 1, qty: 3, oldInventory: 5, newInventory: 2}

            shipmentSucceeded: boolean, true if loop finished without rollback, false otherwise
            example: false
            
            failedProductId: id of product that broke the loop and triggered the transaction.
            example: 1, 2, null
            
        */

/* if things go wrong try await transaction.begin() */


module.exports = router;

