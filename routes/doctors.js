const express = require("express")
const router = express.Router()
const doctorController = require("../controllers/doctorController")
const { authenticateToken } = require("../middleware/authMiddleware") // Importar el middleware centralizado

// Aplica el middleware de autenticación a todas las rutas de doctores
router.use(authenticateToken)

// Ruta para obtener todos los doctores de una organización específica
router.get("/organization/:organizacionId", doctorController.getAllDoctors)

// Ruta para obtener un doctor específico por UID dentro de una organización
router.get("/organization/:organizacionId/doctor/:doctorUid", doctorController.getDoctorById)

module.exports = router
