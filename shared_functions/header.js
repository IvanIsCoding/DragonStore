const writeHeader = (res, title, currentPage, setHeader=true) => {

	if (setHeader) {
		res.setHeader('Content-Type', 'text/html');
    }

    res.write(
        `<title>${title}</title>
        <link rel="stylesheet" href="css/style.css">
        <div id="navbar">
            <img src="images/banner.png" alt="DBs & Dragons">
            <a href="/">Home</a>
            <a href="showcart">Cart</a>
            <a href="listprod">Products</a>
            <a href="listorder">Orders</a>
        </div>
        <br>
        <br>
        `
    );

};


module.exports = writeHeader;