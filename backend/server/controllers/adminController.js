const User = require("../models/User");
const Case = require("../models/Case");

async function getUsersByRole(req, res) {
  const { role } = req.params;
  const users = await User.find({ role }).select(
    "name email mobile dairyId sabhasadId specialization isAvailable doctorId availabilityStatus currentLatitude currentLongitude lastLocationUpdate"
  );
  return res.status(200).json(users);
}

async function updateUser(req, res) {
  const { id } = req.params;
  const updates = req.body;
  const user = await User.findByIdAndUpdate(id, updates, { new: true }).select(
    "name email mobile dairyId sabhasadId specialization isAvailable role"
  );

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json(user);
}

async function deleteUser(req, res) {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json({ message: "User deleted" });
}

async function getAnalytics(req, res) {
  const [totalCases, emergencyCases, doctors, cases] = await Promise.all([
    Case.countDocuments(),
    Case.countDocuments({ problemType: "emergency" }),
    User.find({ role: "doctor" }).select("name"),
    Case.find({}).select("doctorId createdAt problemType"),
  ]);

  const doctorWorkload = doctors.map((doctor) => ({
    doctorId: doctor._id,
    name: doctor.name,
    cases: cases.filter((item) => item.doctorId?.toString() === doctor._id.toString()).length,
  }));

  const dailyCaseTrendsMap = new Map();
  cases.forEach((item) => {
    const day = item.createdAt.toISOString().slice(0, 10);
    dailyCaseTrendsMap.set(day, (dailyCaseTrendsMap.get(day) || 0) + 1);
  });

  const dailyCaseTrends = Array.from(dailyCaseTrendsMap.entries())
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day));

  return res.status(200).json({
    totalCases,
    emergencyCases,
    doctorWorkload,
    dailyCaseTrends,
  });
}

module.exports = {
  getUsersByRole,
  updateUser,
  deleteUser,
  getAnalytics,
};
