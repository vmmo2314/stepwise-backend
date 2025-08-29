const { db, authAdmin, admin } = require("../config/firebaseAdmin")
const userService = require("./userService") // Para reutilizar getUserRoleAndOrg y safeCreateUsersDoc
const organizationService = require("./organizationService")

async function registerUser(email, password, userData, role) {
  let userRecord // Declare userRecord variable here
  try {
    // 1. Crear usuario en Firebase Authentication
    userRecord = await authAdmin.createUser({
      email: email,
      password: password,
      emailVerified: false, // Puedes cambiar esto si implementas verificación de email
      disabled: false,
    })

    const uid = userRecord.uid
    let organizacionId = null // Inicializar organizacionId

    // 2. Manejar la lógica específica del rol y la organización en Firestore
    if (role === "doctor") {
      const { organizationName, esp32Id, doctorName, username, location } = userData

      const orgsRef = db.collection("organizaciones")
      const nameQuery = orgsRef.where("nombre", "==", organizationName)
      const nameSnapshot = await nameQuery.get()

      if (!nameSnapshot.empty) {
        // Ya existe una organización con este nombre
        const existingDoc = nameSnapshot.docs[0]
        organizacionId = existingDoc.id
        const existingData = existingDoc.data()

        const currentCodigos = existingData.codigoRegistro || ""
        const codigosArray = currentCodigos
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c.length > 0)

        if (!codigosArray.includes(esp32Id)) {
          const newCodigoRegistro = codigosArray.length > 0 ? `${currentCodigos},${esp32Id}` : esp32Id

          await existingDoc.ref.update({
            codigoRegistro: newCodigoRegistro,
          })

          console.log(`✅ ESP32 ${esp32Id} agregado a la organización existente ${organizationName}`)
        } else {
          console.log(`ℹ️ ESP32 ${esp32Id} ya está registrado en la organización ${organizationName}`)
        }
      } else {
        organizacionId = organizationName.trim().replace(/\s+/g, "_").toLowerCase()
        const newOrgRef = db.doc(`organizaciones/${organizacionId}`)
        await newOrgRef.set({
          nombre: organizationName,
          codigoRegistro: esp32Id, // Primer ESP32 ID para esta organización
          creadoEn: admin.firestore.FieldValue.serverTimestamp(),
          direccion: location?.direccion || "",
          coordenadas: {
            lat: location?.lat || null,
            lng: location?.lng || null,
          },
        })

        console.log(`✅ Nueva organización ${organizationName} creada con ESP32 ${esp32Id}`)
      }

      try {
        await organizationService.assignEsp32ToOrganization(esp32Id, organizacionId, organizationName)
        console.log(`✅ ESP32 ${esp32Id} asignado exitosamente a la organización ${organizationName}`)
      } catch (esp32Error) {
        console.error(`⚠️ Error al asignar ESP32 ${esp32Id} a la organización:`, esp32Error)
        // No lanzamos el error para no interrumpir el registro, pero lo logueamos
      }

      // Registrar perfil detallado del doctor dentro de la organización
      const doctorRef = db.doc(`organizaciones/${organizacionId}/doctores/${uid}`)
      await doctorRef.set({
        uid: uid,
        email: email,
        username: username,
        nombre: doctorName,
        esp32Id: esp32Id,
        rol: "doctor",
        creadoEn: admin.firestore.FieldValue.serverTimestamp(),
      })

      // Documento minimalista centralizado en /users/{uid}
      await userService.safeCreateUsersDoc(uid, { rol: "doctor", organizacionId })

      // *** NUEVO: Establecer Custom Claims para el doctor ***
      await authAdmin.setCustomUserClaims(uid, { rol: "doctor", organizacionId: organizacionId })

      return { uid, email, rol: "doctor", organizacionId }
    } else if (role === "paciente") {
      const { username } = userData

      // Documento minimalista centralizado en /users/{uid}
      await userService.safeCreateUsersDoc(uid, { rol: "paciente", organizacionId: null })

      // /patients/{uid}
      await db.doc(`patients/${uid}`).set({
        uid: uid,
        email: email,
        name: username,
        doctor: "Pendiente", // Asignación inicial
        lastVisit: "Pendiente",
        pathology: "Pendiente",
        rol: "paciente",
        creadoEn: admin.firestore.FieldValue.serverTimestamp(),
      })

      // *** NUEVO: Establecer Custom Claims para el paciente ***
      await authAdmin.setCustomUserClaims(uid, { rol: "paciente", organizacionId: null })

      return { uid, email, rol: "paciente", organizacionId: null }
    } else {
      // Si no se especifica un rol válido, eliminar el usuario creado en Auth
      if (userRecord && userRecord.uid) {
        await authAdmin.deleteUser(userRecord.uid)
      }
      throw new Error("Rol de usuario no válido especificado.")
    }
  } catch (error) {
    console.error("Error en authBackendService.registerUser:", error)
    // Si hay un error después de crear el usuario en Auth, intenta eliminarlo
    if (error.code && error.code.startsWith("auth/")) {
      // Errores de Firebase Auth (ej. email-already-in-use)
      throw error
    } else if (userRecord && userRecord.uid) {
      // Si el usuario se creó en Auth pero falló la creación en Firestore
      await authAdmin.deleteUser(userRecord.uid).catch((e) => console.error("Error al limpiar usuario de Auth:", e))
    }
    throw new Error(`Error al registrar usuario: ${error.message}`)
  }
}

async function loginUser(idToken) {
  try {
    // Verificar el ID token recibido del cliente
    const decodedToken = await authAdmin.verifyIdToken(idToken)
    const uid = decodedToken.uid

    // Obtener el rol y la organización del usuario desde Firestore
    const roleInfo = await userService.getUserRoleAndOrg(uid)

    if (!roleInfo?.rol) {
      throw new Error("Este usuario no tiene un rol asignado en Firestore.")
    }

    // *** NUEVO: Establecer/Actualizar Custom Claims al iniciar sesión ***
    // Esto es importante para asegurar que el token del cliente tenga los claims correctos
    // incluso si el usuario se registró antes de que se implementaran los claims,
    // o si los claims necesitan ser actualizados.
    await authAdmin.setCustomUserClaims(uid, {
      rol: roleInfo.rol,
      organizacionId: roleInfo.organizacionId || null,
    })

    return {
      uid: uid,
      email: decodedToken.email,
      rol: roleInfo.rol,
      organizacionId: roleInfo.organizacionId || null,
    }
  } catch (error) {
    console.error("Error en authBackendService.loginUser:", error)
    throw new Error(`Error al iniciar sesión: ${error.message}`)
  }
}

module.exports = {
  registerUser,
  loginUser,
}
