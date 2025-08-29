const express = require("express")
const router = express.Router()
const uploadController = require("../controllers/uploadController")
const { authenticateToken } = require("../middleware/authMiddleware") // Importar el middleware centralizado

// Middleware de autenticación (opcional, pero recomendado para subidas)
router.use(authenticateToken)

// Usa upload.single('image') como middleware antes del controlador
// 'image' es el nombre del campo en el formulario que contendrá el archivo
router.post("/", uploadController.upload.single("image"), uploadController.uploadImage)

module.exports = router
