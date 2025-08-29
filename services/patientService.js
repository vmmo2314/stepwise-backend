// Backend1/services/patientService.js
const { db } = require("../config/firebaseAdmin");

const patientCollection = db.collection("patients");

/**
 * Crea un nuevo paciente en Firestore.
 * @param {object} patientData - Datos del paciente a crear.
 */
async function createPatient(patientData) {
  try {
    const docRef = await patientCollection.add(patientData);
    return { id: docRef.id, ...patientData };
  } catch (error) {
    console.error("Error al crear paciente en el servicio:", error);
    throw new Error("Error al crear paciente.");
  }
}

/**
 * Obtiene todos los pacientes de Firestore.
 */
async function getAllPatients() {
  try {
    const snapshot = await patientCollection.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al obtener pacientes en el servicio:", error);
    throw new Error("Error al obtener los pacientes.");
  }
}

/**
 * Obtiene pacientes filtrados por organizacionId.
 */
async function getAllPatientsByOrg(organizacionId) {
  try {
    const q = patientCollection.where("organizacionId", "==", organizacionId);
    const snapshot = await q.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al obtener pacientes por organización en el servicio:", error);
    throw new Error("Error al obtener pacientes por organización.");
  }
}

/**
 * Obtiene pacientes asignados a un doctor específico.
 */
async function getMyPatients(doctorUid) {
  try {
    const q = patientCollection.where("doctor", "==", doctorUid);
    const snapshot = await q.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al obtener mis pacientes en el servicio:", error);
    throw new Error("Error al obtener mis pacientes.");
  }
}

/**
 * Obtiene un paciente por su ID: patients/{id}
 */
async function getPatientById(id) {
  try {
    if (!id) {
      const err = new Error("id requerido");
      err.code = "invalid-arg";
      throw err;
    }
    const snap = await patientCollection.doc(id).get();
    if (!snap.exists) {
      const err = new Error("Paciente no encontrado");
      err.code = "not-found";
      throw err;
    }
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    if (error.code === "not-found" || error.code === "invalid-arg") throw error;
    console.error("Error al obtener paciente por ID en el servicio:", error);
    throw new Error("Error al obtener paciente.");
  }
}

/**
 * Elimina un paciente por su ID.
 */
async function deletePatient(id) {
  try {
    await patientCollection.doc(id).delete();
  } catch (error) {
    console.error("Error al eliminar paciente en el servicio:", error);
    throw new Error("Error al eliminar paciente.");
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
