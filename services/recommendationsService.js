const { db } = require("../config/firebaseAdmin"); // mismo patrón que ya usas
const admin = require('firebase-admin');

const { FieldPath } = require('firebase-admin/firestore');

const ANALYSIS_PATH = (patientId, analysisId) =>
  db.collection("patients").doc(patientId).collection("analyses").doc(analysisId);

// === Helpers de validación/saneamiento ===
const VALID_PRIORITIES = new Set(["primary", "success", "warning", "danger"]);
const VALID_ICONS = new Set([
  "Clipboard",
  "Activity",
  "Heart",
  "Settings",
  "User",
  "Stethoscope",
  "Pill",
  "Target",
]);

function ensureId(s) {
  if (!s || typeof s !== "string") {
    const err = new Error("id requerido");
    err.code = "invalid-arg";
    throw err;
  }
}

function sanitizePersonalRecommendations(pr = {}) {
  const out = {
    planTratamiento: Array.isArray(pr.planTratamiento) ? pr.planTratamiento : [],
    proximasRevisiones: Array.isArray(pr.proximasRevisiones) ? pr.proximasRevisiones : [],
    objetivos: Array.isArray(pr.objetivos) ? pr.objetivos : [],
    status: typeof pr.status === "string" ? pr.status : "success",
    message: typeof pr.message === "string" ? pr.message : "",
    timestamp:
      typeof pr.timestamp === "number" || typeof pr.timestamp === "string"
        ? pr.timestamp
        : Date.now(),
  };

  // Normaliza ítems con icon/priority permitidos
  out.planTratamiento = out.planTratamiento.map((it = {}) => ({
    id: it.id || cryptoRandom(),
    titulo: it.titulo || "",
    subtitulo: it.subtitulo || "",
    descripcion: it.descripcion || it.texto || "",
    icon: VALID_ICONS.has(it.icon) ? it.icon : "Clipboard",
    priority: VALID_PRIORITIES.has(it.priority) ? it.priority : "primary",
  }));

  out.proximasRevisiones = out.proximasRevisiones.map((it = {}) => ({
    id: it.id || cryptoRandom(),
    titulo: it.titulo || "",
    subtitulo: it.subtitulo || "",
    fecha: it.fecha || "",
    hora: it.hora || "",
  }));

  out.objetivos = out.objetivos.map((it = {}) => ({
    id: it.id || cryptoRandom(),
    titulo: it.titulo || "",
    subtitulo: it.subtitulo || "",
    icon: VALID_ICONS.has(it.icon) ? it.icon : "Target",
  }));

  return out;
}

function fromPersonalToLegacyStrings(pr) {
  // Deriva el array de strings “recomendaciones” desde el plan de tratamiento
  if (!pr || !Array.isArray(pr.planTratamiento)) return [];
  return pr.planTratamiento
    .map((it) => it?.titulo || it?.descripcion || it?.subtitulo || it?.texto)
    .filter(Boolean);
}

