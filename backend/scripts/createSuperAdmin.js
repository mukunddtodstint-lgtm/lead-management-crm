
// require("dotenv").config();

// const readline = require("readline");
// const bcrypt = require("bcryptjs");
// const mongoose = require("mongoose");

// const connectDB = require("../config/db");
// const User = require("../models/user");

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

// function ask(question) {
//   return new Promise((resolve) => {
//     rl.question(question, resolve);
//   });
// }

// function askHidden(question) {
//   return new Promise((resolve) => {
//     const stdin = process.stdin;

//     if (!stdin.isTTY) {
//       return resolve(ask(question));
//     }

//     process.stdout.write(question);
//     stdin.setRawMode(true);
//     stdin.resume();

//     let password = "";

//     const onData = (key) => {
//       const char = key.toString();

//       if (char === "\u0003") {
//         process.stdout.write("\n");
//         process.exit(1);
//       }

//       if (char === "\r" || char === "\n") {
//         stdin.removeListener("data", onData);
//         stdin.setRawMode(false);
//         process.stdout.write("\n");
//         resolve(password);
//       } else if (char === "\u007f" || char === "\b") {
//         password = password.slice(0, -1);
//       } else if (char >= " ") {
//         password += char;
//       }
//     };

//     stdin.on("data", onData);
//   });
// }

// async function createSuperAdmin() {
//   try {
//     await connectDB();

//     const email = "mukund2988@gmail.com";

//     const existingUser = await User.findOne({ email });

//     if (existingUser) {
//       console.log("An account with this email already exists.");
//       return;
//     }

//     const name = await ask("Enter Super Admin name: ");
//     const password = await askHidden("Enter Super Admin password: ");

//     if (!name.trim() || password.length < 12) {
//       throw new Error(
//         "Name is required and password must be at least 12 characters."
//       );
//     }

//     const passwordHash = await bcrypt.hash(password, 12);

//     await User.create({
//       name: name.trim(),
//       email,
//       role: "super_admin",
//       companyId: null,
//       employeeId: undefined,
//       passwordHash,
//       status: "active",
//     });

//     console.log("Super Admin created successfully!");
//   } catch (error) {
//     console.error("Setup error:", error.message);
//   } finally {
//     rl.close();
//     await mongoose.disconnect();
//   }
// }

// createSuperAdmin();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("../models/user");

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected Successfully");

    const email = "mukund2988@gmail.com";
    const password = "9044780906@Mu";

    const existingAdmin = await User.findOne({
      email: email.toLowerCase(),
      role: "super_admin",
    });

    if (existingAdmin) {
  console.log("Super Admin already exists!");
  console.log("Registered Email:", existingAdmin.email);
  console.log("Account Status:", existingAdmin.status);
  return;
}
    const passwordHash = await bcrypt.hash(password, 12);

    await User.create({
      name: "Super Admin",
      email,
      role: "super_admin",
      passwordHash,
      status: "active",
    });

    console.log("Super Admin Created Successfully");
    console.log("Email:", email);
    console.log("Temporary Password:", password);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

createSuperAdmin();
