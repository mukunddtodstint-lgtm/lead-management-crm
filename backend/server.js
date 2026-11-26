require("dotenv").config();
console.log("MongoDB URI loaded:", Boolean(process.env.MONGO_URI));

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`CRM Backend running on port ${PORT}`);
  });
};

startServer();