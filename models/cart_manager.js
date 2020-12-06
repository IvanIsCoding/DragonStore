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
    let sqlAddCart= ` 
    INSERT INTO incart(userId,productId,quantity,price) 
    VALUES(@username,@pid,1,@price);
    `
    // Quantity is fixed at 1 for new additions
    const psCart = new sql.PreparedStatement(pool);
    psCart.input("username",sql.VarChar);
    psCart.input("pid",sql.Int);
    psCart.input("price",sql.Decimal);
    await psCart.prepare(sqlAddCart);
    await psCart.execute({username:getUser(session), pid:id, price:price})
    console.log("Inserting into db success");
    return;
};

// Remove an item from our sessional and db cart
const removeItem = async (session,pool,id) => {
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
    // error?
    console.log("Error incoming")
    await psRemoveCartItem.prepare(sqlRemoveItem);
    console.log("prepared")
    await psRemoveCartItem.execute({username:getUser(session), prod:id})
    console.log("Item removed successfully!")
    return;
};

// adjust the quantity of our sessional and db cart
const updateQty = async () => {

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

// Get the cart as stored in the database
const getDBCart = (session, pool) => {
    return;
}

module.exports = {
    addItem,
    removeItem,
    updateQty,
    loadCart,
    clearCart
};