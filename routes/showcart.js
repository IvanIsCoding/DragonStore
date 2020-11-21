const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
    
    res.setHeader('Content-Type', 'text/html');
    res.write("<title>Your Shopping Cart</title>");
    
    res.write(
        `
        <script>
        
        function updateProduct(id, newqty) {
            window.location="updatecart?".concat("id=", id, "&qty=", newqty);
        }

        function handleKeyDown(event, productId) {
            let enterKeyCode = 13;
            let keyCode = event.keyCode;
            let buttonId = "updateProductButton".concat(productId);
            if (keyCode === enterKeyCode) {
                document.getElementById(buttonId).click();
                event.preventDefault();
            }
        }

        </script>
        `
    ); // JavaScript to retrieve input and button info

    /* Start of utilities to display cart */
    let createQuantityInput = (product) => {
        return `
            <input 
                type="text" 
                name="newqty${product.id}" 
                size="3" value="${product.quantity}"
                onkeydown = "handleKeyDown(event, ${product.id})" 
            > 
        `;
    };

    let createUpdateButton = (product) => {
        return `
            <input
                id = "updateProductButton${product.id}"
                type="button" 
                onclick="updateProduct(${product.id}, document.cart1.newqty${product.id}.value)" value="Update Quantity"
            >
        `;
    };

    let createSingleProductEntry = (product) => {
        
        if(!product){
            return '';
        }

        return `
            <tr>
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td align="center">${createQuantityInput(product)}</td>
                <td align="right">\$${Number(product.price).toFixed(2)}</td>
                <td align="right">\$${(Number(product.price)*Number(product.quantity)).toFixed(2)}</td>
                <td align="right" style="padding-left: 5px;"> 
                    <a href="removecart?id=${product.id}"> Remove Item From Cart </a> 
                </td>
                <td align="right" style="padding-left: 5px;">
                    ${createUpdateButton(product)}
                </td>
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
                
                <form name="cart1">
                    <table>
                        <tr>
                            <th>Product Id</th> <th>Product Name</th> <th>Quantity</th>
                            <th>Price</th> <th>Subtotal</th> <th> </th> <th> </th>
                        </tr>
                        ${createProductEntries(productList)}
                        <tr> 
                            <td colspan="5" align="right"> <b>Order Total</b> </td> 
                            <td align="right">\$${calculateTotal(productList).toFixed(2)}</td>
                        </tr>
                    </table>
                </form1>

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
    /* End of utilities to display cart */
 
    writeShoppingCart(res, req.session.productList);
    res.end();
});

module.exports = router;
