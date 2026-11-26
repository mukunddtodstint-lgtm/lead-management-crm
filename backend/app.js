
const session = require("express-session");
const express = require("express");
const cors = require("cors");

const googleSheetsRoutes = require("./routes/googleSheetsRoutes");
const googleSheetRoutes = require("./routes/googleSheetRoutes");
const leadRoutes = require("./routes/leadRoutes");

const authRoutes = require("./routes/authRoutes");
const companyRoutes = require("./routes/companyRoutes");
const userRoutes = require("./routes/userRoutes");
const salesTargetRoutes = require("./routes/salesTargetRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://lead-management-crm-five.vercel.app"
];

// CORS Configuration
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ]
  })
);

// Middleware
app.use(express.json());

// Backend Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Lead Management CRM API is running"
  });
});

// Session Configuration
app.use(
  session({
    name: "crm.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60 * 1000
    }
  })
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/users", userRoutes);

app.use("/api/google-sheets", googleSheetsRoutes);
app.use("/api/google-sheets/sheets", googleSheetRoutes);

app.use("/api/leads", leadRoutes);
app.use("/api/sales-targets", salesTargetRoutes);
app.use("/api/dashboard", dashboardRoutes);

module.exports = app;
