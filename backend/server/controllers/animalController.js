const Animal = require("../models/Animal");

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

async function createAnimal(req, res) {
  const { animalId, animalType, type, animalNickname, healthHistory } = req.body;
  const farmerId = req.user.id;
  const resolvedAnimalType = normalizeAnimalType(animalType || type);

  if (!resolvedAnimalType) {
    return res.status(400).json({ message: "Animal Type must be Cow or Buffalo" });
  }

  const existingAnimal = await Animal.findOne({ animalId: String(animalId).trim() });
  if (existingAnimal) {
    return res.status(409).json({ message: "Animal ID already exists" });
  }

  const animal = await Animal.create({
    farmerId,
    animalId: String(animalId).trim(),
    animalType: resolvedAnimalType,
    animalNickname: animalNickname ? String(animalNickname).trim() : "",
    type: resolvedAnimalType,
    healthHistory: healthHistory ? String(healthHistory).trim() : "",
  });

  return res.status(201).json(animal);
}

async function listFarmerAnimals(req, res) {
  const animals = await Animal.find({ farmerId: req.user.id }).sort({ createdAt: -1 });
  return res.status(200).json(animals);
}

async function listAnimalsByFarmerId(req, res) {
  const { farmerId } = req.params;

  if (String(farmerId) !== String(req.user.id)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const animals = await Animal.find({ farmerId }).sort({ createdAt: -1 });
  return res.status(200).json(animals);
}

async function updateAnimal(req, res) {
  const { animalId: animalDocumentId } = req.params;
  const { animalType, type, animalNickname, healthHistory } = req.body;

  const resolvedAnimalType = normalizeAnimalType(animalType || type);

  if (!resolvedAnimalType) {
    return res.status(400).json({ message: "Animal Type must be Cow or Buffalo" });
  }

  const updatePayload = {
    animalType: resolvedAnimalType,
    type: resolvedAnimalType,
  };

  if (animalNickname !== undefined) {
    updatePayload.animalNickname = String(animalNickname || "").trim();
  }

  if (healthHistory !== undefined) {
    updatePayload.healthHistory = String(healthHistory || "").trim();
  }

  const updated = await Animal.findOneAndUpdate(
    { _id: animalDocumentId, farmerId: req.user.id },
    updatePayload,
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({ message: "Animal not found" });
  }

  return res.status(200).json(updated);
}

async function deleteAnimal(req, res) {
  const { animalId: animalDocumentId } = req.params;

  const deleted = await Animal.findOneAndDelete({ _id: animalDocumentId, farmerId: req.user.id });
  if (!deleted) {
    return res.status(404).json({ message: "Animal not found" });
  }

  return res.status(200).json({ message: "Animal deleted" });
}

module.exports = {
  createAnimal,
  listFarmerAnimals,
  listAnimalsByFarmerId,
  updateAnimal,
  deleteAnimal,
};
