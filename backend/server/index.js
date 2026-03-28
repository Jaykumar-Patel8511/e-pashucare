require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { Server } = require("socket.io");
const authRoutes = require("./routes/authRoutes");
const registerRoutes = require("./routes/registerRoutes");
const animalRoutes = require("./routes/animalRoutes");
const caseRoutes = require("./routes/caseRoutes");
const reportRoutes = require("./routes/reportRoutes");
const adminRoutes = require("./routes/adminRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const farmerRoutes = require("./routes/farmerRoutes");
const { setSocket } = require("./services/socketService");

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  "http://localhost:5173",
  "http://localhost:5174",
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
};

const io = new Server(server, {
  cors: corsOptions,
});

setSocket(io);

io.on("connection", (socket) => {
  socket.on("join", ({ role, userId }) => {
    if (role === "admin") {
      socket.join("admin");
    }
    if (role === "farmer") {
      socket.join(`farmer:${userId}`);
    }
    if (role === "doctor") {
      socket.join(`doctor:${userId}`);
    }
  });
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/animals", animalRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/farmer", farmerRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});

const PORT = Number(process.env.PORT || 4000);
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/epashucare";
const ALLOW_IN_MEMORY_DB = (process.env.ALLOW_IN_MEMORY_DB || "true") === "true";

async function connectMongo() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Mongo connected: ${MONGO_URI}`);
  } catch (error) {
    if (!ALLOW_IN_MEMORY_DB) {
      throw error;
    }

    console.warn("Primary MongoDB unavailable. Starting in-memory MongoDB for development.");
    const memoryServer = await MongoMemoryServer.create({
      instance: { dbName: "epashucare" },
    });
    const memoryUri = memoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log(`Mongo connected (in-memory): ${memoryUri}`);
  }
}

connectMongo()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Backend server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Mongo connection error:", error.message);
    process.exit(1);
  });
