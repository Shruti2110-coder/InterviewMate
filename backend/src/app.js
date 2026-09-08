const express = require('express');
const cors = require("cors")

const cookieParser = require("cookie-parser")
const app = express();
app.use(cookieParser());

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://interview-mate-yl8d.vercel.app",
  "https://interview-mate-4ulh.vercel.app",
  "https://interview-mate-4ulh-n21vydtxb-shruti-jains-projects-65689fa9.vercel.app",
];

const envAllowedOrigins = [
  ...(process.env.FRONTEND_URLS
    ? process.env.FRONTEND_URLS.split(",").map((origin) => origin.trim()).filter(Boolean)
    : []),
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.trim()] : []),
];

const allowedOrigins = envAllowedOrigins.length ? envAllowedOrigins : defaultAllowedOrigins;

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser clients or same-origin requests without Origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json());








const authRouter = require('./routes/auth.route');
const interviewRouter = require("./routes/interview.routes")


app.use('/api/auth', authRouter);
app.use('/api/interview', interviewRouter);

const multer = require('multer');
const { MAX_RESUME_BYTES } = require('./middlewares/file.middleware');

app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: err.message });
  }

  // Upload problems are the user's to fix, not a 500.
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: `Resume is too large. Maximum size is ${MAX_RESUME_BYTES / (1024 * 1024)}MB.`
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Only PDF resumes are supported.' });
    }
    return res.status(400).json({ message: `Upload failed: ${err.message}` });
  }

  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

module.exports = app