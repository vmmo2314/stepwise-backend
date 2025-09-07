// Backend1/services/analysisService.js
const admin = require('firebase-admin');
// Asegúrate de inicializar admin en tu bootstrap (no aquí) para evitar doble init
const db = admin.firestore();

/** Convierte la fecha actual a ID: "YYYY-MM-DDTHH_mm_ss_SSSZ" */
function buildDateIdUTC(dateObj = new Date()) {
  // "2025-08-16T02:51:37.644Z" -> "2025-08-16T02_51_37_644Z"
  return dateObj.toISOString().replace(/[:.]/g, '_');
}

/** Devuelve la fecha local CDMX como cadena "dd/mm/aaaa" */
function buildLastVisitMX(dateObj = new Date()) {
  return dateObj.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' });
}

/**
 * Crea un análisis en patients/{patientId}/analyses/{analysisId}
 * Además ACTUALIZA patients/{patientId}.lastVisit con "dd/mm/aaaa".
 * Si no mandas analysisId, se usa la fecha UTC formateada.
 */
async function createAnalysis(patientId, analysisData = {}) {
  try {
    if (!patientId) throw new Error('patientId requerido');

    const colRef = db.collection('patients').doc(patientId).collection('analyses');
    const patientRef = db.collection('patients').doc(patientId);

    // Doc a guardar
    const now = new Date();
    const payload = {
      ...analysisData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Usa el que venga o genera basado en la fecha
    let desiredId = analysisData?.id || analysisData?.analysisId || buildDateIdUTC(now);

    // Evita colisión en el improbable caso de mismo ms
    let docRef = colRef.doc(desiredId);
    const exists = await docRef.get();
    if (exists.exists) {
      desiredId = `${desiredId}_${Math.random().toString(36).slice(2, 6)}`;
      docRef = colRef.doc(desiredId);
    }

    // Construye la cadena requerida para lastVisit (dd/mm/aaaa)
    const lastVisitStr = buildLastVisitMX(now);

    // Escribe en un batch para que sea atómico
    const batch = db.batch();
    batch.set(docRef, payload);
    batch.set(
      patientRef,
      {
        lastVisit: lastVisitStr, // 👈 campo plano como cadena
        // Opcional: si quieres guardar también un timestamp de servidor:
        // lastVisitAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();

    return { id: docRef.id, analysisId: docRef.id, ...payload };
  } catch (err) {
    console.error('Error al crear análisis en el servicio:', err);
    throw new Error('Error al crear análisis.');
  }
}

/**
 * Lista análisis (ordenado desc). Si no hay createdAt, usa timestamp como fallback.
 */
async function getAnalyses(patientId, limit = 50) {
  if (!patientId) throw new Error('patientId requerido');
  const colRef = db.collection('patients').doc(patientId).collection('analyses');

  try {
    const snap = await colRef.orderBy('createdAt', 'desc').limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    // Fallback para docs antiguos que no traigan createdAt
    const snap = await colRef.orderBy('timestamp', 'desc').limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}

/** Último análisis */
async function getLatestAnalysis(patientId) {
  const list = await getAnalyses(patientId, 1);
  return list[0] || null;
}

/** Obtiene un análisis por ID (o null) */
async function getAnalysisById(patientId, analysisId) {
  try {
    if (!patientId || !analysisId) throw new Error('patientId y analysisId requeridos');
    const doc = await db
      .collection('patients')
      .doc(patientId)
      .collection('analyses')
      .doc(analysisId)
      .get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  } catch (err) {
    console.error('Error al obtener análisis por ID en el servicio:', err);
    throw new Error('Error al obtener análisis.');
  }
}

/** Actualiza un análisis */
async function updateAnalysis(patientId, analysisId, partial = {}) {
  try {
    if (!patientId || !analysisId) throw new Error('patientId y analysisId requeridos');
    const ref = db.collection('patients').doc(patientId).collection('analyses').doc(analysisId);
    await ref.set(
      { ...partial, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
    const snap = await ref.get();
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error('Error al actualizar análisis en el servicio:', err);
    throw new Error('Error al actualizar análisis.');
  }
}

/** Elimina un análisis */
async function deleteAnalysis(patientId, analysisId) {
  try {
    if (!patientId || !analysisId) throw new Error('patientId y analysisId requeridos');
    await db.collection('patients').doc(patientId).collection('analyses').doc(analysisId).delete();
    return { ok: true };
  } catch (err) {
    console.error('Error al eliminar análisis en el servicio:', err);
    throw new Error('Error al eliminar análisis.');
  }
}

module.exports = {
  createAnalysis,
  getAnalyses,
  getLatestAnalysis,
  getAnalysisById,
  updateAnalysis,
  deleteAnalysis,
};
