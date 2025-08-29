const userService = require("../services/userService")
// Ya no necesitamos authAdmin aquí, se maneja en el middleware

async function getUserRoleAndOrg(req, res) {
  try {
    const uid = req.user.uid // Obtenido del token autenticado
    if (!uid) {
      return res.status(400).json({ error: "UID de usuario no encontrado en el token." })
    }
    const userRole = await userService.getUserRoleAndOrg(uid)
    if (userRole) {
      res.status(200).json(userRole)
    } else {
      res.status(404).json({ error: "Rol de usuario no encontrado." })
    }
  } catch (error) {
    console.error("Error en controller getUserRoleAndOrg:", error)
    res.status(500).json({ error: error.message })
  }
}

module.exports = {
  // authenticateToken ya no se exporta desde aquí
  getUserRoleAndOrg,
}
