const jwt = require('jsonwebtoken')
require('dotenv').config()

const privatekey = process.env.JWT_PRIVATE_KEY;

//generating jwt token
const generateToken = (id, role, name)=>{
    const token = jwt.sign({id, role, name}, privatekey, { expiresIn:'1h' })
    console.log('token--',token);
    return token;
}

module.exports = {generateToken};