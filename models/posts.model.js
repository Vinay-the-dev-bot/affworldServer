const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  text: { type: String, required: true },
  image: { type: String, required: true },
  createdDate: { type: String },
  userID: { type: String },
  userName: { type: String }
});

const PostsModel = mongoose.model("Post", PostSchema);

module.exports = { PostsModel };
