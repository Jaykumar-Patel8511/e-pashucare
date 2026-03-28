require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./server/routes/authRoutes");
const registerRoutes = require("./server/routes/registerRoutes");
const animalRoutes = require("./server/routes/animalRoutes");
const caseRoutes = require("./server/routes/caseRoutes");
const reportRoutes = require("./server/routes/reportRoutes");
const adminRoutes = require("./server/routes/adminRoutes");
const doctorRoutes = require("./server/routes/doctorRoutes");
const farmerRoutes = require("./server/routes/farmerRoutes");
const { setSocket } = require("./server/services/socketService");

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

async function startServer() {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Backend server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    process.exit(1);
  }
}

startServer();
