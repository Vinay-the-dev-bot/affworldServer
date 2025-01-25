const mongoose = require("mongoose");

const tasksSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Done"],
      default: "Pending"
    },
    createdDate: { type: String },
    userID: { type: String },
    dueDate: { type: String },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    },
    description: { type: String }
  },
  {
    versionKey: false
  }
);

const TasksModel = mongoose.model("tasksSchema", tasksSchema);

module.exports = { TasksModel };
