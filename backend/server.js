require('dotenv').config();
const app = require('./src/app');
require('./src/config/database')();
const { generateInterviewReport } = require('./src/services/ai.service');

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

 app.listen(3000,() => {
    console.log(`server is running on port 3000`);
 })