const express = require('express');
const router = express.Router();
const auth = require('../auth');
const sql = require('mssql');

/* Start of Handlebars helpers */
const formatPrice = (price) => {
    return `\$${Number(price).toFixed(2)}`
};

const formatDate = (orderDate) => {
    let dateFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
    };
    let formattedDate = orderDate.toLocaleDateString("en-US", dateFormatOptions);
    return formattedDate;
};
/* End of Handlebars helpers */

// Authenticates that user has logged in previously
function checkLogin(req, res, next) {
    if (req.session.authenticatedUser) {
        next();
    }
    else { // Your password is invalid, send you back to checkout
        req.session.loginMessage = "Access denied to the Admin page. Log in with your credentials first.";
        res.redirect("/login");
    }
}

router.get('/', checkLogin, function(req, res, next) {
	
    let pool;
    (async function() {
        pool = await sql.connect(dbConfig);

        let sqlQuery = `
            SELECT
                CAST(orderDate AS DATE) AS groupDate,
                COALESCE(SUM(totalAmount), 0) AS totalOrderAmount
            FROM ordersummary
            GROUP BY CAST(orderDate AS DATE)
            ORDER BY CAST(orderDate AS DATE) DESC;
        `;

        let results = await pool.request().query(sqlQuery);

        return results.recordset;
    })().then((salesData) => {
        res.render('admin/index', {
            title: 'DBs and Dragons Admin Page',
            salesData: salesData,
            pageActive: {'order': true},
            helpers: {
                formatPrice,
                formatDate
            }
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

router.get('/manageinsert', checkLogin, function(req, res, next) {
    res.render('admin/manageinsert', {
        title: 'DBs and Dragons Admin Page',
    });
});

router.post('/insertprod', checkLogin, function(req, res, next) {
	
    let pool;
    (async function() {
        pool = await sql.connect(dbConfig);
        let productName = req.body.Name;
        let productprice = req.body.price;
        let productImageURL = req.body.url;
        //let productImage = req.query.Image;
        let productDesc = req.body.Desc;
        let categoryId = req.body.Id;

        let sqlInsertproductQuery = `
        INSERT INTO product (productName, productPrice, productImageURL, productDesc, categoryId) 
        VALUES (@PN, @PP, @piu, @PD, @caid)
        `;

        const psinsertProd = new sql.PreparedStatement(pool);
        psinsertProd.input("PN", sql.VarChar);
        psinsertProd.input("PP", sql.Decimal);
        psinsertProd.input("piu", sql.VarChar);
        //psinsertProd.input("PI", sql.VarChar);
        psinsertProd.input("PD", sql.VarChar);
        psinsertProd.input("caid", sql.Int);

        await psinsertProd.prepare(sqlInsertproductQuery);
        
        await psinsertProd.execute(
            {
                PN: productName,
                PP: productprice,
                piu: productImageURL,
                //Pi: productImage,
                PD: productDesc,
                caid: categoryId
            }
        );

    })().then(() => {
        res.render('admin/insertprod', {
            title: 'DBs and Dragons Admin Page',
        });
    }).catch((err) => {
        res.render('error', {
            title: 'DBs and Dragons Product List',
            errorMessage: `Error, contact your admin: ${err}`,
        });
    }).finally(() => {
        pool.close();
    });

});


router.get('/managedelete', checkLogin, function(req, res, next) {
    res.render('admin/managedelete', {
        title: 'DBs and Dragons Admin Page',
    });
});

router.post('/deleteprod', checkLogin, function(req, res, next) {
	
    let pool;
    (async function() {
        pool = await sql.connect(dbConfig);
        let productId = req.body.Id;

        let sqlDeleteproductQuery = `
        DELETE FROM product WHERE productId = @ppid;
        `;

        const psDeleteProd = new sql.PreparedStatement(pool);
        psDeleteProd.input("ppid", sql.Int);

        await psDeleteProd.prepare(sqlDeleteproductQuery);
        
        await psDeleteProd.execute(
            {
                ppid: productId
            }
        );

    })().then(() => {
        res.render('admin/deleteprod', {
            title: 'DBs and Dragons Admin Page',
        });
    }).catch((err) => {
        res.render('error', {
            title: 'DBs and Dragons Product List',
            errorMessage: `Error, contact your admin: ${err}`,
        });
    }).finally(() => {
        pool.close();
    });

});

router.get('/manageupdate', checkLogin, function(req, res, next) {
    res.render('admin/manageupdate', {
        title: 'DBs and Dragons Admin Page',
    });
});

router.post('/updateprod', checkLogin, function(req, res, next) {
	
    let pool;
    (async function() {
        pool = await sql.connect(dbConfig);
        let productId = req.body.pid;
        let productName = req.body.Name;
        let productprice = req.body.price;
        let productImageURL = req.body.url;
        //let productImage = req.query.Image;
        let productDesc = req.body.Desc;
        let categoryId = req.body.cid;

        let sqlOldInfoProduct = `
            SELECT productName, productPrice, productImageURL, productImage, productDesc, categoryId
            FROM product
            WHERE productId = @param
        `;

        const psInfo = new sql.PreparedStatement(pool);
        psInfo.input("param", sql.Int);
        await psInfo.prepare(sqlOldInfoProduct);
        let OldInfoResult = await psInfo.execute({param: productId});

        if(productName === undefined|| productName === 0 || productName === ""){
            productName = OldInfoResult.recordset[0].productName;
        }
        if(productprice === undefined || productprice === 0 || productprice === ""){
            productprice = OldInfoResult.recordset[0].productPrice;
        }
        if(productImageURL === undefined|| productImageURL === 0 || productImageURL === ""){
            productImageURL = OldInfoResult.recordset[0].productImageURL;
        }
        if(productDesc === undefined|| productDesc === 0 || productDesc === ""){
            productDesc = OldInfoResult.recordset[0].productDesc;
        }
        if(categoryId === undefined|| categoryId === 0 || categoryId === ""){
            categoryId = OldInfoResult.recordset[0].categoryId;
        }

        console.log(productImageURL);
        console.log(OldInfoResult.recordset[0].productImageURL);

        let sqlUpdateproductQuery = `
            UPDATE product
            SET productName = @pname, productprice = @pprice, productImageURL = @purl, productDesc = @pdesc, categoryId = @cid
            WHERE productId = @pid;
        `;

        const psUpdateprod = new sql.PreparedStatement(pool);
        psUpdateprod.input("pname", sql.VarChar);
        psUpdateprod.input("pprice", sql.Decimal);
        psUpdateprod.input("purl", sql.VarChar);
        psUpdateprod.input("pdesc", sql.VarChar);
        psUpdateprod.input("cid", sql.Int);
        psUpdateprod.input("pid", sql.Int);

        await psUpdateprod.prepare(sqlUpdateproductQuery);
        
        await psUpdateprod.execute(
            {
                pname: productName,
                pprice: productprice,
                purl: productImageURL,
                pdesc: productDesc,
                cid: categoryId,
                pid: productId
            }
        );

    })().then(() => {
        res.render('admin/updateprod', {
            title: 'DBs and Dragons Admin Page',
        });
    }).catch((err) => {
        res.render('error', {
            title: 'DBs and Dragons Product List',
            errorMessage: `Error, contact your admin: ${err}`,
        });
    }).finally(() => {
        pool.close();
    });

});


module.exports = router;