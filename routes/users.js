const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")
const { authenticateToken } = require("../middleware/authMiddleware") // Importar el middleware centralizado

// Aplica el middleware de autenticación
router.use(authenticateToken)

// Ruta para obtener el rol y la organización del usuario
router.get("/role", userController.getUserRoleAndOrg)

module.exports = router
