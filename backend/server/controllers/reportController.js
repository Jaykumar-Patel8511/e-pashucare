const Report = require("../models/Report");
const Case = require("../models/Case");
const { CASE_STATUS } = require("../utils/constants");
const { emitCaseUpdate } = require("../services/socketService");

async function addReport(req, res) {
  const { caseId, diagnosis, prescription, notes } = req.body;

  const targetCase = await Case.findById(caseId);
  if (!targetCase) {
    return res.status(404).json({ message: "Case not found" });
  }

  if (targetCase.doctorId?.toString() !== req.user.id) {
    return res.status(403).json({ message: "You are not assigned to this case" });
  }

  const report = await Report.findOneAndUpdate(
    { caseId },
    {
      caseId,
      doctorId: req.user.id,
      diagnosis,
      prescription,
      notes,
    },
    { upsert: true, new: true }
  );

  targetCase.status = CASE_STATUS.COMPLETED;
  await targetCase.save();

  const populatedCase = await Case.findById(caseId)
    .populate("farmerId", "name")
    .populate("doctorId", "name")
    .populate("animalId", "animalId type")
    .lean();

  emitCaseUpdate(populatedCase);

  return res.status(201).json(report);
}

module.exports = {
  addReport,
};
