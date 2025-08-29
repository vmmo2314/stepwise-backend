const admin = require("firebase-admin")

// Asegúrate de que las variables de entorno estén configuradas en tu entorno de despliegue
// o en un archivo .env (para desarrollo)
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") : undefined,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
}

// Inicializa Firebase Admin SDK solo una vez
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // databaseURL: "https://<DATABASE_NAME>.firebaseio.com" // Si usas Realtime Database
  })
}

const db = admin.firestore()
const authAdmin = admin.auth() // Para verificación de tokens de autenticación

module.exports = { db, authAdmin, admin }
