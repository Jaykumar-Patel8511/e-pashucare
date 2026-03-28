const mongoose = require("mongoose");
const { CASE_STATUS } = require("../utils/constants");

const caseSchema = new mongoose.Schema(
  {
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    animalId: { type: mongoose.Schema.Types.ObjectId, ref: "Animal", required: true },
    problemType: { type: String, enum: ["normal", "emergency"], required: true },
    description: { type: String, required: true },
    fee: { type: Number, required: true },
    caseAssignedDoctorId: { type: String, default: "" },
    caseDistanceKm: { type: Number, default: null },
    caseDistance: { type: String, default: "" },
    status: {
      type: String,
      enum: Object.values(CASE_STATUS),
      default: CASE_STATUS.PENDING,
    },
    requestTimeCategory: { type: String, enum: ["day", "night"], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model("Case", caseSchema);