function cryptoRandom() {
  // uuid light sin dependencias
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// === SERVICE METHODS ===

/**
 * Lee recomendaciones (compatibles + enriquecidas) de una cita.
 * Devuelve:
 * {
 *   recomendaciones, status, timestamp,
 *   recomendacionesDetalle, personalRecommendations
 * }
 */
async function getRecommendations(patientId, analysisId) {
  try {
    ensureId(patientId);
    ensureId(analysisId);

    const ref = ANALYSIS_PATH(patientId, analysisId);
    const snap = await ref.get();

    if (!snap.exists) {
      const err = new Error("Cita/analysis no encontrada");
      err.code = "not-found";
      throw err;
    }

    const data = snap.data() || {};
    const personal = data.personalRecommendations
      ? sanitizePersonalRecommendations(data.personalRecommendations)
      : sanitizePersonalRecommendations({});

    const recomendaciones =
      Array.isArray(data.recomendaciones) && data.recomendaciones.length
        ? data.recomendaciones
        : fromPersonalToLegacyStrings(personal);

    return {
      recomendaciones,
      status: typeof data.status === "string" ? data.status : personal.status,
      timestamp: data.timestamp || personal.timestamp,
      recomendacionesDetalle: Array.isArray(data.recomendacionesDetalle)
        ? data.recomendacionesDetalle
        : [],
      personalRecommendations: personal,
    };
  } catch (error) {
    // mismo patrón de logging/errores que tu service de pacientes :contentReference[oaicite:1]{index=1}
    if (error.code === "not-found" || error.code === "invalid-arg") throw error;
    console.error("Error en getRecommendations(service):", error);
    throw new Error("Error al obtener recomendaciones.");
  }
}

/**
 * Guarda (merge) recomendaciones en una cita.
 * Acepta payload con cualquiera de las llaves:
 *  - recomendaciones (string[])
 *  - recomendacionesDetalle (array de objetos)
 *  - personalRecommendations (bloque completo que consume tu front)
 *  - status, timestamp
 */
async function saveRecommendations(patientId, analysisId, payload = {}) {
  try {
    ensureId(patientId);
    ensureId(analysisId);

    const ref = ANALYSIS_PATH(patientId, analysisId);
    const snap = await ref.get();
    if (!snap.exists) {
      const err = new Error("Cita/analysis no encontrada");
      err.code = "not-found";
      throw err;
    }

    const pr = payload.personalRecommendations
      ? sanitizePersonalRecommendations(payload.personalRecommendations)
      : undefined;

    const legacyStrings = Array.isArray(payload.recomendaciones)
      ? payload.recomendaciones
      : pr
      ? fromPersonalToLegacyStrings(pr)
      : [];

    const write = {
      ...(Array.isArray(legacyStrings) ? { recomendaciones: legacyStrings } : {}),
      ...(Array.isArray(payload.recomendacionesDetalle)
        ? { recomendacionesDetalle: payload.recomendacionesDetalle }
        : {}),
      ...(pr ? { personalRecommendations: pr } : {}),
      status: typeof payload.status === "string" ? payload.status : pr?.status || "success",
      timestamp:
        typeof payload.timestamp === "number" || typeof payload.timestamp === "string"
          ? payload.timestamp
          : pr?.timestamp || new Date().toISOString(),
      personalRecommendationsUpdatedAt: Date.now(),
    };

    await ref.set(write, { merge: true });

    return write;
  } catch (error) {
    if (error.code === "not-found" || error.code === "invalid-arg") throw error;
    console.error("Error en saveRecommendations(service):", error);
    throw new Error("Error al guardar recomendaciones.");
  }
}

/**
 * Actualiza parcialmente las recomendaciones (PATCH).
 */
async function patchRecommendations(patientId, analysisId, partial = {}) {
  try {
    ensureId(patientId);
    ensureId(analysisId);

    const ref = ANALYSIS_PATH(patientId, analysisId);
    const snap = await ref.get();
    if (!snap.exists) {
      const err = new Error("Cita/analysis no encontrada");
      err.code = "not-found";
      throw err;
    }

    const toMerge = {};
    if (partial.personalRecommendations) {
      toMerge.personalRecommendations = sanitizePersonalRecommendations(
        partial.personalRecommendations
      );
      // Mantén retro-compatibilidad
      toMerge.recomendaciones = fromPersonalToLegacyStrings(
        toMerge.personalRecommendations
      );
      toMerge.status = toMerge.personalRecommendations.status;
      toMerge.timestamp = toMerge.personalRecommendations.timestamp;
    }
    if (Array.isArray(partial.recomendaciones)) {
      toMerge.recomendaciones = partial.recomendaciones;
    }
    if (Array.isArray(partial.recomendacionesDetalle)) {
      toMerge.recomendacionesDetalle = partial.recomendacionesDetalle;
    }
    if (typeof partial.status === "string") {
      toMerge.status = partial.status;
    }
    if (typeof partial.timestamp === "number" || typeof partial.timestamp === "string") {
      toMerge.timestamp = partial.timestamp;
    }

    if (Object.keys(toMerge).length === 0) {
      return {}; // nada que escribir
    }

    toMerge.personalRecommendationsUpdatedAt = Date.now();

    await ref.set(toMerge, { merge: true });
    return toMerge;
  } catch (error) {
    if (error.code === "not-found" || error.code === "invalid-arg") throw error;
    console.error("Error en patchRecommendations(service):", error);
    throw new Error("Error al actualizar recomendaciones.");
  }
}

async function getLatestRecommendations(patientId) {
  try {
    if (!patientId) {
      const err = new Error("patientId requerido");
      err.code = "invalid-arg";
      throw err;
    }

    // Puedes usar FieldPath.documentId() (ya importaste FieldPath) o "__name__"
    const snap = await db
      .collection("patients")
      .doc(patientId)
      .collection("analyses")
      .orderBy(FieldPath.documentId(), "desc") // ⇐ también sirve "__name__"
      .limit(1)
      .get();

    if (snap.empty) {
      const err = new Error("no-analyses-for-patient");
      err.code = "not-found";
      throw err;
    }

    const analysisId = snap.docs[0].id;

    // Reusa la lectura normal para mantener el mismo shape
    const data = await getRecommendations(patientId, analysisId);
    return { analysisId, data };
  } catch (error) {
    // Log explícito para ver la causa real del 500 en consola de servidor
    console.error("[service:getLatestRecommendations] error:", error);
    // Respeta tus códigos ‘known’
    if (error.code === "not-found" || error.code === "invalid-arg") throw error;
    throw new Error("Error al obtener última cita.");
  }
}
module.exports = {
  getRecommendations,
  saveRecommendations,
  patchRecommendations,
  getLatestRecommendations,
};
