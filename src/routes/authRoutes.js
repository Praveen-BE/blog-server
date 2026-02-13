const express = require("express");
const bcrypt = require("bcrypt");
const {validateSignUpData, validateSignInData} = require("../utlls/validation");
const authRouter = express.Router();
const pool = require("../config/database");
const jwt = require("jsonwebtoken");
require('dotenv').config();


authRouter.post("/signup", async(req, res)=>{
    try{
        //validation
        // console.log(req);
        // console.log(req.body); // This works
        validateSignUpData(req);

        // Encrypt the Password
        // console.log(req.body); // this is not work
        const { name, email,  password ,bio} = req.body;
        const passwordHash = await bcrypt.hash(password, 10);

        //Insert into Postgres 
        const result = await pool.query(
            `INSERT INTO users (name, email, password, bio)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, bio, created_at, updated_at`,
            [name, email, passwordHash, bio]
        );
        // console.log(result);

        const user = result.rows[0]; 
        // Generate JWT 
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET , { expiresIn: "7d", }); 
        
        res.cookie("token", token, { expires: new Date(Date.now() + 7 * 3600000), });

        res.json({ message: "User Added Successfully", data: user });
    } catch(err){
        res.status(400).send("ERROR : signup :" + err.message);
    }
});

authRouter.post("/login", async (req, res) => {
  try {
    // validate signin data
    console.log(req.body);
    validateSignInData(req);

    // console.log(req);
    const { email, password } = req.body;
    const result = await pool.query(
        `SELECT * FROM users WHERE email = $1 LIMIT 1`,
        [email]
    );

    const user = result.rows[0]; // equivalent to findOne

    if (!user) {
      throw new Error("Invalid Credintials...");
    }
    // Compare password with hashed password in DB 
    const isPasswordValid = await bcrypt.compare(password, user.password); 
    if (!isPasswordValid) { throw new Error("Invalid Credentials..."); }

    if (isPasswordValid) {
      // Generate JWT 
      const token = jwt.sign( { id: user.id, email: user.email }, // payload 
      process.env.JWT_SECRET, // secret key 
      { expiresIn: "7d" } // options 
      );

      // Set cookie
      res.cookie("token", token, { 
        httpOnly: true, // prevents JS access to cookie 
        secure: false, // set true if using HTTPS 
        sameSite: "lax", // avoids rejection without HTTPS
        expires: new Date(Date.now() + 7 * 3600000), 
      });

    // Send response
    res.json({ message: "Login successful", 
        user: { id: user.id, name: user.name, email: user.email, bio: user.bio, }, token, });
    } else {
      throw new Error("Invalid Credintials...");
    }
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
  });

  res.send("Logout Successfully...");
});

module.exports = authRouter;
