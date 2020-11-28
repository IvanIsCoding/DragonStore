const express = require('express');
const router = express.Router();
const sql = require('mssql');
const moment = require('moment');

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

        const psOrder = await new sql.PreparedStatement(pool);
        await psOrder.input('param',sql.Int);
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

        const psProductData = await new sql.PreparedStatement(pool)
        await psProductData.input('oid',sql.Int);
        await psProductData.prepare(productQuery);
        let productDataResult = await psProductData.execute({oid: orderId})
        productData = await productDataResult.recordset;

        const transaction = await new sql.Transaction(pool);
        await transaction.begin();
        // Have product data, prepare our repeated update query
        let updateQuery = `
        UPDATE productinventory 
        SET quantity = @qtyUpdate
        WHERE warehouseId = 1 AND productId = @pid
        `;
        const psUpdateInventory = await new sql.PreparedStatement(transaction);
        await psUpdateInventory.input('qtyUpdate',sql.Int);
        await psUpdateInventory.input('pid', sql.Int);
        await psUpdateInventory.prepare(updateQuery)
        // Prepare our initial variable states for the for loop
        let failedId = null;
        let shipmentSucceeded = true;
        successfulShipment = [];

        

        // Update statmenets will be below: start transaction here and have rollback code prepared


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
                await psUpdateInventory.unprepare();
                await transaction.rollback();
                return [successfulShipment,shipmentSucceeded,failedId];
            }
        }
        await psUpdateInventory.unprepare();
        // Shipment success: insert a shipment record using the orderData we retrived earlier
        let shipmentQuery = `
        INSERT INTO shipment(shipmentDate,warehouseId)
        VALUES(@date,1)
        `;
        const psInsertshipment = await new sql.PreparedStatement(transaction);
        await psInsertshipment.input('date', sql.DateTime);
        await psInsertshipment.prepare(shipmentQuery);
        shipmentResult = await psInsertshipment.execute({date: new Date()});
        await psInsertshipment.unprepare();
        // No errors thus far: time to commit
        await transaction.commit();

        return [successfulShipment, shipmentSucceeded, failedId];

    })().then(([successfulShipment, shipmentSucceeded, failedProductId]) => {
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

module.exports = router;

