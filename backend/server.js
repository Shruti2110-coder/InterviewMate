require('dotenv').config();
const app = require('./src/app');
const connectionToDB = require('./src/config/database');
connectionToDB();
const { generateInterviewReport } = require('./src/services/ai.service');

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.get("/api/health", (req, res) => {
  const missing = [];
  if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");
  if (!process.env.MONGO_URI) missing.push("MONGO_URI");
  if (!process.env.OPENROUTER_API_KEY) missing.push("OPENROUTER_API_KEY");

  // Report the database too - a healthy process with a dead database was the
  // failure mode that made production look fine while every real route 502'd.
  const db = connectionToDB.dbStatus();
  const healthy = missing.length === 0 && db.state === "connected";

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "error",
    missingEnv: missing,
    database: db,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
})