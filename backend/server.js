require('dotenv').config();
const app = require('./src/app');
require('./src/config/database')();
const { generateInterviewReport } = require('./src/services/ai.service');

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
})