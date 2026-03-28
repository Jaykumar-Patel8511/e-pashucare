const Case = require("../models/Case");
const User = require("../models/User");
const Animal = require("../models/Animal");
const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Report = require("../models/Report");
const { CASE_STATUS } = require("../utils/constants");
const { calculateVisitFee, isDayTime } = require("../utils/feeCalculator");
const { assignNearestDoctor } = require("../services/doctorAssignmentService");
const { sendMail } = require("../services/mailService");
const { emitCaseUpdate } = require("../services/socketService");

const COW_PROBLEMS = new Set([
  "Fever",
  "Mastitis",
  "Foot and Mouth Disease",
  "Bloat",
  "Milk Fever",
  "Lameness",
  "Loss of Appetite",
  "Skin Infection",
  "Calving Problems",
  "Diarrhea",
]);

const BUFFALO_PROBLEMS = new Set([
  "Fever",
  "Mastitis",
  "Foot Rot",
  "Bloat",
  "Milk Fever",
  "Tick Infection",
  "Skin Disease",
  "Weakness",
  "Digestion Problem",
  "Calving Issues",
]);

function toTitleCase(value) {
  if (!value) {
    return "Animal";
  }
  const normalized = String(value).trim().toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatCaseId(id) {
  const raw = String(id || "");
  return `CASE${raw.slice(-6).toUpperCase()}`;
}

function normalizeCoordinate(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeAnimalType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "cow") {
    return "Cow";
  }
  if (normalized === "buffalo") {
    return "Buffalo";
  }
  return "";
}

