const express = require('express');
const router = express.Router();
const sql = require('mssql');
const moment = require('moment');
const writeHeader = require('../shared_functions/header');

// Authenticates that you have previously inputted a valid password by the time you have arrived here
function checkAuthentication(req, res, next) {
    if (req.session.authentication && req.session.authentication.authenticated) {
        next();
    }
    else { // Your password is invalid, send you back to checkout
        req.session.invalidPassword = true;
        res.redirect("/checkout");
    }
}

/* Start of utilities */
const createProductRow = (product) =>{
    return `
    <tr> 
    <td>${product.id}</td>
    <td>${product.name}</td>
    <td>${product.quantity}</td>
    <td>\$${Number(product.price).toFixed(2)}</td>
    <td>\$${Number(product.price*product.quantity).toFixed(2)}</td>
    </tr>
    `
};

const createProductRows = (productList) => {
    // Create the Product row for every product in product list
    // Join the returned strings all together, with new line characters in between each
    return productList.map(createProductRow).join('\n');
};

const writeOrders = (res, productList, customerData, orderId, total) => {
    let customerId = customerData[0].customerId; // Get the customer data
    let customerName = `${customerData[0].firstName} ${customerData[0].lastName}`;
    // Write the SQL, with our functions embedded
    res.write(
        `
        <h1> Your Order Summary </h1>
        <table>
            <tr> 
                <th>Product Id</th> <th>Product Name</th> <th>Quantity</th> <th>Price</th> <th>Subtotal</th>
            </tr>
            ${createProductRows(productList)}
        <tfoot>
            <tr align="right">
                <th id="total" colspan="3">Total: </th>
            <td>${total.toFixed(2)}</td>
            </tr>
        </tfoot>
        </table>
        
        
        <h1>Order completed.  Will be shipped soon...</h1>
        <h1>Your order reference number is: ${orderId}</h1>
        <h1>Shipping to customer: ${customerId} Name: ${customerName}</h1>
                                            

        <h2><a href="listprod">Back to Main Page</a></h2>   
        `
    );

};
/* End of utilities */


router.get('/', checkAuthentication, function(req, res, next) {
    writeHeader(res, `DBs and Dragons Grocery Order List`, `order`);

    // If the request has the product list, store it.
    let productList = false;
    if (req.session.productList && req.session.productList.length > 0) {
        productList = req.session.productList;
    }

    // If the request has the customer id, store it.
    let customerId = false;
    if (req.session.authentication && req.session.authentication.customerId) {
        customerId = Number(req.session.authentication.customerId);
    }
    
    //req.session has session variables
    //req.query - get request data

    let pool;
    (async function() {
        try {

            pool = await sql.connect(dbConfig);
            // Our customer ID is not a number (Validate custId is a number and is sent)
            if (customerId == false || !Number.isInteger(customerId)) { 
                res.write(`<h1> Invalid Customer Id </h1>`);
                res.end();
                return;
            }else if(productList === false){ // If the cart is empty
                res.write('<h1>Empty Cart</h1>');
                res.end();
                return;
            }

            // Ensure customer ID is in the database
            let custIDQuery = `
                SELECT 
                    customerId,
                    firstName,
                    lastName,
                    address,
                    city,
                    state,
                    postalCode,
                    country
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
                res.write('<h1>Customer not in DB</h1>');
            } 
            else{
                // Customer ID is validated, we have items in cart, time to insert into DB
                realProductList = []
                totalPrice = 0;

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
                psSummary.input('OD', sql.Date);
                psSummary.input('TA', sql.Decimal);
                psSummary.input('SA', sql.VarChar);
                psSummary.input('SCI', sql.VarChar);
                psSummary.input('SS', sql.VarChar);
                psSummary.input('SP', sql.VarChar);
                psSummary.input('SCO', sql.VarChar);
                psSummary.input('CI', sql.Int);
                
                await psSummary.prepare(orderSummarySQL);
                // Execute prepared statement, get the data
                let summaryResults = await psSummary.execute(
                    {
                        OD: new Date(), 
                        SA: custData[0].address, 
                        SCI: custData[0].city, 
                        SS: custData[0].state, 
                        SP: custData[0].postalCode, 
                        SCO: custData[0].country, 
                        CI: custData[0].customerId, 
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

                // Loop through all non null products
                for(let product of realProductList) {
                    // Pick new vals for prepared statement for every real product
                    // Store product results just to make me feel better
                    await psProduct.execute({oid: orderId, pid: product.id, qty: product.quantity, pr: product.price});
                }

                // All of our SQL statements have been executed, now we can start writing to our page
                writeOrders(res,realProductList,custData,orderId, totalPrice);

                // Clear product list
                req.session.productList = [];
            }  
        } catch(err) {
            console.dir(err);
            res.write(err)
        }
        finally {
            pool.close();
            res.end();
        }
    })();
});

module.exports = router;
