const axios = require("axios");
const User = require("../models/User");
const { haversineDistanceKm } = require("../utils/distance");

async function fallbackNearestDoctor(farmerLocation) {
  const doctors = await User.find({
    role: "doctor",
    availabilityStatus: { $in: ["Available", "On Case"] },
    currentLatitude: { $ne: null },
    currentLongitude: { $ne: null },
  }).lean();

  if (!doctors.length) {
    return null;
  }

  const rankedDoctors = doctors
    .map((doctor) => ({
      doctor,
      distanceKm: haversineDistanceKm(
        farmerLocation.lat,
        farmerLocation.long,
        Number(doctor.currentLatitude),
        Number(doctor.currentLongitude)
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const nearestDoctor = rankedDoctors[0];
  if (!nearestDoctor) {
    return null;
  }

  return {
    doctorId: nearestDoctor.doctor._id,
    doctorCode: nearestDoctor.doctor.doctorId || "",
    distanceKm: Number(nearestDoctor.distanceKm.toFixed(2)),
  };
}

async function fallbackNearestDoctorLegacy(farmerLocation) {
  const doctors = await User.find({
    role: "doctor",
    availabilityStatus: { $in: ["Available", "On Case"] },
    "location.lat": { $ne: null },
    "location.long": { $ne: null },
  }).lean();

  if (!doctors.length) {
    return null;
  }

  const rankedDoctors = doctors
    .map((doctor) => ({
      doctor,
      distanceKm: haversineDistanceKm(
        farmerLocation.lat,
        farmerLocation.long,
        Number(doctor.location.lat),
        Number(doctor.location.long)
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const nearestDoctor = rankedDoctors[0];
  if (!nearestDoctor) {
    return null;
  }

  return {
    doctorId: nearestDoctor.doctor._id,
    doctorCode: nearestDoctor.doctor.doctorId || "",
    distanceKm: Number(nearestDoctor.distanceKm.toFixed(2)),
  };
}

async function assignNearestDoctor({ farmerLocation, problemType }) {
  const pythonApi = process.env.PYTHON_ASSIGNMENT_URL;

  if (pythonApi) {
    try {
      const { data } = await axios.post(`${pythonApi}/assign-doctor`, {
        farmerLocation,
        problemType,
      });

      if (data?.doctorId) {
        return {
          doctorId: data.doctorId,
          doctorCode: data.doctorCode || "",
          distanceKm: typeof data.distanceKm === "number" ? Number(data.distanceKm.toFixed(2)) : null,
        };
      }
    } catch (error) {
      console.log("Python assignment service unavailable. Using fallback assignment.");
    }
  }

  const nearestDoctor = await fallbackNearestDoctor(farmerLocation);
  if (nearestDoctor) {
    return nearestDoctor;
  }

  return fallbackNearestDoctorLegacy(farmerLocation);
}

module.exports = {
  assignNearestDoctor,
};
