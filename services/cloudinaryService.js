const cloudinary = require("cloudinary").v2

// Configura Cloudinary con tus credenciales
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Usa HTTPS
})

/**
 * Sube una imagen a Cloudinary desde un buffer.
 * @param {Buffer} fileBuffer - Buffer del archivo de imagen.
 * @param {string} [mimeType='application/octet-stream'] - Tipo MIME del archivo (e.g., 'image/jpeg').
 * @returns {Promise<object>} Objeto con la URL y otros detalles de la imagen.
 */
async function uploadImage(fileBuffer, mimeType = "application/octet-stream") {
  try {
    // Cloudinary puede subir directamente desde un buffer si se le pasa como data URI
    const base64Image = fileBuffer.toString("base64")
    const dataUri = `data:${mimeType};base64,${base64Image}`

    // Opciones de subida, puedes personalizarlas
    const options = {
      folder: "prediccion-pie", // Carpeta en Cloudinary
      // Puedes añadir más opciones aquí, como tags, transformación, etc.
    }

    const result = await cloudinary.uploader.upload(dataUri, options)

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
    }
  } catch (error) {
    console.error("💥 Error al subir imagen a Cloudinary:", error)
    throw new Error(`Error al subir imagen: ${error.message}`)
  }
}

module.exports = {
  uploadImage,
}
