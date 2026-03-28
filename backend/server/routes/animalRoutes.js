const express = require("express");
const { body } = require("express-validator");
const {
  createAnimal,
  listFarmerAnimals,
  listAnimalsByFarmerId,
  updateAnimal,
  deleteAnimal,
} = require("../controllers/animalController");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/role");
const validate = require("../middleware/validate");

const router = express.Router();

router.use(auth, allowRoles("farmer"));

router.post(
  "/",
  [
    body("animalId").trim().notEmpty().withMessage("Animal ID is required"),
    body("animalType")
      .optional()
      .trim(),
    body("type")
      .optional()
      .trim(),
    body()
      .custom((_, { req }) => {
        const resolvedAnimalType = String(req.body.animalType || req.body.type || "").trim().toLowerCase();
        if (!resolvedAnimalType || !["cow", "buffalo"].includes(resolvedAnimalType)) {
          throw new Error("Animal Type must be Cow or Buffalo");
        }
        return true;
      }),
  ],
  validate,
  createAnimal
);

router.get("/", listFarmerAnimals);

router.get("/farmer/:farmerId", listAnimalsByFarmerId);

router.put(
  "/update/:animalId",
  [
    body("animalType")
      .optional()
      .trim(),
    body("type")
      .optional()
      .trim(),
    body()
      .custom((_, { req }) => {
        const resolvedAnimalType = String(req.body.animalType || req.body.type || "").trim().toLowerCase();
        if (!resolvedAnimalType || !["cow", "buffalo"].includes(resolvedAnimalType)) {
          throw new Error("Animal Type must be Cow or Buffalo");
        }
        return true;
      }),
  ],
  validate,
  updateAnimal
);

router.delete("/delete/:animalId", deleteAnimal);

module.exports = router;
