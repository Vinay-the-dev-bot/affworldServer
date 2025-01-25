const express = require("express");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { TasksModel } = require("../models/tasks.model");
const { auth } = require("../middleware/auth.middleware");
const { currentTime } = require("../middleware/Utility");
const dotenv = require("dotenv").config();

const tasksRouter = express.Router();

tasksRouter.post("/new", auth, async (req, res) => {
  try {
    const { name, status, dueDate, priority, description } = req.body;
    const { userID } = req;
    const formattedDate = currentTime();
    const task = new TasksModel({
      name,
      status,
      createdDate: formattedDate,
      dueDate,
      priority,
      userID,
      description
    });
    const newTask = await task.save();

    res.json({
      message: "Task created successfully!",
      task,
      status: true,
      newTask: { ...newTask.toObject(), id: newTask._id.toString() }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: `${error}`, status: false });
  }
});

tasksRouter.delete("/:taskId", auth, async (req, res) => {
  const { userID } = req;
  const { taskId } = req.params;

  try {
    const task = await TasksModel.findOne({ userID, _id: taskId });

    if (!task) {
      return res.status(404).json({
        message: "Task not found or you don't have permission to delete it.",
        status: false
      });
    }

    await TasksModel.deleteOne({ _id: taskId });

    res.json({
      message: "Task deleted successfully",
      status: true
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({
      message: "There was an error deleting the task",
      status: false
    });
  }
});

tasksRouter.get("/", auth, async (req, res) => {
  const { userID } = req;
  try {
    const tasks = await TasksModel.find({ userID });
    const mappedTasks = tasks.map((task) => ({
      ...task.toObject(),
      id: task._id.toString()
    }));
    res.json({
      message: "Tasks fetched successfully",
      tasks: mappedTasks,
      status: true
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({
      message: "There was an error fetching tasks",
      status: false
    });
  }
});

module.exports = { tasksRouter };
