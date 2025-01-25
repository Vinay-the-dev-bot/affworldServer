const express = require("express");
const multer = require("multer");
const path = require("path");
const { PostsModel } = require("../models/posts.model");
const { auth } = require("../middleware/auth.middleware");
const { currentTime } = require("../middleware/Utility");
const { UserModel } = require("../models/user.model");
const postsRouter = express.Router();
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: "dnaqpqpt1",
  api_key: "769349248391996",
  api_secret: process.env.CLOUDINARY_SECRET
});

const storage = multer.diskStorage({});
const upload = multer({ storage });

postsRouter.post("/post", auth, upload.array("image"), async (req, res) => {
  try {
    const { postText } = req.body;
    const { userID } = req;
    let uploadedImages = "";
    const createdDate = currentTime();
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "posts"
        });
        uploadedImages = result.secure_url;
      }
    }
    const { name } = await UserModel.findOne({ _id: userID });
    try {
      const post = new PostsModel({
        text: postText,
        image: uploadedImages,
        createdDate,
        userID,
        userName: name
      });

      const newPost = await post.save();

      res.json({
        message: "Post uploaded successfully!",
        postText,
        fileUrls: uploadedImages,
        status: true,
        newPost: { ...newPost.toObject(), id: newPost._id.toString() }
      });
    } catch (err) {
      res
        .status(500)
        .json({ message: "There was an error", error, status: false });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "There was an error", error, status: false });
  }
});

postsRouter.get("/", auth, async (req, res) => {
  const { userID } = req;
  try {
    const posts = await PostsModel.find();
    const mappedPosts = posts.map((post) => ({
      ...post.toObject(),
      id: post._id.toString()
    }));
    res.json({
      message: "Posts fetched successfully",
      posts: mappedPosts,
      status: true
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      message: "There was an error fetching posts",
      status: false
    });
  }
});

module.exports = { postsRouter };
