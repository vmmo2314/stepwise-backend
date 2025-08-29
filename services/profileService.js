const { db } = require("../config/firebaseAdmin")

const profileService = {
  // Obtener perfil de usuario (doctor o paciente)
  async getUserProfile(uid, rol) {
    try {
      console.log(`📋 Obteniendo perfil para usuario ${uid} con rol ${rol}`)

      let profileData = null

      if (rol === "doctor") {
        // Buscar en la colección de doctores dentro de organizaciones
        const organizacionesSnapshot = await db.collection("organizaciones").get()

        for (const orgDoc of organizacionesSnapshot.docs) {
          const doctorDoc = await db.collection("organizaciones").doc(orgDoc.id).collection("doctores").doc(uid).get()

          if (doctorDoc.exists) {
            profileData = {
              ...doctorDoc.data(),
              organizacionId: orgDoc.id,
              organizacionNombre: orgDoc.data().nombre,
            }
            break
          }
        }
      } else if (rol === "paciente") {
        // Buscar en la colección de pacientes
        const patientDoc = await db.collection("patients").doc(uid).get()

        if (patientDoc.exists) {
          profileData = patientDoc.data()
        }
      }

      console.log(`✅ Perfil encontrado:`, profileData ? "Sí" : "No")
      return profileData
    } catch (error) {
      console.error("❌ Error obteniendo perfil:", error)
      throw error
    }
  },

  // Actualizar perfil de usuario
  async updateUserProfile(uid, rol, profileData, organizacionId = null) {
    try {
      console.log(`📝 Actualizando perfil para usuario ${uid} con rol ${rol}`)

      const updateData = {
        ...profileData,
        updatedAt: new Date().toISOString(),
      }

      if (rol === "doctor" && organizacionId) {
        // Actualizar en la colección de doctores
        await db
          .collection("organizaciones")
          .doc(organizacionId)
          .collection("doctores")
          .doc(uid)
          .set(updateData, { merge: true })
      } else if (rol === "paciente") {
        // Actualizar en la colección de pacientes
        await db.collection("patients").doc(uid).set(updateData, { merge: true })
      }

      console.log(`✅ Perfil actualizado exitosamente`)
      return { success: true, message: "Perfil actualizado correctamente" }
    } catch (error) {
      console.error("❌ Error actualizando perfil:", error)
      throw error
    }
  },

  // Calcular porcentaje de completitud del perfil
  calculateProfileCompletion(profileData, rol) {
    if (!profileData) return 0

    let requiredFields = []
    let completedFields = 0

    if (rol === "paciente") {
      requiredFields = [
        "datos_personales.edad",
        "datos_personales.sexo",
        "datos_personales.peso_kg",
        "datos_personales.estatura_cm",
        "datos_personales.tipo_sangre",
        "info_contacto.telefono",
        "info_contacto.direccion",
      ]
    } else if (rol === "doctor") {
      requiredFields = ["especialidad", "cedula_profesional", "telefono", "direccion"]
    }

    requiredFields.forEach((field) => {
      const fieldValue = field.split(".").reduce((obj, key) => obj?.[key], profileData)
      if (fieldValue && fieldValue.toString().trim() !== "") {
        completedFields++
      }
    })

    return Math.round((completedFields / requiredFields.length) * 100)
  },
}

module.exports = profileService
