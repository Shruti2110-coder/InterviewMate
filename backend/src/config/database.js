const mongoose = require('mongoose');

// Last connection error, surfaced through /api/health so a failing database
// is diagnosable from outside the box instead of only in a restart-loop log.
let lastError = null;

const STATES = ["disconnected", "connected", "connecting", "disconnecting"];

function dbStatus() {
    return {
        state: STATES[mongoose.connection.readyState] || "unknown",
        error: lastError
    };
}

async function connectionToDB(attempt = 1) {
    if (!process.env.MONGO_URI) {
        lastError = "MONGO_URI is not set";
        console.error("DB: MONGO_URI is not set");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000
        });
        lastError = null;
        console.log("connected to database successfully");
    } catch (error) {
        lastError = error.message;
        console.error(`DB: connection attempt ${attempt} failed - ${error.message}`);

        // Exiting here used to kill the process after it had already started
        // listening, so Render saw an opaque 502/503 crash-loop with no clue.
        // Stay up, keep retrying, and report the reason via /api/health.
        const delay = Math.min(30000, 2000 * attempt);
        setTimeout(() => connectionToDB(attempt + 1), delay);
    }
}

module.exports = connectionToDB;
module.exports.dbStatus = dbStatus;
