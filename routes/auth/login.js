const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const uuid = require("uuid");
const User = require("../../models/User");

// Log in an existing user
router.post("/", async (req, res) => {
  try {
    // Find the user with the specified email address
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).send({ error: "Invalid email or password" });
    }

    // Check if the user has a verification code
    if (user.verificationCode && user.verificationCodeExpiration > Date.now()) {
      // Check if the provided code matches the stored code
      if (user.verificationCode !== req.body.verificationCode) {
        return res.status(401).send({ error: "Invalid verification code" });
      }

      // Compare the provided password with the hashed password in the database
      const isValidPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (!isValidPassword) {
        return res.status(401).send({ error: "Invalid email or password" });
      }
    } else {
      // Compare the provided password with the hashed password in the database
      const isValidPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (!isValidPassword) {
        return res.status(401).send({ error: "Invalid email or password" });
      }
    }

    // Generate a JWT and send it in the response
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    //store token in express session for later use
    req.session.token = token;
    res.send({ message: "Logged in successfully", token: token });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
