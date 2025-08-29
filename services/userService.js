const { db, admin } = require("../config/firebaseAdmin")

async function getUserRoleAndOrg(uid) {
  try {
    const usersDocRef = db.collection("users").doc(uid)
    const userSnap = await usersDocRef.get()
    if (userSnap.exists) {
      const data = userSnap.data()
      if (data?.rol === "doctor") {
        return {
          rol: "doctor",
          organizacionId: data.organizacionId || null,
        }
      }
      if (data?.rol === "paciente") {
        return { rol: "paciente", organizacionId: null }
      }
    }

    let doctorOrgId = null
    try {
      const cgQuery = db.collectionGroup("doctores").where("uid", "==", uid)
      const cgSnap = await cgQuery.get()
      if (!cgSnap.empty) {
        const first = cgSnap.docs[0]
        const segments = first.ref.path.split("/")
        const orgId = segments[1]
        doctorOrgId = orgId
      }
    } catch (e) {
      console.warn("CollectionGroup 'doctores' failed, falling back to manual search:", e)
      if (doctorOrgId == null) {
        const orgsSnap = await db.collection("organizaciones").get()
        for (const orgDoc of orgsSnap.docs) {
          const orgId = orgDoc.id
          const doctorRef = db.doc(`organizaciones/${orgId}/doctores/${uid}`)
          const doctorSnap = await doctorRef.get()
          if (doctorSnap.exists) {
            doctorOrgId = orgId
            break
          }
        }
      }
    }

    if (doctorOrgId) {
      await safeCreateUsersDoc(uid, { rol: "doctor", organizacionId: doctorOrgId })
      return { rol: "doctor", organizacionId: doctorOrgId }
    }

    const patientRef = db.collection("patients").doc(uid)
    const patientSnap = await patientRef.get()
    if (patientSnap.exists) {
      await safeCreateUsersDoc(uid, { rol: "paciente", organizacionId: null })
      return { rol: "paciente", organizacionId: null }
    }

    return null
  } catch (e) {
    console.error("getUserRoleAndOrg error:", e)
    throw new Error("Error al obtener rol y organización del usuario.")
  }
}

async function safeCreateUsersDoc(uid, { rol, organizacionId }) {
  try {
    const ref = db.collection("users").doc(uid)
    const snap = await ref.get()
    if (snap.exists) {
      const data = snap.data()
      if (data.rol && data.rol !== rol) {
        return
      }
    }
    await ref.set(
      {
        rol,
        organizacionId: organizacionId || null,
        ...(snap.exists ? {} : { creadoEn: admin.firestore.FieldValue.serverTimestamp() }),
      },
      { merge: true },
    )
  } catch (e) {
    console.warn("safeCreateUsersDoc fallo:", e)
  }
}

module.exports = {
  getUserRoleAndOrg,
  safeCreateUsersDoc, // <--- ¡Añade esta línea!
}
