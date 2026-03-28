const mongoose = require("mongoose");

const animalSchema = new mongoose.Schema(
  {
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    animalId: { type: String, required: true, unique: true },
    animalType: { type: String, required: true, enum: ["Cow", "Buffalo"] },
    animalNickname: { type: String, default: "", trim: true },
    type: { type: String, default: "" },
    healthHistory: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Animal", animalSchema);
