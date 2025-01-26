const express = require("express");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UserModel } = require("../models/user.model");
const { upload } = require("../middleware/photoUpload.middleware");
const { auth } = require("../middleware/auth.middleware");
const { generateOTP, sendOTP } = require("../middleware/Utility");
const { default: axios } = require("axios");
const dotenv = require("dotenv").config();

const userRouter = express.Router();

userRouter.post("/login", upload.none(), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      res.send({ msg: "User not found" });
    } else {
      bcrypt.compare(password, user.password, async (err, result) => {
        if (result) {
          jwt.sign({ id: user._id }, process.env.loginSecret, (err, token) => {
            if (err) {
              res.send({ msg: "JWT Error", error: `${err}`, status: falses });
            } else {
              const userData = user.toObject();
              delete userData.password;
              delete userData._id;
              res.send({
                msg: "User Logged in",
                token,
                userData,
                status: true
              });
            }
          });
        } else {
          res.send({
            msg: "Wrong Credentials",
            status: false,
            err,
            wrongPassword: true
          });
        }
      });
    }
  } catch (error) {
    res.send({ msg: `${error}` });
  }
});

userRouter.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found", notFound: true });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;

    await user.save();

    res
      .status(200)
      .json({ msg: "Password updated successfully", status: true });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ msg: "Internal server error", status: false });
  }
});

userRouter.get("/send-otp", async (req, res) => {
  const { email } = req.query;
  const decodedEmail = decodeURIComponent(email);
  try {
    const user = await UserModel.findOne({ email: decodedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    const emailSent = await sendOTP(email, otp);
    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send OTP" });
    }
    console.log(otp);
    res.status(200).json({ message: "OTP sent to email successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.post("/register", upload.none(), async (req, res) => {
  const existingUser = await UserModel.findOne({ email: req.body.email });
  if (existingUser) {
    return res.status(409).send({
      msg: "User already exists",
      status: false,
      duplicateAccount: true
    });
  }
  try {
    bcrypt.hash(req.body.password, 5, async (err, hash) => {
      if (hash) {
        try {
          const user = new UserModel({ ...req.body, password: hash });
          await user.save();
          res.send({ msg: "User Registered", user: user, status: true });
        } catch (error) {
          res.send({ msg: `${error}` });
        }
      } else {
        res.send({ msg: `${err}` });
      }
    });
  } catch (error) {
    res.send({ msg: `${error}` });
  }
});

userRouter.post("/posts", async (req, res) => {
  try {
    const { userId } = req.body;
    const data = (await UserModel.find({ email })) || [];
    res.status(200).send({ message: "New post added successfully.", data });
  } catch (err) {
    res.status(400).send({ message: "Bad Request." });
  }
});

module.exports = { userRouter };
