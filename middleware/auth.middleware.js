const jwt = require("jsonwebtoken");
const { UserModel } = require("../models/user.model");
const dotenv = require("dotenv").config();
// const { blackListTokenModel } = require("../models/blacklist.model");

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.loginSecret);
      if (decoded) {
        req.userID = decoded.id;
        next();
      } else {
        res.status(400).json({ msg: "You Don't have token" });
      }
    } catch (err) {
      res.status(400).json({ msg: "You Don't have token" });
      console.log(err);
    }
  } else {
    res.json({ msg: "Please Login " });
  }
};

module.exports = {
  auth
};
