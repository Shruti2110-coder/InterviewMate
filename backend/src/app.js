const express = require('express');
const cors = require("cors")

const cookieParser = require("cookie-parser")
const app = express();
app.use(cookieParser());

app.use(cors({
  origin: ["http://localhost:5173", "https://your-frontend-domain.com"], // ✅ frontend URL(s)
  credentials: true
}));

app.use(express.json());








const authRouter = require('./routes/auth.route');
const interviewRouter = require("./routes/interview.routes")


app.use('/api/auth', authRouter);   
app.use('/api/interview',interviewRouter)



module.exports = app