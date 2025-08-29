const cloudinaryService = require("../services/cloudinaryService")
const multer = require("multer")

// Configuración de Multer para almacenar archivos en memoria
// Esto es útil para Cloudinary, ya que Multer pasa el buffer del archivo
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó ningún archivo." })
    }

    // Multer almacena el archivo en req.file.buffer
    // Cloudinary puede subir directamente desde un buffer
    const result = await cloudinaryService.uploadImage(req.file.buffer, req.file.mimetype) // Pasamos mimetype
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = {
  upload, // Exportar la instancia de multer para usarla en las rutas
  uploadImage,
}
