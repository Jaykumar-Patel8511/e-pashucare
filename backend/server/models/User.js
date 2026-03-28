const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    long: { type: Number, required: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["farmer", "doctor", "admin"], default: "farmer" },
    phone: { type: String, required: true, trim: true },
    sabhasadId: { type: String, default: null },
    dairyId: { type: String, default: null },
    mobile: { type: String, required: true, trim: true },
    doctorId: { type: String, default: "" },
    doctorName: { type: String, default: "" },
    adminId: { type: String, default: "" },
    doctorCategory: {
      type: String,
      enum: ["General", "Surgery", "Reproduction", "Emergency Care", "Veterinary Specialist", "Artificial Insemination"],
      default: "General",
    },
    address: {
      type: String,
      required() {
        return this.role !== "doctor";
      },
      default: "",
    },
    village: { type: String, default: "" },
    city: { type: String, default: "" },
    district: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    location: {
      type: locationSchema,
      required() {
        return this.role !== "doctor";
      },
    },
    currentLatitude: { type: Number, default: null },
    currentLongitude: { type: Number, default: null },
    lastLocationUpdate: { type: Date, default: null },
    availabilityStatus: {
      type: String,
      enum: ["Available", "On Case", "Offline"],
      default: "Offline",
    },
    sabhasadMember: { type: Boolean, default: false },
    isSabhasadMember: { type: Boolean, default: false },
    specialization: { type: String, default: "general" },
    isVerified: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model("User", userSchema);
