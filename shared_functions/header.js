const createSingleHyperlink = (hyperlink) => {
    let classString = '';

    if (hyperlink.active) {
        classString = `class = "active"`;
    }

    return `<a ${classString} href="${hyperlink.path}">${hyperlink.text}</a>`;  
};

const createHyperlinks = (hyperlinks) => {
    return hyperlinks.map(createSingleHyperlink).join('\n');
};

const writeHeader = (res, title, currentPage, setHeader=true) => {

	if (setHeader) {
		res.setHeader('Content-Type', 'text/html');
    }

    const hyperlinks = [
        {'text': 'Home', 'path': '/'},
        {'text': 'Cart', 'path': 'showcart'},
        {'text': 'Products', 'path': 'listprod'},
        {'text': 'Orders', 'path': 'listorder'}
    ];

    for(let hyperlink of hyperlinks) {
        hyperlink.active = (hyperlink.path === currentPage);
    }

    res.write(
        `<title>${title}</title>
        <link rel="stylesheet" href="css/style.css">
        <div id="navbar">
            <img src="images/banner.png" alt="DBs & Dragons">
            ${createHyperlinks(hyperlinks)}
        </div>
        <br>
        <br>
        `
    );

};


module.exports = writeHeader;