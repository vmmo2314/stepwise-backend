const profileService = require("../services/profileService")

const profileController = {
  // Obtener perfil del usuario actual
  async getProfile(req, res) {
    try {
      const { uid, rol, organizacionId } = req.user

      const profileData = await profileService.getUserProfile(uid, rol)
      const completionPercentage = profileService.calculateProfileCompletion(profileData, rol)

      res.json({
        success: true,
        data: {
          profile: profileData,
          completion: completionPercentage,
          rol: rol,
          organizacionId: organizacionId,
        },
      })
    } catch (error) {
      console.error("Error obteniendo perfil:", error)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      })
    }
  },

  // Actualizar perfil del usuario actual
  async updateProfile(req, res) {
    try {
      const { uid, rol, organizacionId } = req.user
      const profileData = req.body

      const result = await profileService.updateUserProfile(uid, rol, profileData, organizacionId)

      // Obtener el perfil actualizado
      const updatedProfile = await profileService.getUserProfile(uid, rol)
      const completionPercentage = profileService.calculateProfileCompletion(updatedProfile, rol)

      res.json({
        success: true,
        message: result.message,
        data: {
          profile: updatedProfile,
          completion: completionPercentage,
        },
      })
    } catch (error) {
      console.error("Error actualizando perfil:", error)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      })
    }
  },
}

module.exports = profileController
