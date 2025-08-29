// routes/analyses.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/analysisController');

// POST /api/analyses/:patientId         -> crear análisis
router.post('/:patientId', ctrl.createAnalysis);

// GET  /api/analyses/:patientId         -> lista (recientes)
router.get('/:patientId', ctrl.getAnalyses);

// GET  /api/analyses/:patientId/latest  -> último análisis
router.get('/:patientId/latest', ctrl.getLatestAnalysis);

// GET  /api/analyses/:patientId/:analysisId -> por ID
router.get('/:patientId/:analysisId', ctrl.getAnalysisById);

// PUT  /api/analyses/:patientId/:analysisId -> actualizar parcial
router.put('/:patientId/:analysisId', ctrl.updateAnalysis);

// DELETE /api/analyses/:patientId/:analysisId -> eliminar
router.delete('/:patientId/:analysisId', ctrl.deleteAnalysis);

module.exports = router;
