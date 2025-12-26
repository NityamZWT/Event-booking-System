const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sequelize = require("./config/db");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
dotenv.config();
const port = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use('/api', require('./routers/'))

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Global error handler
app.use(errorHandler);

const startServer = async () => {
  try {
    console.log("\n Starting Event Booking System V1...\n");
    await sequelize.authenticate();
    console.log("Database connection established");

    await sequelize.sync({ alter: false });
    console.log("Database models synchronized");
    // ============== Start HTTP Server ==============
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  console.log(`\n ${signal} signal received: shutting down gracefully...`);

  try {
    // Close database connection
    await sequelize.close();
    console.log("Database connection closed!");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("UNHANDLED_REJECTION");
});

startServer();
