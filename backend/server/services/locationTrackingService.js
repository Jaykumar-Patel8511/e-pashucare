const User = require("../models/User");

const DOCTOR_STATUSES = {
  AVAILABLE: "Available",
  ON_CASE: "On Case",
  OFFLINE: "Offline",
};

async function updateDoctorLocation({ userId, latitude, longitude, timestamp, availabilityStatus }) {
  const update = {
    currentLatitude: Number(latitude),
    currentLongitude: Number(longitude),
    lastLocationUpdate: timestamp ? new Date(timestamp) : new Date(),
  };

  if (availabilityStatus && Object.values(DOCTOR_STATUSES).includes(availabilityStatus)) {
    update.availabilityStatus = availabilityStatus;
    update.isAvailable = availabilityStatus === DOCTOR_STATUSES.AVAILABLE;
  }

  const doctor = await User.findOneAndUpdate({ _id: userId, role: "doctor" }, update, {
    new: true,
    runValidators: true,
  }).select("doctorId doctorName name currentLatitude currentLongitude lastLocationUpdate availabilityStatus isAvailable");

  return doctor;
}

async function updateDoctorAvailability({ userId, availabilityStatus }) {
  const update = {
    availabilityStatus,
    isAvailable: availabilityStatus === DOCTOR_STATUSES.AVAILABLE,
  };

  const doctor = await User.findOneAndUpdate({ _id: userId, role: "doctor" }, update, {
    new: true,
    runValidators: true,
  }).select("doctorId doctorName name currentLatitude currentLongitude lastLocationUpdate availabilityStatus isAvailable");

  return doctor;
}

module.exports = {
  DOCTOR_STATUSES,
  updateDoctorLocation,
  updateDoctorAvailability,
};
