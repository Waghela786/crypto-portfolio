import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// 🔄 Normalize email before saving
userSchema.pre("save", function (next) {
  if (this.isModified("email")) {
    this.email = this.email.trim().toLowerCase();
    console.log("Normalized email before save:", this.email);
  }
  next();
});

// 🔐 Encrypt password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  console.log("Password encrypted for user:", this.email);
  next();
});

// 🔑 Generate JWT
userSchema.methods.getSignedJwtToken = function () {
  const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  console.log("JWT generated for user:", this._id);
  return token;
};

// 🔍 Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  const isMatch = await bcrypt.compare(enteredPassword, this.password);
  console.log("Password match check:", { enteredPassword, isMatch });
  return isMatch;
};

const User = mongoose.model("User", userSchema);

export default User;
