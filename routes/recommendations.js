// routes/recommendations.js
const express = require("express");
const router = express.Router();

// importa desde la raíz (ajusta si tu tree es distinto)
const { authenticateToken } = require("../middleware/authMiddleware");
const recommendationsController = require("../controllers/recommendationsController");

// protege todo el router
router.use(authenticateToken);

// ⚠️ RUTAS ESPECÍFICAS PRIMERO
// GET /api/analyses/:patientId/latest/recommendations
router.get(
  "/:patientId/latest/recommendations",
  recommendationsController.getLatestRecommendations
);

// Luego las que usan :analysisId
// GET/PUT/PATCH /api/analyses/:patientId/:analysisId/recommendations
router.get(
  "/:patientId/:analysisId/recommendations",
  recommendationsController.getRecommendations
);
router.put(
  "/:patientId/:analysisId/recommendations",
  recommendationsController.putRecommendations
);
router.patch(
  "/:patientId/:analysisId/recommendations",
  recommendationsController.patchRecommendations
);

module.exports = router;
