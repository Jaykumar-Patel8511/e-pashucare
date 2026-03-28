const User = require("../models/User");
const { DOCTOR_STATUSES, updateDoctorLocation, updateDoctorAvailability } = require("../services/locationTrackingService");

function normalizeSpecialization(value) {
  return String(value || "").trim().toLowerCase();
}

async function updateMyLocation(req, res) {
  const { latitude, longitude, timestamp, availabilityStatus } = req.body;

  const doctor = await updateDoctorLocation({
    userId: req.user.id,
    latitude,
    longitude,
    timestamp,
    availabilityStatus,
  });

  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  return res.status(200).json(doctor);
}

async function updateMyAvailability(req, res) {
  const { availabilityStatus } = req.body;

  if (!Object.values(DOCTOR_STATUSES).includes(availabilityStatus)) {
    return res.status(400).json({ message: "Invalid availability status" });
  }

  const doctor = await updateDoctorAvailability({ userId: req.user.id, availabilityStatus });
  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  return res.status(200).json(doctor);
}

async function getMyDoctorStatus(req, res) {
  const doctor = await User.findOne({ _id: req.user.id, role: "doctor" }).select(
    "doctorId doctorName name specialization availabilityStatus currentLatitude currentLongitude lastLocationUpdate"
  );

  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  return res.status(200).json(doctor);
}

async function getMyDoctorProfile(req, res) {
  const doctor = await User.findOne({ _id: req.user.id, role: "doctor" }).select(
    "doctorId doctorName name email phone mobile specialization createdAt"
  );

  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  return res.status(200).json({
    doctorId: doctor.doctorId || "",
    doctorName: doctor.doctorName || doctor.name || "",
    email: doctor.email || "",
    phone: doctor.phone || doctor.mobile || "",
    specialization: doctor.specialization || "general",
    createdAt: doctor.createdAt,
  });
}

async function updateMyDoctorProfile(req, res) {
  const { doctorName, email, phone, specialization } = req.body;

  const doctor = await User.findOne({ _id: req.user.id, role: "doctor" });
  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (normalizedEmail !== doctor.email) {
    const existingByEmail = await User.findOne({ email: normalizedEmail, _id: { $ne: doctor._id } });
    if (existingByEmail) {
      return res.status(409).json({ message: "Email already exists" });
    }
  }

  doctor.name = String(doctorName || "").trim();
  doctor.doctorName = doctor.name;
  doctor.email = normalizedEmail;
  doctor.phone = String(phone || "").trim();
  doctor.mobile = doctor.phone;
  doctor.specialization = normalizeSpecialization(specialization);

  await doctor.save();

  return res.status(200).json({
    doctorId: doctor.doctorId || "",
    doctorName: doctor.doctorName || doctor.name || "",
    email: doctor.email || "",
    phone: doctor.phone || doctor.mobile || "",
    specialization: doctor.specialization || "general",
    createdAt: doctor.createdAt,
  });
}

module.exports = {
  updateMyLocation,
  updateMyAvailability,
  getMyDoctorStatus,
  getMyDoctorProfile,
  updateMyDoctorProfile,
};
