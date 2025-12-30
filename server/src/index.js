const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();
const db = require("./models");
const routes = require("./routers");
const errorHandler = require("./middlewares/errorMiddleware");

const app = express();
const { sequelize } = db;

app.use(helmet());
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("connected!!");
    await sequelize.sync({
      alter: false,
      force: false,
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
  console.error("Server startup failed:", error);
  process.exit(1);
}
};

const gracefulShutdown = async (signal) => {
  try {
    await sequelize.close();
    console.log(`${signal}`);
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", () => {
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", () => {
  gracefulShutdown("UNHANDLED_REJECTION");
});

startServer();
module.exports = app;
