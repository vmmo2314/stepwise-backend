const express = require("express")
const router = express.Router()
const organizationController = require("../controllers/organizationController")

// GET /api/organizations  → lista todas las organizaciones
router.get("/", organizationController.getAllOrganizations)

// POST /api/organizations/check-esp32  → verifica ESP32
router.post("/check-esp32", organizationController.checkEsp32Id)

module.exports = router