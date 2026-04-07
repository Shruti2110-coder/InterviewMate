const express = require('express');
const cors = require("cors")

const cookieParser = require("cookie-parser")
const app = express();
app.use(cookieParser());

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:5173", // Development
      "http://localhost:5174", // Alternative dev port
      /\.vercel\.app$/, // Vercel production domains
      /\.now\.sh$/ // Vercel legacy domains
    ];

    // Check if the origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else {
        return allowedOrigin.test(origin);
      }
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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