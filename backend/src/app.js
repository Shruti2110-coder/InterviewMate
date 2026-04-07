const express = require('express');
const cors = require("cors")

const cookieParser = require("cookie-parser")
const app = express();
app.use(cookieParser());

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());








const authRouter = require('./routes/auth.route');
const interviewRouter = require("./routes/interview.routes")


app.use('/api/auth', authRouter);
app.use('/api/interview', interviewRouter);

app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: err.message });
  }
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

module.exports = app