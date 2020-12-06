const express = require('express');
const router = express.Router();
const auth = require('../auth');
const sql = require('mssql');

router.post('/', function(req, res, next) {

    let body = req.body;
    let reviewRating = body.reviewRating;
    let productId = body.productId;
    let userId = req.session.authenticatedUser;
    let reviewComment = body.reviewComment;

    if(userId === undefined){
        res.redirect('/login');
        return
    }

    let pool;
    (async function() {
        pool = await sql.connect(dbConfig);

        /*
        let sqlRestrictReviewQuery = `
        SELECT COUNT(reviewId)
        FROM review JOIN customer ON review.customerId = customer.customerId
        WHERE customer.userId = @cid, productId = @ccpid
        `;
        */
       let sqlCusIdQuery = `
       SELECT customerId 
       FROM customer
       WHERE userId = @uid
       `;
       const psCusid = new sql.PreparedStatement(pool);
       psCusid.input("uid", sql.VarChar);
       await psCusid.prepare(sqlCusIdQuery);
       let CidResults = await psCusid.execute({uid: userId});

       if(CidResults.recordset[0] === undefined){
        res.redirect('/login');
        return
    }
       let customerId = CidResults.recordset[0].customerId;

       let sqlPurchaseResRestrictReviewQuery = `
       SELECT ordersummary.customerId, orderproduct.productId
       FROM ordersummary JOIN orderproduct ON ordersummary.orderId = orderproduct.orderId
       WHERE ordersummary.customerId = @cusid AND orderproduct.productId = @ccpid
        `;

        const psPurchaseResRestrict = new sql.PreparedStatement(pool);
        psPurchaseResRestrict.input("cusid", sql.Int);
        psPurchaseResRestrict.input("ccpid", sql.Int);
        await psPurchaseResRestrict.prepare(sqlPurchaseResRestrictReviewQuery);

        
        let PurchaserestrictResult = await psPurchaseResRestrict.execute(
            {
                cusid: customerId,
                ccpid: productId
            }
        );

        console.log(PurchaserestrictResult.recordset)

        if(PurchaserestrictResult.recordset[0] === undefined){
            res.redirect('/listprod');
            return
        }


       let sqlRestrictReviewQuery = `
            SELECT ordersummary.customerId, COUNT(reviewId) AS numReview
            FROM ordersummary JOIN orderproduct ON ordersummary.orderId = orderproduct.orderId
                JOIN review ON ordersummary.customerId = review.customerId
            WHERE ordersummary.customerId = @cusid AND orderproduct.productId = @ccpid
            GROUP BY ordersummary.customerId
        `;


        const psRestrict = new sql.PreparedStatement(pool);
        psRestrict.input("cusid", sql.Int);
        psRestrict.input("ccpid", sql.Int);
        await psRestrict.prepare(sqlRestrictReviewQuery);

        
        let restrictResult = await psRestrict.execute(
            {
                cusid: customerId,
                ccpid: productId
            }
        );

        if(restrictResult.recordset[0] !== undefined){
            res.redirect('/listprod');
            return
        }




        let sqlInsertReviewQuery = `
        INSERT INTO review (reviewRating, reviewDate, customerId, productId, reviewComment) VALUES (@RR, @RD, @cid, @pid, @RC)
        `;

        const psReview = new sql.PreparedStatement(pool);
        psReview.input("RR", sql.Int);
        psReview.input("RD", sql.DateTime);
        psReview.input("cid", sql.Int);
        psReview.input("pid", sql.Int);
        psReview.input("RC", sql.VarChar);

        await psReview.prepare(sqlInsertReviewQuery);

        await psReview.execute(
            {
                RR: reviewRating,
                RD: new Date(),
                cid: customerId,
                pid: productId,
                RC: reviewComment
            }
        );

        res.redirect('/listprod');
    
    })().then(() => {
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