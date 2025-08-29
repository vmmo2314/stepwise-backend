// Backend1/controllers/patientController.js
const patientService = require("../services/patientService");

async function createPatient(req, res) {
  try {
    const patientData = req.body;
    const newPatient = await patientService.createPatient(patientData);
    res.status(201).json(newPatient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getAllPatients(req, res) {
  try {
    const patients = await patientService.getAllPatients();
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getAllPatientsByOrg(req, res) {
  try {
    const { organizacionId } = req.params;
    if (!organizacionId) {
      return res.status(400).json({ error: "organizacionId es requerido." });
    }
    const patients = await patientService.getAllPatientsByOrg(organizacionId);
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getMyPatients(req, res) {
  try {
    const doctorUid = req.user?.uid;
    if (!doctorUid) {
      return res.status(400).json({ error: "UID del doctor no encontrado en el token." });
    }
    const patients = await patientService.getMyPatients(doctorUid);
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getPatientById(req, res) {
  try {
    const { id } = req.params;
    const patient = await patientService.getPatientById(id);
    return res.status(200).json(patient);
  } catch (error) {
    const status =
      error.code === "not-found" ? 404 :
      error.code === "invalid-arg" ? 400 : 500;
    return res.status(status).json({ error: error.message });
  }
}

async function deletePatient(req, res) {
  try {
    const { id } = req.params;
    await patientService.deletePatient(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createPatient,
  getAllPatients,
  getAllPatientsByOrg,
  getMyPatients,
  getPatientById, // 👈 nuevo
  deletePatient,
};
