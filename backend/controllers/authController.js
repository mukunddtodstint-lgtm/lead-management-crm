
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Company = require("../models/company");

const login = async (req, res) => {
  try {
    const { email, companyId, employeeId, password } = req.body;

    if (!password || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
      });
    }

    let user;

    // Super Admin login using email
    if (typeof email === "string" && email.trim()) {
      user = await User.findOne({
        email: email.toLowerCase().trim(),
        role: "super_admin",
      }).select("+passwordHash");
    }

    // Company CEO, Sales Manager and Sales Executive login
    else if (
      typeof companyId === "string" &&
      companyId.trim() &&
      typeof employeeId === "string" &&
      employeeId.trim()
    ) {
      const company = await Company.findOne({
        companyId: companyId.trim().toUpperCase(),
        status: "active",
      });

      if (!company) {
        return res.status(401).json({
          success: false,
          message: "Invalid login credentials.",
        });
      }

      user = await User.findOne({
        companyId: company._id,
        employeeId: employeeId.trim().toUpperCase(),
        role: {
          $in: [
            "company_ceo",
            "sales_manager",
            "sales",
            "company_admin",
          ],
        },
      }).select("+passwordHash");
    } else {
      return res.status(400).json({
        success: false,
        message: "Provide email or Company ID and Employee ID.",
      });
    }

    if (!user || user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Invalid login credentials or inactive account.",
      });
    }

    // Verify company is active for all company users
    if (user.role !== "super_admin") {
      const activeCompany = await Company.findOne({
        _id: user.companyId,
        status: "active",
      });

      if (!activeCompany) {
        return res.status(401).json({
          success: false,
          message: "Company account is inactive.",
        });
      }
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid login credentials.",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in environment variables.");
    }

    const token = jwt.sign(
      {
        userId: user._id,
        companyId: user.companyId,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email || null,
        employeeId: user.employeeId || null,
        companyId: user.companyId || null,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

module.exports = {
  login,
};
