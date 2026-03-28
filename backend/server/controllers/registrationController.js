const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const DOCTOR_CATEGORY_MAP = {
  General: "general",
  Surgery: "surgery",
  Reproduction: "reproduction",
  "Veterinary Specialist": "veterinary specialist",
  "Emergency Care": "emergency care",
  "Artificial Insemination": "artificial insemination",
};

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
    },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "7d" }
  );
}

function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }
  if (typeof value === "number") {
    return value === 1;
  }
  return false;
}

async function register(req, res) {
  const {
    name,
    email,
    password,
    role,
    phone,
    address,
    village,
    city,
    district,
    state,
    pincode,
    latitude,
    longitude,
    sabhasadId,
    dairyId,
    sabhasadMember,
    isSabhasadMember,
    doctorId,
    doctorCategory,
    adminId,
  } = req.body;

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const resolvedSabhasadMember = role === "farmer" ? parseBoolean(sabhasadMember ?? isSabhasadMember) : false;

  if (role === "farmer") {
    const normalizedSabhasadId = resolvedSabhasadMember ? String(sabhasadId || "").trim() : "";
    if (normalizedSabhasadId) {
      const existingFarmerId = await User.findOne({ role: "farmer", sabhasadId: normalizedSabhasadId });
      if (existingFarmerId) {
        return res.status(409).json({ message: "Sabhasad ID already exists" });
      }
    }
  }

  if (role === "doctor") {
    const normalizedDoctorId = String(doctorId || "").trim();
    if (normalizedDoctorId) {
      const existingDoctorId = await User.findOne({ role: "doctor", doctorId: normalizedDoctorId });
      if (existingDoctorId) {
        return res.status(409).json({ message: "Doctor ID already exists" });
      }
    }
  }

  if (role === "admin") {
    const normalizedAdminId = String(adminId || "").trim();
    if (normalizedAdminId) {
      const existingAdminId = await User.findOne({ role: "admin", adminId: normalizedAdminId });
      if (existingAdminId) {
        return res.status(409).json({ message: "Admin ID already exists" });
      }
    }
  }

  const hashedPassword = await bcrypt.hash(String(password || ""), 10);

  const payload = {
    name: String(name).trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role,
    phone: String(phone).trim(),
    mobile: String(phone).trim(),
    address: role === "doctor" ? "" : String(address).trim(),
    village: village ? String(village).trim() : "",
    city: city ? String(city).trim() : "",
    district: district ? String(district).trim() : "",
    state: state ? String(state).trim() : "",
    pincode: pincode ? String(pincode).trim() : "",
    location:
      role === "doctor"
        ? undefined
        : {
            lat: Number(latitude),
            long: Number(longitude),
          },
    isVerified: true,
  };

  if (role === "farmer") {
    payload.sabhasadMember = resolvedSabhasadMember;
    payload.isSabhasadMember = resolvedSabhasadMember;
    payload.sabhasadId = resolvedSabhasadMember ? String(sabhasadId || "").trim() || null : null;
    payload.dairyId = resolvedSabhasadMember ? String(dairyId || "").trim() || null : null;
  }

  if (role === "doctor") {
    const resolvedCategory = doctorCategory || "General";
    payload.doctorId = doctorId ? String(doctorId).trim() : "";
    payload.doctorName = String(name).trim();
    payload.doctorCategory = resolvedCategory;
    payload.specialization = DOCTOR_CATEGORY_MAP[resolvedCategory] || "general";
    payload.availabilityStatus = "Available";
    payload.isAvailable = true;
  }

  if (role === "admin") {
    payload.adminId = adminId ? String(adminId).trim() : "";
  }

  const user = await User.create(payload);
  const token = signToken(user);

  return res.status(201).json({
    message: "Account created successfully",
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

module.exports = {
  register,
};
