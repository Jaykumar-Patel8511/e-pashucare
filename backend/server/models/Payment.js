const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dairyId: { type: String, default: null },
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case", required: true },
    deductedAmount: { type: Number, required: true },
    requestedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Payment", paymentSchema);
