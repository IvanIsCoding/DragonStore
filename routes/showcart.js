const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
    
    res.setHeader('Content-Type', 'text/html');
    res.write("<title>Your Shopping Cart</title>");
    
    let createSingleProductEntry = (product) => {
        
        if(!product){
            return '';
        }

        return `
            <tr>
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td align="center">${product.quantity}</td>
                <td align="right">\$${Number(product.price).toFixed(2)}</td>
                <td align="right">\$${(Number(product.price)*Number(product.quantity)).toFixed(2)}</td>
                <td> <a href="removecart?id=${product.id}"> Remove Item From Cart </a> </td>
            </tr>
        `;
    };

    let createProductEntries = (productList) => {
        return productList.map(createSingleProductEntry).join("\n");
    };

    let calculateTotal = (productList) => {
        let total = 0;
        for(product of productList){
            if(product){
                total += Number(product.price)*Number(product.quantity);
            }
        }
        return total;
    };

    let writeShoppingCart = (res, productList) => {
        if(productList){
            res.write(
                `<h1>Your Shopping Cart</h1>
                
                <table>
                    <tr>
                        <th>Product Id</th> <th>Product Name</th> <th>Quantity</th>
                        <th>Price</th> <th>Subtotal</th> <th> </th>
                    </tr>
                    ${createProductEntries(productList)}
                    <tr> 
                        <td colspan="5" align="right"> <b>Order Total</b> </td> 
                        <td align="right">\$${calculateTotal(productList).toFixed(2)}</td>
                    </tr>
                </table>

                <h2><a href="checkout">Check Out</a></h2>
                <h2><a href="listprod">Continue Shopping</a></h2>
                `
            );
        }
        else {
            res.write(
                `
                <h1> Your shopping cart is empty! </h1>
                <h2><a href="listprod">Continue Shopping</a></h2>
                `
            );
        }
    };
 
    writeShoppingCart(res, req.session.productList);
    res.end();
});

module.exports = router;
