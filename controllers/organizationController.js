const organizationService = require("../services/organizationService")
const { getAllOrganizations: svcGetAllOrganizations } = require("../services/organizationService")


async function checkEsp32Id(req, res) {
  try {
    const { esp32Id, organizationName } = req.body
    if (!esp32Id || !organizationName) {
      return res.status(400).json({ error: "esp32Id y organizationName son requeridos." })
    }

    const result = await organizationService.checkEsp32IdAdvanced(esp32Id, organizationName)
    res.status(200).json(result)
  } catch (error) {
    console.error("Error in controller checkEsp32Id:", error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * GET /api/organizations
 * Lista todas las organizaciones de Firestore.
 */
async function getAllOrganizations(req, res) {
  try {
    const data = await svcGetAllOrganizations()
    return res.json(data)
  } catch (error) {
    console.error("organizationController.getAllOrganizations:", error)
    return res.status(500).json({ error: "Error al obtener organizaciones." })
  }
}

module.exports = {
  checkEsp32Id,
  getAllOrganizations,
}