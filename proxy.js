require("dotenv").config()

const express = require("express")
const cors = require("cors")
const multer = require("multer")
const patientRoutes = require("./routes/patients")
const uploadRoutes = require("./routes/upload")
const doctorRoutes = require("./routes/doctors")
const userRoutes = require("./routes/users")
const postRoutes = require("./routes/posts")
const authRoutes = require("./routes/auth")
const organizationRoutes = require("./routes/organizations")
const analysisRoutes = require("./routes/analyses")
const appointmentRoutes = require("./routes/appointments")
const recommendationsRoutes = require("./routes/recommendations");
const profileRoutes = require("./routes/profile")

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// NEW: Nominatim Proxy Routes
// These routes will forward requests to the actual Nominatim API
app.get("/nominatim/search", async (req, res) => {
  try {
    const query = req.query.q
    if (!query) {
      return res.status(400).json({ error: "Query parameter 'q' is required." })
    }
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "MyFootPredictionApp/1.0 (contact@myfootapp.com)", // <--- ENSURE THIS IS UNIQUE AND DESCRIPTIVE!
      },
    })
    // Check if the response is OK (status 200) and if it's JSON
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Nominatim search non-OK response:", response.status, errorText)
      return res.status(response.status).json({ error: `Nominatim search failed: ${errorText}` })
    }
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error("Error proxying Nominatim search:", error)
    res.status(500).json({ error: "Error proxying Nominatim search." })
  }
})

app.get("/nominatim/reverse", async (req, res) => {
  try {
    const { lat, lon } = req.query
    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude and longitude are required." })
    }
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "MyFootPredictionApp/1.0 (contact@myfootapp.com)", // <--- ENSURE THIS IS UNIQUE AND DESCRIPTIVE!
      },
    })
    // Check if the response is OK (status 200) and if it's JSON
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Nominatim reverse non-OK response:", response.status, errorText)
      return res.status(response.status).json({ error: `Nominatim reverse failed: ${errorText}` })
    }
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error("Error proxying Nominatim reverse:", error)
    res.status(500).json({ error: "Error proxying Nominatim reverse." })
  }
})

// Rutas existentes
app.use("/api/patients", patientRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api/doctors", doctorRoutes)
app.use("/api/users", userRoutes)
app.use("/api/posts", postRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/organizations", organizationRoutes)
app.use("/api/appointments", appointmentRoutes)
app.use("/api/analyses", recommendationsRoutes);
app.use("/api/analyses", analysisRoutes)
app.use("/api/profile", profileRoutes)

// Ruta de ejemplo para verificar que el servidor está funcionando
app.get("/", (req, res) => {
  res.send("Backend API is running!")
})

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🌐 Backend corriendo en http://localhost:${PORT}`)
})
