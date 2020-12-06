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

router.get('/manageprod', checkLogin, function(req, res, next) {
    res.render('admin/manageprod', {
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

module.exports = router;