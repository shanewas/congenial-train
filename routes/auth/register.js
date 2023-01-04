const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const uuid = require("uuid");
const User = require("../../models/User");

// Create a new user
router.post("/", async (req, res) => {
  try {
    // Check if a user with the same email address already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res
        .status(400)
        .send({ error: "A user with this email address already exists" });
    }

    // Check if the email address is valid
    const emailRegex =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).send({ error: "Invalid email address" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Create a new user
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });

    // Generate a verification code and send an email to the user
    const code = Math.floor(1000 + Math.random() * 9000);

    w.verificationCode = code;
    user.verificationCodeExpiration = Date.now() + 15 * 60 * 1000; // 15 minutes from now
    await user.save();

    // // create a transporter object using the Sendgrid transport
    // let transporter = nodemailer.createTransport({
    //   service: "Sendgrid",
    //   auth: {
    //     api_key: process.env.SENDGRID_API,
    //   },
    // });
    // // Send an email to the user with the verification code
    // transporter.sendMail({
    //   from: "lindsayjmack1920@outlook.com",
    //   to: req.body.email,
    //   subject: "Verify your email address",
    //   text: `Your verification code is: ${code}. This code will expire in 15 minutes.`,
    // });

    res.send({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
