import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: [true, "Username must be unique"],
    trim: true,
    minlength: [3, "Username must be at least 3 characters long"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: [true, "Email must be unique"],
    trim: true
  },
  password: {
    type: String, 
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const userModel = mongoose.model("User", userSchema);

export default userModel;