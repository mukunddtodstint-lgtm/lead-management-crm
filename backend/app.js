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

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Lead Management CRM API is running"
  });
});
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

app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/google-sheets", googleSheetsRoutes);
app.use("/api/google-sheets/sheets", googleSheetRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/sales-targets", salesTargetRoutes);
app.use("/api/dashboard", dashboardRoutes);

module.exports = app;
