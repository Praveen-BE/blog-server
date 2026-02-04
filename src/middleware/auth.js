const jwt = require("jsonwebtoken");
const pool = require("../config/database");
require("dotenv").config();
const userAuth = async (req , res, next)=>{
    try{
        const { token } = req.cookies;

        if(!token){
            throw new Error("Token is Not Valid!");
        }

        const decodeObj = await jwt.verify(token, process.env.JWT_SECRET);
        const { id, email } = decodeObj;

        // find is user email is available
        const result = await pool.query(
            `SELECT * FROM users WHERE email = $1 LIMIT 1`,
            [email]
        );

        const user = result.rows[0]; // equivalent to findOne
        
        if (!user) {
            throw new Error("User Not Found");
        }

        req.user = user;
        next();

    } catch(err){
        res.status(400).send("Error at userAuth: "+ err.message);
    }
}

module.exports = { userAuth };
