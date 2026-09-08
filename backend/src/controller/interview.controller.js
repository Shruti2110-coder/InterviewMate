const mongoose = require("mongoose")
const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model")


/** Map a thrown AI/service error onto an HTTP response. */
function sendError(res, error, fallbackMessage) {
    const status = error?.status || 500
    console.error("INTERVIEW ERROR:", error?.message || error)
    return res.status(status).json({
        message: status === 500 ? fallbackMessage : error.message
    })
}


/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        const jobDescription = (req.body?.jobDescription || "").trim()
        const selfDescription = (req.body?.selfDescription || "").trim()

        if (!jobDescription) {
            return res.status(400).json({
                message: "Job description is required."
            })
        }

        // The UI offers "resume OR self description" - honour both paths instead
        // of assuming a file is always present.
        if (!req.file && !selfDescription) {
            return res.status(400).json({
                message: "Upload a resume or write a short self description to generate a plan."
            })
        }

        let resumeContent = ""
        if (req.file) {
            try {
                const parsed = await new pdfParse.PDFParse(Uint8Array.from(req.file.buffer)).getText()
                resumeContent = parsed?.text || ""
            } catch (error) {
                console.error("RESUME PARSE ERROR:", error.message)
                return res.status(400).json({
                    message: "That resume could not be read. Please upload a valid, text-based PDF."
                })
            }

            if (!resumeContent.trim() && !selfDescription) {
                return res.status(400).json({
                    message: "No text could be extracted from that PDF (it may be a scan). Add a self description instead."
                })
            }
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeContent,
            selfDescription,
            jobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeContent,
            selfDescription,
            jobDescription,
            ...interViewReportByAi
        })

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (error) {
        return sendError(res, error, "Could not generate the interview report.")
    }
}


async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params

        if (!mongoose.Types.ObjectId.isValid(interviewId)) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport
        })
    } catch (error) {
        return sendError(res, error, "Could not fetch the interview report.")
    }
}


/**
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

        res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        })
    } catch (error) {
        return sendError(res, error, "Could not fetch your interview reports.")
    }
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        if (!mongoose.Types.ObjectId.isValid(interviewReportId)) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        // Scope to the owner: without the user filter any signed-in account could
        // download a resume built from someone else's report.
        const interviewReport = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: req.user.id
        })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)
    } catch (error) {
        return sendError(res, error, "Could not generate the resume PDF.")
    }
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }
