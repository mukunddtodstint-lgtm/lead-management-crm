
const bcrypt = require("bcryptjs");

const User = require("../models/user");
const Company = require("../models/Company");

// Helper: Create a company user
const createCompanyUser = async ({
  name,
  email,
  employeeId,
  companyId,
  password,
  role,
}) => {
  const passwordHash = await bcrypt.hash(password, 12);

  return User.create({
    name: name.trim(),
    email: email ? email.trim().toLowerCase() : undefined,
    employeeId: employeeId.trim().toUpperCase(),
    companyId,
    role,
    passwordHash,
  });
};

// 1. Super Admin creates Company CEO
const createCompanyCEO = async (req, res) => {
  try {
    const { name, email, employeeId, companyId, password } = req.body;

    if (!name || !employeeId || !companyId || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, Employee ID, Company ID and Password are required.",
      });
    }

    if (typeof password !== "string" || password.length < 12) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 12 characters.",
      });
    }

    const company = await Company.findById(companyId);

    if (!company || company.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Active company not found.",
      });
    }

    const existingUser = await User.findOne({
      companyId: company._id,
      employeeId: employeeId.trim().toUpperCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Employee ID already exists in this company.",
      });
    }

    const user = await createCompanyUser({
      name,
      email,
      employeeId,
      companyId: company._id,
      password,
      role: "company_ceo",
    });

    return res.status(201).json({
      success: true,
      message: "Company CEO created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email || null,
        employeeId: user.employeeId,
        companyId: user.companyId,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Create Company CEO Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create Company CEO.",
    });
  }
};

// 2. Company CEO creates Sales Manager / Head of Sales
const createSalesManager = async (req, res) => {
  try {
    const { name, email, employeeId, password } = req.body;

    if (!name || !employeeId || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, Employee ID and Password are required.",
      });
    }

    if (typeof password !== "string" || password.length < 12) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 12 characters.",
      });
    }

    const existingUser = await User.findOne({
      companyId: req.user.companyId,
      employeeId: employeeId.trim().toUpperCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Employee ID already exists in your company.",
      });
    }

    const user = await createCompanyUser({
      name,
      email,
      employeeId,
      companyId: req.user.companyId,
      password,
      role: "sales_manager",
    });

    return res.status(201).json({
      success: true,
      message: "Sales Manager created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email || null,
        employeeId: user.employeeId,
        companyId: user.companyId,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Create Sales Manager Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create Sales Manager.",
    });
  }
};

// 3. Sales Manager creates Sales Executive
const createSalesExecutive = async (req, res) => {
  try {
    const { name, email, employeeId, password } = req.body;

    if (!name || !employeeId || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, Employee ID and Password are required.",
      });
    }

    if (typeof password !== "string" || password.length < 12) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 12 characters.",
      });
    }

    const existingUser = await User.findOne({
      companyId: req.user.companyId,
      employeeId: employeeId.trim().toUpperCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Employee ID already exists in your company.",
      });
    }

    const user = await createCompanyUser({
      name,
      email,
      employeeId,
      companyId: req.user.companyId,
      password,
      role: "sales",
    });

    return res.status(201).json({
      success: true,
      message: "Sales Executive created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email || null,
        employeeId: user.employeeId,
        companyId: user.companyId,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Create Sales Executive Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create Sales Executive.",
    });
  }
};

// 4. Get Employees with company-level isolation
const getEmployees = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};

    if (req.user.role === "super_admin") {
      if (req.query.companyId) {
        filter.companyId = req.query.companyId;
      }
    } else {
      filter.companyId = req.user.companyId;
    }

    let allowedEmployeeRoles = [];

    if (req.user.role === "super_admin") {
      allowedEmployeeRoles = [
        "company_ceo",
        "sales_manager",
        "sales",
        "company_admin",
      ];
    } else if (req.user.role === "company_ceo") {
      allowedEmployeeRoles = ["sales_manager", "sales"];
    } else if (req.user.role === "sales_manager") {
      allowedEmployeeRoles = ["sales"];
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view employees.",
      });
    }

    if (role) {
      if (!allowedEmployeeRoles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this employee role.",
        });
      }

      filter.role = role;
    } else {
      filter.role = { $in: allowedEmployeeRoles };
    }

    const employees = await User.find(filter)
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (error) {
    console.error("Get Employees Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch employees.",
    });
  }
};

module.exports = {
  createCompanyCEO,
  createSalesManager,
  createSalesExecutive,
  getEmployees,

  // Temporary compatibility for the existing route
  createCompanyAdmin: createCompanyCEO,
};
