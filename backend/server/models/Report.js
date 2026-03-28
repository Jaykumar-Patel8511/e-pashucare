const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case", required: true, unique: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    diagnosis: { type: String, required: true },
    prescription: { type: String, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Report", reportSchema);
