// Backend1/controllers/recommendationsController.js
// ➜ CREA este archivo NUEVO (no reemplaza otros).
// Estilo de controladores igual al de pacientes: try/catch + mapeo de status por error.code. 
// (ver patrón en tu patientController) :contentReference[oaicite:0]{index=0}

const recommendationsService = require("../services/recommendationsService"); // ajusta si usas alias

// GET /api/analyses/:patientId/:analysisId/recommendations
async function getRecommendations(req, res) {
  try {
    const { patientId, analysisId } = req.params;
    if (!patientId || !analysisId) {
      return res.status(400).json({ error: "patientId y analysisId son requeridos." });
    }

    const data = await recommendationsService.getRecommendations(patientId, analysisId);
    return res.status(200).json({
      ok: true,
      patientId,
      analysisId,
      path: `patients/${patientId}/analyses/${analysisId}`,
      ...data,
    });
  } catch (error) {
    const status =
      error.code === "not-found" ? 404 :
      error.code === "invalid-arg" ? 400 : 500; // mismo patrón que usas :contentReference[oaicite:1]{index=1}
    return res.status(status).json({ error: error.message });
  }
}

// PUT /api/analyses/:patientId/:analysisId/recommendations
async function putRecommendations(req, res) {
  try {
    const { patientId, analysisId } = req.params;
    if (!patientId || !analysisId) {
      return res.status(400).json({ error: "patientId y analysisId son requeridos." });
    }
    const payload = req.body || {};

    const saved = await recommendationsService.saveRecommendations(
      patientId,
      analysisId,
      payload
    );

    return res.status(200).json({
      ok: true,
      patientId,
      analysisId,
      path: `patients/${patientId}/analyses/${analysisId}`,
      saved,
    });
  } catch (error) {
    const status =
      error.code === "not-found" ? 404 :
      error.code === "invalid-arg" ? 400 : 500; // patrón consistente :contentReference[oaicite:2]{index=2}
    return res.status(status).json({ error: error.message });
  }
}

// PATCH /api/analyses/:patientId/:analysisId/recommendations
async function patchRecommendations(req, res) {
  try {
    const { patientId, analysisId } = req.params;
    if (!patientId || !analysisId) {
      return res.status(400).json({ error: "patientId y analysisId son requeridos." });
    }
    const partial = req.body || {};

    const saved = await recommendationsService.patchRecommendations(
      patientId,
      analysisId,
      partial
    );

    return res.status(200).json({
      ok: true,
      patientId,
      analysisId,
      path: `patients/${patientId}/analyses/${analysisId}`,
      saved,
    });
  } catch (error) {
    const status =
      error.code === "not-found" ? 404 :
      error.code === "invalid-arg" ? 400 : 500; // mismo estilo de manejo de errores :contentReference[oaicite:3]{index=3}
    return res.status(status).json({ error: error.message });
  }
}

// NUEVO: última cita (GET)
async function getLatestRecommendations(req, res) {
  try {
    const { patientId } = req.params;
    if (!patientId) {
      return res.status(400).json({ ok: false, error: 'patientId es requerido.' });
    }

    const { analysisId, data } = await recommendationsService.getLatestRecommendations(patientId);

    return res.status(200).json({
      ok: true,
      patientId,
      analysisId,
      ...data, // mismo shape que getRecommendations()
    });
  } catch (err) {
    console.error("[controller:getLatestRecommendations] error:", err);
    const code =
      err?.code === "not-found" ? 404 :
      err?.code === "invalid-arg" ? 400 : 500;
    return res.status(code).json({ ok: false, error: err?.message || "internal-error" });
  }
}

module.exports = {
  getRecommendations,
  putRecommendations,
  patchRecommendations,
  getLatestRecommendations,
};
