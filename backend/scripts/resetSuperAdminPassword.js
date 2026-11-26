
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("../models/user");

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "mukund2988@gmail.com";
    const newPassword = "9044780906@Mu";

    if (newPassword === "YOUR_NEW_STRONG_PASSWORD") {
      throw new Error("Please set your own password first.");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    const result = await User.updateOne(
      { email, role: "super_admin" },
      { $set: { passwordHash, status: "active" } }
    );

    if (result.matchedCount === 0) {
      console.log("Super Admin account not found.");
    } else {
      console.log("Super Admin password reset successfully!");
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

resetPassword();
