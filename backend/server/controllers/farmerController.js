const User = require("../models/User");

async function getFarmerProfile(req, res) {
  const farmer = await User.findOne({ _id: req.user.id, role: "farmer" }).select(
    "name mobile email address village city district state pincode location"
  );

  if (!farmer) {
    return res.status(404).json({ message: "Farmer not found" });
  }

  return res.status(200).json({
    farmerId: String(farmer._id),
    name: farmer.name || "",
    mobile: farmer.mobile || "",
    email: farmer.email || "",
    address: farmer.address || "",
    village: farmer.village || "",
    city: farmer.city || "",
    district: farmer.district || "",
    state: farmer.state || "",
    pincode: farmer.pincode || "",
    latitude: farmer.location?.lat ?? null,
    longitude: farmer.location?.long ?? null,
  });
}

async function updateFarmerProfile(req, res) {
  const {
    name,
    mobile,
    email,
    address,
    village,
    city,
    district,
    state,
    pincode,
    latitude,
    longitude,
  } = req.body;

  const farmer = await User.findOne({ _id: req.user.id, role: "farmer" });
  if (!farmer) {
    return res.status(404).json({ message: "Farmer not found" });
  }

  farmer.name = String(name || farmer.name || "").trim();
  farmer.mobile = String(mobile || farmer.mobile || "").trim();
  farmer.phone = farmer.mobile;
  farmer.email = String(email || farmer.email || "").trim().toLowerCase();
  farmer.address = String(address || farmer.address || "").trim();
  farmer.village = String(village || farmer.village || "").trim();
  farmer.city = String(city || farmer.city || "").trim();
  farmer.district = String(district || farmer.district || "").trim();
  farmer.state = String(state || farmer.state || "").trim();
  farmer.pincode = String(pincode || farmer.pincode || "").trim();

  const nextLat = Number(latitude);
  const nextLong = Number(longitude);
  if (!Number.isNaN(nextLat) && !Number.isNaN(nextLong)) {
    farmer.location = {
      lat: nextLat,
      long: nextLong,
    };
  }

  await farmer.save();

  return res.status(200).json({
    farmerId: String(farmer._id),
    name: farmer.name,
    mobile: farmer.mobile,
    email: farmer.email,
    address: farmer.address,
    village: farmer.village,
    city: farmer.city,
    district: farmer.district,
    state: farmer.state,
    pincode: farmer.pincode,
    latitude: farmer.location?.lat ?? null,
    longitude: farmer.location?.long ?? null,
  });
}

module.exports = {
  getFarmerProfile,
  updateFarmerProfile,
};
