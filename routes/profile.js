const express = require("express")
const router = express.Router()
const profileController = require("../controllers/profileController")
const { authenticateToken } = require("../middleware/authMiddleware")

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// GET /api/profile - Obtener perfil del usuario actual
router.get("/", profileController.getProfile)

// PUT /api/profile - Actualizar perfil del usuario actual
router.put("/", profileController.updateProfile)

module.exports = router
