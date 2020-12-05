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
    if(!isLoggedIn(session)){
    if(!getUser(session)){ // Not logged in
        console.log("Not logged in");
        return;
    }
    // Update db with our cart information
    let sql = ` 
    INSERT INTO incart(userId,productId,quantity,price) 
    VALUES(@uid,@pid,1,@price)
    `
    // Quantity is fixed at 1 for new additions
    const psCart = new sql.PreparedStatement(pool);
    psCart.input("uid",sql.Int);
    psCart.input("pid",sql.Int);
    psCart.input("price",sql.Decimal);
    await psCart.prepare(sql);
    await psCart.execute({uid:getUser(session),pid:id,price:price})
    console.log("Inserting into db success");
};

// Remove an item from our sessional and db cart
const removeItem = async () => {

};

// adjust the quantity of our sessional and db cart
const updateQty = async () => {

};

// On log in, load our stored cart from the db
const loadCart = async (session) => {
    if(!isLoggedIn(session)){ // This should never happen, but just in case
        return;
    }

    if(!session.productList){ // There is no session cart yet
        // Get cart from DB for this user, set the sessional cart to be it
    }else{
        mergeCart(session)
    }

// if cart in db is empty: pick session cart
// if not empty: idk man, good luck
};

// On checkout, clear sessional cart and db cart for this customer
const clearCart = async (session,pool) => {

};

const getSessionCart = (session) => {
    return session.productList;
};

// Check if this user is logged in
const isLoggedIn = (session) =>{
const getUser = (session) =>{
    //req.session.authenticatedUser = authenticatedUser;
    return session.authenticatedUser;
};

// Merge the cart as stored in the db with the sessional cart
const mergeCart = (session) => {

}

// Get the cart as stored in the database
const getDBCart = (session, pool) => {

}

module.exports = {
    addItem,
    removeItem,
    updateQty,
    loadCart,
    clearCart
};