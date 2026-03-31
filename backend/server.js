require('dotenv').config();
const app = require('./src/app');
require('./src/config/database')();
const { generateInterviewReport } = require('./src/services/ai.service');


 app.listen(3000,() => {
    console.log(`server is running on port 3000`);
 })