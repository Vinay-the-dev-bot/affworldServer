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

let otpStore = {};

const googleTokenUrl = "https://oauth2.googleapis.com/token";

userRouter.post("/google-login", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res
      .status(400)
      .json({ status: false, msg: "Authorization code is required" });
  }

  try {
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code"
      }
    );

    const { access_token, id_token } = tokenResponse.data;

    if (!access_token || !id_token) {
      return res
        .status(400)
        .json({ status: false, msg: "Failed to get access token from Google" });
    }
    var sub, name, email, picture;
    try {
      const userInfoResponse = await axios.get(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${id_token}`
      );
      var { sub, name, email, picture } = userInfoResponse.data;
    } catch (error) {
      console.log("ERRR", error);
    }

    // Step 3: Check if the user exists in the database
    let user = await UserModel.findOne({ googleId: sub });

    if (!user) {
      // If user doesn't exist, create a new user
      user = new UserModel({
        googleId: sub,
        name,
        email,
        profilePicture: picture
      });

      await user.save();
    }

    const payload = { userId: user._id, email: user.email };
    const token = jwt.sign(payload, process.env.loginSecret);

    return res.status(200).json({
      status: true,
      msg: "Login successful",
      token,
      userData: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    return res
      .status(500)
      .json({ status: false, msg: "Internal server error" });
  }
});

userRouter.get("/google/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Authorization code not found");
  }

  try {
    const response = await axios.post(googleTokenUrl, null, {
      params: {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: "authorization_code"
      }
    });

    const accessToken = response.data.access_token;

    const userInfo = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    res.json(userInfo.data);
  } catch (error) {
    console.error("Error exchanging authorization code:", error);
    res.status(500).send("An error occurred");
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
  const decodedEmail = decodeURIComponent(email); // Decoding the URL-encoded email
  console.log("Decoded email:", decodedEmail);
  console.log("EMAIL", decodedEmail);
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

userRouter.get("/feed", async (req, res) => {
  try {
    const { email } = req.body;
    res.status(200).send({ message: "New post added successfully.", email });
  } catch (err) {
    res.status(400).send({ message: "Bad Request." });
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
