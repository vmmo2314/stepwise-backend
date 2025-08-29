const { authAdmin } = require("../config/firebaseAdmin")

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: "No se proporcionó token de autenticación." })
  }

  const token = authHeader.split(" ")[1] // Bearer TOKEN
  if (!token) {
    return res.status(401).json({ error: "Formato de token inválido." })
  }

  try {
    const decodedToken = await authAdmin.verifyIdToken(token)
    req.user = decodedToken // Adjunta la información del usuario a la solicitud
    next()
  } catch (error) {
    console.error("Error al verificar token:", error)
    return res.status(403).json({ error: "Token de autenticación inválido o expirado." })
  }
}

module.exports = {
  authenticateToken,
}
  