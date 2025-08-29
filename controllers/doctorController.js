const doctorService = require("../services/doctorService")
// Ya no necesitamos authAdmin aquí, se maneja en el middleware

async function getAllDoctors(req, res) {
  try {
    const { organizacionId } = req.params
    if (!organizacionId) {
      return res.status(400).json({ error: "organizacionId es requerido." })
    }
    const doctors = await doctorService.getAllDoctors(organizacionId)
    res.status(200).json(doctors)
  } catch (error) {
    console.error("Error en controller getAllDoctors:", error)
    res.status(500).json({ error: error.message })
  }
}

async function getDoctorById(req, res) {
  try {
    const { organizacionId, doctorUid } = req.params
    if (!organizacionId || !doctorUid) {
      return res.status(400).json({ error: "organizacionId y doctorUid son requeridos." })
    }
    const doctor = await doctorService.getDoctorById(organizacionId, doctorUid)
    if (doctor) {
      res.status(200).json(doctor)
    } else {
      res.status(404).json({ error: "Doctor no encontrado." })
    }
  } catch (error) {
    console.error("Error en controller getDoctorById:", error)
    res.status(500).json({ error: error.message })
  }
}

module.exports = {
  // authenticateToken ya no se exporta desde aquí
  getAllDoctors,
  getDoctorById,
}
