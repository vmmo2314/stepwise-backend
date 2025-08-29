const express = require("express")
const router = express.Router()
const authController = require("../controllers/authController")

// Rutas de autenticación
router.post("/register/doctor", authController.registerDoctor)
router.post("/register/patient", authController.registerPatient)
router.post("/login", authController.login) // El frontend enviará el ID Token aquí

module.exports = router
