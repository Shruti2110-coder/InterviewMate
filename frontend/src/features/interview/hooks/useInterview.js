import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { useContext, useEffect, useCallback } from "react"
import { InterviewContext } from "../interview.context.jsx"
import { useParams } from "react-router-dom"


/** Pull the server's message out of an axios error, with a sane fallback. */
const messageFrom = (error, fallback) =>
    error?.response?.data?.message ||
    (error?.code === "ERR_NETWORK" ? "Could not reach the server. Please check your connection and try again." : null) ||
    error?.message ||
    fallback


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports, error, setError } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        setError(null)
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (err) {
            setError(messageFrom(err, "Could not generate your interview plan."))
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReportById = useCallback(async (id) => {
        setLoading(true)
        setError(null)
        try {
            const response = await getInterviewReportById(id)
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (err) {
            setReport(null)
            setError(messageFrom(err, "Could not load this interview plan."))
            return null
        } finally {
            setLoading(false)
        }
    }, [setLoading, setReport, setError])

    const getReports = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await getAllInterviewReports()
            const list = response?.interviewReports || []
            setReports(list)
            return list
        } catch (err) {
            setReports([])
            setError(messageFrom(err, "Could not load your saved plans."))
            return []
        } finally {
            setLoading(false)
        }
    }, [setLoading, setReports, setError])

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        setError(null)
        let url
        try {
            const data = await generateResumePdf({ interviewReportId })
            url = window.URL.createObjectURL(new Blob([data], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (err) {
            // The error body arrives as a Blob because of responseType: "blob".
            let message = "Could not generate your resume PDF."
            try {
                const body = err?.response?.data
                if (body instanceof Blob) {
                    message = JSON.parse(await body.text())?.message || message
                } else {
                    message = messageFrom(err, message)
                }
            } catch {
                message = messageFrom(err, message)
            }
            setError(message)
        } finally {
            if (url) window.URL.revokeObjectURL(url)
            setLoading(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [interviewId, getReportById, getReports])

    return { loading, report, reports, error, setError, generateReport, getReportById, getReports, getResumePdf }

}
