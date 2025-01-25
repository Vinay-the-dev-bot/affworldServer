const express = require("express");
require("dotenv").config();
const { connection } = require("./config/db");
const { userRouter } = require("./routes/user.route");
const { tasksRouter } = require("./routes/tasks.route");
const cors = require("cors");
const { postsRouter } = require("./routes/posts.route");

const app = express();
app.use(express.json());
app.use(cors());
app.use("/post", postsRouter);
app.use("/users", userRouter);
app.use("/tasks", tasksRouter);

app.get("/", (req, res) => {
  res.send("Welcome to home page");
});

app.listen(process.env.port, async () => {
  try {
    await connection;
    console.log(`Server is running at http://localhost:${process.env.port}`);
    console.log("affworld database is connected..");
  } catch (err) {
    console.log(err);
  }
});
