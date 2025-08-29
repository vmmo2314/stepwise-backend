const { db } = require("../config/firebaseAdmin")

/**
 * Verifica si un ESP32 ID existe en la colección dedicada y si coincide con la organización.
 * @param {string} esp32Id - El ID del ESP32.
 * @param {string} organizationName - El nombre de la organización.
 * @returns {Promise<{exists: boolean, orgName: string|null, canJoin: boolean, shouldCreateOrg: boolean, message: string}>}
 */
async function checkEsp32IdAdvanced(esp32Id, organizationName) {
  try {
    // Paso 1: Verificar si el ESP32 ID existe en la colección esp32_ids
    const esp32Ref = db.collection("esp32_ids").doc(esp32Id)
    const esp32Doc = await esp32Ref.get()

    if (!esp32Doc.exists) {
      return {
        exists: false,    
        orgName: null,
        canJoin: false,
        shouldCreateOrg: false,
        message: "ESP32 ID no encontrado en el sistema",
      }
    }

    const esp32Data = esp32Doc.data()

    // Paso 2: Verificar si el ESP32 ya tiene una organización asignada
    if (esp32Data.organizacionId && esp32Data.organizacionNombre) {
      // El ESP32 ya está asignado a una organización
      if (esp32Data.organizacionNombre.toLowerCase() === organizationName.toLowerCase()) {
        // La organización coincide, puede unirse
        return {
          exists: true,
          orgName: esp32Data.organizacionNombre,
          canJoin: true,
          shouldCreateOrg: false,
          message: `ESP32 pertenece a ${esp32Data.organizacionNombre}. Puedes unirte.`,
        }
      } else {
        // La organización no coincide
        return {
          exists: true,
          orgName: esp32Data.organizacionNombre,
          canJoin: false,
          shouldCreateOrg: false,
          message: `ESP32 ya está asignado a ${esp32Data.organizacionNombre}. No puedes usar un nombre diferente.`,
        }
      }
    } else {
      // El ESP32 existe pero no tiene organización asignada
      // Verificar si ya existe una organización con ese nombre
      const orgsRef = db.collection("organizaciones")
      const existingOrgQuery = orgsRef.where("nombre", "==", organizationName)
      const existingOrgSnap = await existingOrgQuery.get()

      if (!existingOrgSnap.empty) {
        return {
          exists: true,
          orgName: null,
          canJoin: false,
          shouldCreateOrg: false,
          message: `Ya existe una organización con el nombre "${organizationName}". Elige un nombre diferente.`,
        }
      }

      // Puede crear nueva organización y asignar el ESP32
      return {
        exists: true,
        orgName: null,
        canJoin: false,
        shouldCreateOrg: true,
        message: `ESP32 disponible. Se creará la organización "${organizationName}" y se asignará el ESP32.`,
      }
    }
  } catch (error) {
    console.error("Error in advanced ESP32 verification:", error)
    throw new Error("Error al verificar el ESP32 ID.")
  }
}

/**
 * Asigna un ESP32 ID a una organización
 * @param {string} esp32Id - El ID del ESP32
 * @param {string} organizacionId - El ID de la organización
 * @param {string} organizacionNombre - El nombre de la organización
 */
async function assignEsp32ToOrganization(esp32Id, organizacionId, organizacionNombre) {
  try {
    const esp32Ref = db.collection("esp32_ids").doc(esp32Id)
    await esp32Ref.update({
      organizacionId: organizacionId,
      organizacionNombre: organizacionNombre,
      asignadoEn: new Date(),
      activo: true,
    })
  } catch (error) {
    console.error("Error assigning ESP32 to organization:", error)
    throw new Error("Error al asignar ESP32 a la organización.")
  }
}

async function checkOrganizationExists(esp32Id, organizationName) {
  try {
    const orgsRef = db.collection("organizaciones")
    const q = orgsRef.where("codigoRegistro", "==", esp32Id).where("nombre", "==", organizationName)
    const snap = await q.get()

    if (!snap.empty) {
      const orgDoc = snap.docs[0]
      return { exists: true, orgName: orgDoc.data().nombre }
    } else {
      return { exists: false, orgName: null }
    }
  } catch (error) {
    console.error("Error checking organization existence in service:", error)
    throw new Error("Error al verificar la existencia de la organización.")
  }
}

/**
 * Lista todas las organizaciones (colección: "organizaciones").
 * Retorna [{ id, ...data }]
 */
async function getAllOrganizations() {
  try {
    const orgsRef = db.collection("organizaciones")
    // Evitamos orderBy para quitar variables (si falta el campo 'nombre' no truena).
    const snap = await orgsRef.get()
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

    // Orden opcional en memoria por 'nombre' si existe:
    list.sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || "")))

    return list
  } catch (error) {
    console.error("organizationService.getAllOrganizations:", error)
    throw new Error("Error al obtener organizaciones.")
  }
}

module.exports = {
  checkOrganizationExists,
  checkEsp32IdAdvanced,
  assignEsp32ToOrganization,
  getAllOrganizations,
}