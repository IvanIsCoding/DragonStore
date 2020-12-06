const express = require('express');
const router = express.Router();
const sql = require('mssql');

router.get('/', function(req, res, next) {
    res.setHeader('Content-Type', 'image/jpeg');

    let id = req.query.id;
    let idVal = parseInt(id);
    if (isNaN(idVal)) {
        res.end();
        return;
    }

    let pool;
    (async function() {
        try {
            pool = await sql.connect(dbConfig);

            let sqlQuery = `
                SELECT productImage
                FROM product
                WHERE productId = @id
            `;

            result = await pool.request()
                .input('id', sql.Int, idVal)
                .query(sqlQuery);

            if (result.recordset.length === 0) {
                console.dir("No image record");
                res.end();
                return;
            } else {
                let productImage = result.recordset[0].productImage;

                res.write(productImage);
            }

        } catch(err) {
            console.dir(err);
            res.write(err + "");
        } finally {
            res.end();
            pool.close();
        }
    })();
});

module.exports = router;
