const authBackendService = require("../services/authBackendService")
const { authAdmin } = require("../config/firebaseAdmin") // Para verificar tokens si es necesario, aunque login ya lo hace

async function registerDoctor(req, res) {
  try {
    const { email, password, registrationData } = req.body
    if (!email || !password || !registrationData) {
      return res.status(400).json({ error: "Faltan datos de registro." })
    }
    const newUser = await authBackendService.registerUser(email, password, registrationData, "doctor")
    res.status(201).json({ message: "Doctor registrado exitosamente.", user: newUser })
  } catch (error) {
    console.error("Error en controller registerDoctor:", error)
    // Mapear errores de Firebase Auth a mensajes amigables
    if (error.code === "auth/email-already-in-use") {
      return res.status(409).json({ error: "Ese email ya está registrado." })
    }
    res.status(500).json({ error: error.message || "Error interno del servidor al registrar doctor." })
  }
}

async function registerPatient(req, res) {
  try {
    const { email, password, registrationData } = req.body
    if (!email || !password || !registrationData) {
      return res.status(400).json({ error: "Faltan datos de registro." })
    }
    const newUser = await authBackendService.registerUser(email, password, registrationData, "paciente")
    res.status(201).json({ message: "Paciente registrado exitosamente.", user: newUser })
  } catch (error) {
    console.error("Error en controller registerPatient:", error)
    if (error.code === "auth/email-already-in-use") {
      return res.status(409).json({ error: "Ese email ya está registrado." })
    }
    res.status(500).json({ error: error.message || "Error interno del servidor al registrar paciente." })
  }
}

async function login(req, res) {
  try {
    // El frontend enviará el ID Token obtenido de Firebase Client SDK
    const { idToken } = req.body
    if (!idToken) {
      return res.status(400).json({ error: "ID Token no proporcionado." })
    }

    const userInfo = await authBackendService.loginUser(idToken)
    res.status(200).json({ message: "Inicio de sesión exitoso.", user: userInfo })
  } catch (error) {
    console.error("Error en controller login:", error)
    if (error.message.includes("Firebase ID token has expired")) {
      return res.status(401).json({ error: "Sesión expirada. Por favor, inicia sesión de nuevo." })
    }
    if (error.message.includes("Firebase ID token has been revoked")) {
      return res.status(401).json({ error: "Sesión revocada. Por favor, inicia sesión de nuevo." })
    }
    res.status(401).json({ error: error.message || "Credenciales inválidas." })
  }
}

module.exports = {
  registerDoctor,
  registerPatient,
  login,
}
