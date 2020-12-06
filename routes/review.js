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
    console.log(body);

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

       let customerId = CidResults.recordset[0].customerId;
       console.log(customerId)

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
    
    })().then(() => {
        res.redirect('/listprod');
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