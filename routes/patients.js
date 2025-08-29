// Backend1/routes/patients.js
const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Todas requieren auth
router.use(authenticateToken);

// Específicas primero
router.post("/", patientController.createPatient);
router.get("/", patientController.getAllPatients);
router.get("/organization/:organizacionId", patientController.getAllPatientsByOrg);
router.get("/my-patients", patientController.getMyPatients);

// GET por ID (colócalo después de las rutas específicas para no colisionar)
router.get("/:id", patientController.getPatientById);

// DELETE por ID
router.delete("/:id", patientController.deletePatient);

module.exports = router;
