require('dotenv').config();
const app = require('./src/app');
require('./src/config/database')();
const { generateInterviewReport } = require('./src/services/ai.service');

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.get("/api/health", (req, res) => {
  const missing = [];
  if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");
  if (!process.env.MONGO_URI) missing.push("MONGO_URI");

  res.status(missing.length ? 500 : 200).json({
    status: missing.length ? "error" : "ok",
    missingEnv: missing,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
})