function buildFormalLocation(item) {
  const fallback = item?.formalLocation || {};
  const farmer = item?.farmerId || {};

  const latitude =
    normalizeCoordinate(fallback.latitude) ??
    normalizeCoordinate(farmer?.location?.lat);
  const longitude =
    normalizeCoordinate(fallback.longitude) ??
    normalizeCoordinate(farmer?.location?.long);

  const parts = [
    fallback.addressLine,
    farmer?.address,
    farmer?.village,
    farmer?.city,
    farmer?.district,
    farmer?.state,
    farmer?.pincode,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  const addressLine = parts.join(", ");
  return {
    addressLine,
    latitude,
    longitude,
  };
}

function formatFormalLocationText(formalLocation) {
  if (formalLocation?.addressLine) {
    return formalLocation.addressLine;
  }

  if (typeof formalLocation?.latitude === "number" && typeof formalLocation?.longitude === "number") {
    return `${formalLocation.latitude.toFixed(5)}, ${formalLocation.longitude.toFixed(5)}`;
  }

  return "Location unavailable";
}

function enrichCasePayload(item) {
  const databaseId = String(item._id);
  const animalType = item?.animalType || item?.animalId?.type || "Animal";
  const farmerName = item?.farmerName || item?.farmerId?.name || "Unknown Farmer";
  const problem = item?.problem || item?.description || item?.problemType || "Unknown";
  const formalLocation = buildFormalLocation(item);

  return {
    ...item,
    farmerId: item?.farmerId?._id ? String(item.farmerId._id) : item?.farmerId,
    doctorId: item?.doctorId?._id ? String(item.doctorId._id) : item?.doctorId,
    databaseId,
    caseId: item?.caseId || formatCaseId(databaseId),
    farmerName,
    animalType,
    problem,
    caseType: item?.caseType || `${item?.problemType === "emergency" ? "Emergency" : "Sick"} ${toTitleCase(animalType)}`,
    formalLocation,
    formalLocationText: item?.formalLocationText || formatFormalLocationText(formalLocation),
  };
}

function sortDoctorCases(a, b) {
  const aDistance = typeof a.caseDistanceKm === "number" ? a.caseDistanceKm : Number.POSITIVE_INFINITY;
  const bDistance = typeof b.caseDistanceKm === "number" ? b.caseDistanceKm : Number.POSITIVE_INFINITY;

  if (aDistance !== bDistance) {
    return aDistance - bDistance;
  }

  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

async function createCase(req, res) {
  const { animalId, problemType, description } = req.body;
  const farmer = await User.findById(req.user.id);

  if (!farmer) {
    return res.status(404).json({ message: "Farmer not found" });
  }

  if (!mongoose.isValidObjectId(animalId)) {
    return res.status(400).json({ message: "Invalid animal selection" });
  }

  const animal = await Animal.findOne({ _id: animalId, farmerId: farmer._id });
  if (!animal) {
    return res.status(404).json({ message: "Selected animal was not found for this farmer" });
  }

  const resolvedAnimalType = normalizeAnimalType(animal.animalType || animal.type);
  const validProblems = resolvedAnimalType === "Cow" ? COW_PROBLEMS : resolvedAnimalType === "Buffalo" ? BUFFALO_PROBLEMS : null;
  if (!validProblems) {
    return res.status(400).json({ message: "Selected animal has an unsupported type" });
  }

  if (!validProblems.has(String(description || "").trim())) {
    return res.status(400).json({ message: `Invalid health problem for ${resolvedAnimalType}` });
  }

  const requestedAt = new Date();
  const fee = calculateVisitFee({
    isSabhasadMember: farmer.isSabhasadMember,
    problemType,
    requestedAt,
  });

  const requestTimeCategory = isDayTime(requestedAt) ? "day" : "night";

  const assignment = await assignNearestDoctor({
    farmerLocation: farmer.location,
    problemType,
  });

  const assignedDoctorId = assignment?.doctorId || null;
  const caseDistanceKm = typeof assignment?.distanceKm === "number" ? assignment.distanceKm : null;

  const createdCase = await Case.create({
    farmerId: farmer._id,
    doctorId: assignedDoctorId,
    caseAssignedDoctorId: assignment?.doctorCode || "",
    caseDistanceKm,
    caseDistance: caseDistanceKm === null ? "" : `${caseDistanceKm.toFixed(1)} km`,
    animalId,
    problemType,
    description,
    fee,
    status: assignedDoctorId ? CASE_STATUS.ASSIGNED : CASE_STATUS.PENDING,
    requestTimeCategory,
  });

  if (assignedDoctorId) {
    await User.findByIdAndUpdate(assignedDoctorId, {
      availabilityStatus: "On Case",
      isAvailable: false,
    });
  }

  await Payment.create({
    farmerId: farmer._id,
    dairyId: farmer.dairyId,
    caseId: createdCase._id,
    deductedAmount: fee,
    requestedAt,
  });

  try {
    await sendMail({
      to: process.env.DAIRY_SECRETARY_EMAIL,
      subject: `Fee deducted for case ${createdCase._id}`,
      text: [
        `Farmer Name: ${farmer.name}`,
        `Sabhasad ID: ${farmer.sabhasadId}`,
        `Dairy ID: ${farmer.dairyId}`,
        `Case ID: ${createdCase._id}`,
        `Deducted Amount: INR ${fee}`,
        `Request Time: ${requestedAt.toISOString()}`,
      ].join("\n"),
    });
  } catch (error) {
    console.warn("Case email notification failed:", error.message);
  }

  const populatedCase = await Case.findById(createdCase._id)
    .populate("farmerId", "name dairyId sabhasadId address village city district state pincode location")
    .populate("doctorId", "name mobile")
    .populate("animalId", "animalId type")
    .lean();

  const casePayload = enrichCasePayload(populatedCase);
  emitCaseUpdate(casePayload);

  return res.status(201).json(casePayload);
}

async function getMyCases(req, res) {
  const filter = req.user.role === "farmer" ? { farmerId: req.user.id } : { doctorId: req.user.id };
  const cases = await Case.find(filter)
    .populate("farmerId", "name mobile dairyId address village city district state pincode location")
    .populate("doctorId", "name mobile")
    .populate("animalId", "animalId type")
    .sort({ createdAt: -1 })
    .lean();

  const enrichedCases = cases.map((item) => enrichCasePayload(item));

  if (req.user.role === "doctor") {
    const doctorCases = enrichedCases.sort(sortDoctorCases);

    return res.status(200).json(doctorCases);
  }

  return res.status(200).json(enrichedCases);
}

async function getAllCases(req, res) {
  const cases = await Case.find({})
    .populate("farmerId", "name dairyId address village city district state pincode location")
    .populate("doctorId", "name")
    .populate("animalId", "animalId type")
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(cases.map((item) => enrichCasePayload(item)));
}

async function updateCaseStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const targetCase = await Case.findById(id);
  if (!targetCase) {
    return res.status(404).json({ message: "Case not found" });
  }

  if (req.user.role === "doctor" && targetCase.doctorId?.toString() !== req.user.id) {
    return res.status(403).json({ message: "You are not assigned to this case" });
  }

  targetCase.status = status;
  await targetCase.save();

  if (targetCase.doctorId) {
    if (status === CASE_STATUS.COMPLETED) {
      await User.findByIdAndUpdate(targetCase.doctorId, {
        availabilityStatus: "Available",
        isAvailable: true,
      });
    } else if (status === CASE_STATUS.ASSIGNED || status === CASE_STATUS.ON_THE_WAY) {
      await User.findByIdAndUpdate(targetCase.doctorId, {
        availabilityStatus: "On Case",
        isAvailable: false,
      });
    }
  }

  const populatedCase = await Case.findById(id)
    .populate("farmerId", "name address village city district state pincode location")
    .populate("doctorId", "name")
    .populate("animalId", "animalId type")
    .lean();

  const casePayload = enrichCasePayload(populatedCase);
  emitCaseUpdate(casePayload);

  return res.status(200).json(casePayload);
}

async function assignDoctorManually(req, res) {
  const { id } = req.params;
  const { doctorId } = req.body;

  const targetCase = await Case.findById(id);
  if (!targetCase) {
    return res.status(404).json({ message: "Case not found" });
  }

  targetCase.doctorId = doctorId;
  const doctor = await User.findById(doctorId).select("doctorId");
  targetCase.caseAssignedDoctorId = doctor?.doctorId || "";
  targetCase.status = CASE_STATUS.ASSIGNED;
  await targetCase.save();

  await User.findByIdAndUpdate(doctorId, {
    availabilityStatus: "On Case",
    isAvailable: false,
  });

  const populatedCase = await Case.findById(id)
    .populate("farmerId", "name address village city district state pincode location")
    .populate("doctorId", "name")
    .populate("animalId", "animalId type")
    .lean();

  const casePayload = enrichCasePayload(populatedCase);
  emitCaseUpdate(casePayload);

  return res.status(200).json(casePayload);
}

async function getCaseReport(req, res) {
  const { id } = req.params;
  const report = await Report.findOne({ caseId: id }).populate("doctorId", "name specialization");
  return res.status(200).json(report);
}

module.exports = {
  createCase,
  getMyCases,
  getAllCases,
  updateCaseStatus,
  assignDoctorManually,
  getCaseReport,
};
