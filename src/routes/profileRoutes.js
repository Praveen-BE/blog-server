const express = require('express');
const profileRouter = express.Router();
require("dotenv").config();
const pool = require("../config/database");
const jwt = require("jsonwebtoken");

// Get user data by using token
// 👦dock dock , 👧Yaaru?, 👦Nandhan
profileRouter.get('/nanthan', async(req, res) => {
  const {token }= req.cookies; // read cookie named "token"
  // console.log(token);

  if (!token) {
    return res.status(401).json({ message: "No token found" });
  }

  try {
    // Verify JWT (replace "yourSecretKey" with your actual secret)
    const decodeObj = await jwt.verify(token, process.env.JWT_SECRET);
    //  console.log(decodeObj);
    const { id, email } = decodeObj;
   

    // find is user email is available
    const result = await pool.query(
        `SELECT * FROM users WHERE email = $1 LIMIT 1`,
        [email]
    );
    // console.log(result);

    const user = result.rows[0]; // equivalent to findOne

    res.json({ user: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        created_at: user.created_at,
        updated_at: user.updated_at
    }});
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
});

module.exports = profileRouter;