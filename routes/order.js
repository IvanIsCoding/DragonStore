const express = require('express');
const router = express.Router();
const sql = require('mssql');
const moment = require('moment');
const cartManager = require('../models/cart_manager');

/* Start of Handlebars helpers */
const formatPrice = (price) => {
    return `\$${Number(price).toFixed(2)}`
};

const formatMultiplicationPrice = (product) => {
    return `\$${(Number(product.price)*Number(product.quantity)).toFixed(2)}`;
};
/* End of Handlebars helpers */

// Authenticates that you have previously inputted a valid password by the time you have arrived here
function checkAuthentication(req, res, next) {
    if (req.session.customerAuthentication && req.session.customerAuthentication.authenticated) {
        next();
    }
    else { // Your password is invalid, send you back to checkout
        req.session.invalidPassword = true;
        res.redirect("/checkout");
    }
}

router.get('/', checkAuthentication, function(req, res, next) {

    // If the request has the product list, store it.

    let productList = false;
    if (req.session.productList && req.session.productList.length > 0) {
        productList = req.session.productList;
    }

    /*
    let productList = cartManager.getSessionCart(req.session);
    */

    // If the request has the customer id, store it.
    let customerId = false;
    if (req.session.customerAuthentication && req.session.customerAuthentication.customerId) {
        customerId = Number(req.session.customerAuthentication.customerId);
    }
    
    //req.session has session variables
    //req.query - get request data

    let pool;
    (async function() {
        pool = await sql.connect(dbConfig);
        // Our customer ID is not a number (Validate custId is a number and is sent)
        if (customerId == false || !Number.isInteger(customerId)) { 
            throw 'Invalid Customer Id: Customer Id is not a number (or is missing)';
        } else if (productList === false) { // If the cart is empty
            throw 'Empty Cart';
        }

        // Ensure customer ID is in the database
        let custIDQuery = `
            SELECT 
                customerId,
                firstName,
                lastName
            FROM customer
            WHERE customerId = @param
        `;
        const psCust = new sql.PreparedStatement(pool);
        psCust.input('param', sql.Int);
        await psCust.prepare(custIDQuery);
        let custResults = await psCust.execute({param: customerId});
        let custData = custResults.recordset;

        // The customer ID does not match a real ID: should never be reached since we validate earlier
        if(custData.length === 0 || custData[0].customerId !== customerId){ // !== to Check for type and value equality
            throw 'Invalid Customer Id: Customer not in DB';
        } 
        else{
            // Customer ID is validated, we have items in cart, time to insert into DB
            let realProductList = []
            let totalPrice = 0;

            // Need to calculate total amount first, and cull null values
            for(let product of productList){
                // there are undefined products in product list we must skip
                if (!product) {
                    continue;
                }
                totalPrice += product.quantity*product.price;
                realProductList.push(product)
            }

            // Insert the order detail into orderSummary table //
            // and retrieved auto-generated id for order         //       
            let orderSummarySQL = 
            `
            INSERT INTO orderSummary
            (orderDate, totalAmount, shiptoAddress, shiptoCity, shiptoState, shiptoPostalCode,shiptoCountry, customerId) 
            VALUES (@OD, @TA, @SA, @SCI, @SS, @SP, @SCO, @CI); 

            SELECT SCOPE_IDENTITY() AS orderId;
            `;

            // Create prepared statement     
            const psSummary = new sql.PreparedStatement(pool);
            psSummary.input('OD', sql.DateTime);
            psSummary.input('TA', sql.Decimal);
            psSummary.input('SA', sql.VarChar);
            psSummary.input('SCI', sql.VarChar);
            psSummary.input('SS', sql.VarChar);
            psSummary.input('SP', sql.VarChar);
            psSummary.input('SCO', sql.VarChar);
            psSummary.input('CI', sql.Int);
                
            await psSummary.prepare(orderSummarySQL);
            // Execute prepared statement, get the data
            shipmentInfo = req.session.shipmentInfo
            let summaryResults = await psSummary.execute(
                {
                    OD: new Date(), 
                    SA: shipmentInfo.address, 
                    SCI: shipmentInfo.city, 
                    SS: shipmentInfo.state, 
                    SP: shipmentInfo.postalCode, 
                    SCO: shipmentInfo.country, 
                    CI: customerId, 
                    TA: totalPrice
                }
            );
            let orderId = summaryResults.recordset[0].orderId;

            // Traverse product list, store them in orderProduct
            let productSQL = 
            `
            INSERT INTO orderProduct(orderId,productId,quantity,price)
            VALUES(@oid,@pid,@qty,@pr)
            `;

            // Create prepared statement
            const psProduct = new sql.PreparedStatement(pool);
            psProduct.input("oid", sql.Int);
            psProduct.input("pid", sql.Int);
            psProduct.input("qty", sql.Int);
            psProduct.input("pr", sql.Decimal);
            await psProduct.prepare(productSQL);

            // Create statement to update sales
            let productSalesSQL = `
            UPDATE product SET qtySold = qtySold + @qty WHERE productId = @pid
            `
            const psSales = new sql.PreparedStatement(pool)
            psSales.input("qty",sql.Int);
            psSales.input("pid",sql.Int);
            await psSales.prepare(productSalesSQL);

            // Loop through all non null products
            for(let product of realProductList) {
                // Pick new vals for prepared statement for every real product
                await psProduct.execute({oid: orderId, pid: product.id, qty: product.quantity, pr: product.price});
                await psSales.execute({qty:product.quantity, pid:product.id})
            }
            // Clear cart and other sessional vars
            await cartManager.clearCart(req.session,pool)
            delete req.session.shipmentInfo
            delete req.session.paymentInfo
            // Forward data to renderer
            return [realProductList, custData, orderId, totalPrice];
        }
    })().then(([realProductList, custData, orderId, totalPrice]) => {
        res.render('order', {
            title: 'DBs and Dragons Grocery Order List',
            productList: realProductList,
            custData: custData[0],
            orderId: orderId,
            totalPrice: totalPrice,
            pageActive: {'order': true},
            helpers: {
                formatPrice,
                formatMultiplicationPrice
            }
        });
    }).catch((err) => {
        console.dir(err);
        res.render('error', {
            title: 'DBs and Dragons Grocery Order List',
            errorMessage: `${err}`,
        });
    }).finally(() => {
        pool.close();
    });

});

module.exports = router;
