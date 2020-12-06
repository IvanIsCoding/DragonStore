const sql = require('mssql');

const validatePasswordMatch = (password1, password2) => {
    return password1 === password2;
};

const validateUserid = async (pool, username) => {
    let sqlQuery = `
        SELECT 
            userid
        FROM customer
        WHERE userid = @param;
    `;

    // Create prepared statement     
    const ps = new sql.PreparedStatement(pool);
    ps.input('param', sql.VarChar(20));
    await ps.prepare(sqlQuery);

    let results = await ps.execute({param: username});
    if(results.recordset.length > 0) { // userid exists in database
        return false;
    }

    return true;
};

const validatePhoneNumber = (phoneNumber, optional=true) => {
    if(phoneNumber === '' || phoneNumber === null || phoneNumber === undefined) {
        return optional;
    }
    const matchedValue = phoneNumber.match(/^[+]?[\s./0-9]*[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/g);
    return !!phoneNumber;
};

const validateEmail = (email) => {
    const matchedValue = email.match(/^\S+@\S+$/);
    return !!matchedValue;
};

const validatePostalCode = (postalCode) => {
    const matchedValue = postalCode.match(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/);
    return matchedValue;
}

const validateCountry = (country) => {
    return ["Canada", "United States"].includes(country);
};

const validateProvince = (country, province) => {
    const provinceList = {
        "Canada": [
            "Alberta", 
            "British Columbia", 
            "Manitoba", 
            "New Brunswick", 
            "Newfoundland and Labrador", 
            "Nova Scotia", 
            "Ontario", 
            "Prince Edward Island", 
            "Québec", 
            "Saskatchewan",
            "Northwest Territories", 
            "Nunavut",
            "Yukon",
        ],
        "United States": [
            "California",
            "Oregon",
            "Washington",
            "Other"
        ]
    };
    if (!validateCountry(country)) {
        return false;
    }
    return provinceList[country].includes(province);
};

const notEmpty = (input) =>{
    if(!input){ // variable is null or undefined
        return false;
    }
    return input.length > 3
};

const validatePaymentType = (type) => {
    return ["Visa", "Mastercard", "American Express", "Electronic"].includes(type);
};
const validatePaymentMethod = (method) => {
    return ["Amex", "Mobile", "Google Pay", "Apple Pay", "Card"].includes(method);
};

const validateCardNumber = (number) => {
    if(number.length == 10){
        return !isNaN(number); // False for strings, true for numbers
    }
    return false;
}

const validateExpiryDate = (date) => {
    today = new Date();
    testDate = new Date(date);
    return testDate > today;
}

module.exports = {
    validatePasswordMatch,
    validateUserid,
    validatePhoneNumber,
    validatePostalCode,
    validateEmail,
    validateCountry,
    validateProvince,
    notEmpty,
    validatePaymentType,
    validatePaymentMethod,
    validateCardNumber,
    validateExpiryDate
};
/* End of back-end validator functions */
