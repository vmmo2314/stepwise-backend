const { db } = require("../config/firebaseAdmin")

async function getAllDoctors(organizacionId) {
  const doctorsCollection = db.collection(`organizaciones/${organizacionId}/doctores`)
  const snapshot = await doctorsCollection.get()
  const doctors = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
  return doctors
}

async function getDoctorById(organizacionId, doctorUid) {
  const doctorDoc = db.doc(`organizaciones/${organizacionId}/doctores/${doctorUid}`)
  const docSnap = await doctorDoc.get()
  if (docSnap.exists) {
    return { id: docSnap.id, ...docSnap.data() }
  } else {
    return null
  }
}

module.exports = {
  getAllDoctors,
  getDoctorById,
}
