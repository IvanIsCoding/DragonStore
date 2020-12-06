const sql = require('mssql');

// Update sessional variable and db with new cart item
const addItem = async (session, pool, id, name, price) => {
    // session is req.session
    // Update sessional variable
    if (!session.productList) {
        productList = [];
    } else {
        productList = session.productList;
    }

    if (productList[id]){
        productList[id].quantity = productList[id].quantity + 1;
        updateQty(session,pool,id,productList[id].quantity+1);
    } else {
        productList[id] = {
            "id": id,
            "name": name,
            "price": price,
            "quantity": 1
        };
    }
    session.productList = productList;
    // If the user is not logged in, we do not update the DB
    if(!getUser(session)){ // Not logged in
        console.log("Not logged in");
        return;
    }
    // Update db with our cart information
    sqlAddItem(session,pool,id,name,price);
};

const sqlAddItem = async (session, pool, id, name, price) => {
    let sqlAddCart= ` 
    INSERT INTO incart(userId,productId,quantity,price,name) 
    VALUES(@username,@pid,1,@price,@name);
    `
    // Quantity is fixed at 1 for new additions
    const psCart = new sql.PreparedStatement(pool);
    psCart.input("username",sql.VarChar);
    psCart.input("pid",sql.Int);
    psCart.input("price",sql.Decimal);
    psCart.input("name",sql.VarChar);
    await psCart.prepare(sqlAddCart);
    await psCart.execute({username:getUser(session), pid:id, price:price, name:name})
    console.log("Inserting into db success");
    return;
};

// Remove an item from our sessional and db cart
const removeItem = async (session,pool,id) => {
    productList = session.productList;
    if (productList[id]){
        delete productList[id];
    } 
    session.productList = productList;
    // If the user is not logged in, we do not update the DB
    if(!getUser(session)){ // Not logged in
        console.log("Not logged in");
        return;
    }

    // Update db deleting item
    let sqlRemoveItem= ` 
        DELETE 
        FROM incart 
        WHERE incart.userId = @username 
        AND incart.productId = @prod;
    `
    const psRemoveCartItem = new sql.PreparedStatement(pool);
    psRemoveCartItem.input("username",sql.VarChar);
    psRemoveCartItem.input("prod",sql.Int);
    await psRemoveCartItem.prepare(sqlRemoveItem);
    await psRemoveCartItem.execute({username:getUser(session), prod:id})
    console.log("Item removed successfully!")
    return;
};

// adjust the quantity of our sessional and db cart
const updateQty = async (session,pool,id,qty) => {
    // Update quantity if product exists in list
    // And the quantity is a valid non-negative integer
    productList = session.productList;
    if (productList[id] && Number.isInteger(qty) && qty >= 0 && productList[id].quantity != qty){
        productList[id].quantity = qty;
        if (qty == 0) { // special case: delete item
            removeItem(session,pool,id)
            return;
        }
    }else{
        return;
    }
    session.productList = productList;

    // If the user is not logged in, we do not update the DB
    if(!getUser(session)){ // Not logged in
        console.log("Not logged in");
        return;
    }
    // Update qty in cart DB
    let updateSQL = `
    UPDATE incart
    SET incart.quantity = @qty
    WHERE userId = @username AND productId = @prod
    `
    const psUpdateQty = new sql.PreparedStatement(pool)
    psUpdateQty.input("username",sql.VarChar);
    psUpdateQty.input("prod",sql.Int);
    psUpdateQty.input("qty",sql.Int);
    await psUpdateQty.prepare(updateSQL);
    psUpdateQty.execute({username:getUser(session), prod:id, qty:qty})
    console.log("quantity updated")
};

// On log in, load our stored cart from the db
const loadCart = async (session,pool) => {
    if(!getUser(session)){ // This should never happen, but just in case
        return;
    }
    dbCart = getDBCart(); 
    if(!dbCart){ // The database cart is empty
        console.log("No cart in the database: keep session productList")
    }
    else if(!session.productList || session.productList.length == 0){ // There is no session cart yet
        console.log("Take cart directly from DB")
        session.productList = getDBCart();
    }else{ // Both carts have products: merge
        console.log("Merging two carts")
        mergeCart(session,dbCart,pool)
    }
};

// On checkout, clear sessional cart and db cart for this customer
const clearCart = async (session,pool) => {

    session.productList = [];
    if(!getUser(session)){ // Not logged in
        console.log("Not logged in");
        return;
    }
    // Clear cart in DB
    sqlClearCart = `
    DELETE 
    FROM incart 
    WHERE incart.userId = @username 
    `
    const psClearCart = new sql.PreparedStatement(pool);
    psClearCart.input("username",sql.VarChar);
    await psClearCart.prepare(sqlClearCart);
    await psClearCart.execute({username:getUser(session)});
    console.log("Cart cleared successfully!");
    return;
};

const getSessionCart = (session) => {
    return session.productList;
};

// Check if this user is logged in
const getUser = (session) =>{
    //req.session.authenticatedUser = authenticatedUser;
    return session.authenticatedUser;
};

// Merge the cart as stored in the db with the sessional cart
const mergeCart = (session,dbCart,pool) => {

}
    sessionProducts = session.productList;
    for(let cartProduct of dbCart){
        if (!cartProduct) { // Null product
            continue;
        }
         // If the DB entry is not in the sessional var
        if(!sessionProducts[cartProduct.id]){
            sessionProducts[cartProduct.id] = cartProduct
        }else{ // DB entry is in sessional var: update quantity to sessional version
            updateQty(session,pool,cartProduct.id,cartProduct.qty)
        }
    }
    for(let sessionCartProduct of sessionProducts){
        if (!sessionCartProduct) { // Null product
            continue;
        }
         // If sessional product is not in DB
        if(!dbCart[sessionCartProduct.id]){ // Add it only to the DB
            sqlAddItem(session,pool,sessionCartProduct.id,sessionCartProduct.name,sessionCartProduct.price)
        }
    }
};

// Get the cart as stored in the database
const getDBCart = (session, pool) => {
    username = getUser(session)
    // Query DB for an existing cart
    sqlCartQuery = `
    SELECT incart.productId AS id, quantity, price, name
    FROM incart
    WHERE userId = @username
    `
    const psCart = new sql.PreparedStatement(pool);
    psCart.input("username",sql.VarChar);
    await psCart.prepare(sqlCartQuery);
    results = await psCart.execute({username:username})
    let dbRecords = results.recordset

    if(dbRecords.length === 0){ // If there are no values returned from cart
        return
    }
    // Create the product list as last saved
    dbProductList = []
    for(let product of dbRecords){
        if (!product) {
            continue;
        }
        id = dbRecords.productId
        dbProductList[id] = {
            "id": product.id,
            "name": product.name,
            "price": product.price,
            "quantity": product.quantity
        }
    }
    return dbProductList;
};

module.exports = {
    addItem,
    removeItem,
    updateQty,
    loadCart,
    clearCart
};