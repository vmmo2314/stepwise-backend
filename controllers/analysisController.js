// Backend1/controllers/analysisController.js
const analysisService = require('../services/analysisService');

async function createAnalysis(req, res) {
  try {
    const { patientId } = req.params;
    const data = req.body || {};
    const result = await analysisService.createAnalysis(patientId, data);
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error en controller createAnalysis:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function getAnalyses(req, res) {
  try {
    const { patientId } = req.params;
    const limit = req.query?.limit ? Number(req.query.limit) : undefined;
    const list = await analysisService.getAnalyses(patientId, limit);
    return res.status(200).json(list);
  } catch (error) {
    console.error('Error en controller getAnalyses:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function getLatestAnalysis(req, res) {
  try {
    const { patientId } = req.params;
    const latest = await analysisService.getLatestAnalysis(patientId);
    if (!latest) return res.status(404).json({ error: 'ANALYSIS_NOT_FOUND' });
    return res.status(200).json(latest);
  } catch (error) {
    console.error('Error en controller getLatestAnalysis:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function getAnalysisById(req, res) {
  try {
    const { patientId, analysisId } = req.params;
    const item = await analysisService.getAnalysisById(patientId, analysisId);
    if (!item) return res.status(404).json({ error: 'ANALYSIS_NOT_FOUND' });
    return res.status(200).json(item);
  } catch (error) {
    console.error('Error en controller getAnalysisById:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function updateAnalysis(req, res) {
  try {
    const { patientId, analysisId } = req.params;
    const partial = req.body || {};
    const updated = await analysisService.updateAnalysis(patientId, analysisId, partial);
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Error en controller updateAnalysis:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function deleteAnalysis(req, res) {
  try {
    const { patientId, analysisId } = req.params;
    await analysisService.deleteAnalysis(patientId, analysisId);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error en controller deleteAnalysis:', error);
    return res.status(500).json({ error: error.message });
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
