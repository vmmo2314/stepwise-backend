const express = require("express")
const router = express.Router()
const postController = require("../controllers/postController")
const { authenticateToken } = require("../middleware/authMiddleware") // Importar el middleware centralizado

// Aplica el middleware de autenticación a todas las rutas de posts
router.use(authenticateToken)

router.get("/", postController.getAllPosts)
router.post("/", postController.createPost)
router.put("/:id", postController.updatePost)
router.delete("/:id", postController.deletePost)

module.exports = router
