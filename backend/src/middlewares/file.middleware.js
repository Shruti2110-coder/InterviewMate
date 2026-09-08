const multer = require("multer")

const MAX_RESUME_BYTES = 5 * 1024 * 1024 // 5mb, matches the limit advertised in the UI

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_RESUME_BYTES
    },
    fileFilter: (req, file, cb) => {
        // Resumes are parsed with pdf-parse, which only understands PDF.
        if (file.mimetype === "application/pdf") return cb(null, true)
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "resume"))
    }
})

module.exports = upload
module.exports.MAX_RESUME_BYTES = MAX_RESUME_BYTES
