const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String },
    profileImage: { type: String },
    backgroundImage: { type: String }
  },
  {
    versionKey: false
  }
);

const UserModel = mongoose.model("users", userSchema);

module.exports = { UserModel };
