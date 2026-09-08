const axios = require("axios");
const puppeteer = require("puppeteer");

/**
 * Error type for AI failures, so controllers can map them to a real HTTP status
 * instead of persisting an empty report and reporting success.
 */
class AiError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "AiError";
    this.status = status;
  }
}

// Free OpenRouter models, so a zero-credit account works. They are heavily
// shared, so any single one can be overloaded or rate limited at any moment -
// we try them in order rather than giving up on the first busy provider.
// Set OPENROUTER_MODEL to pin your own model; it is tried first.
const FREE_MODELS = [
  "dots-studio/dots-3-note-preview:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free"
];

const MODELS = process.env.OPENROUTER_MODEL
  ? [process.env.OPENROUTER_MODEL, ...FREE_MODELS.filter(m => m !== process.env.OPENROUTER_MODEL)]
  : FREE_MODELS;

function requireApiKey() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new AiError(
      "AI is not configured on the server (OPENROUTER_API_KEY is missing).",
      503
    );
  }
}

/** Pull JSON out of a model reply that may be fenced or wrapped in prose. */
function parseJsonReply(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch { /* fall through */ }
    }
    throw new AiError("AI returned a malformed response. Please try again.");
  }
}

/** One completion against one model. Throws AiError on any failure. */
async function callModel({ model, prompt, temperature }) {
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model,
      messages: [
        { role: "system", content: "Return ONLY valid JSON. No prose, no markdown fences." },
        { role: "user", content: prompt }
      ],
      temperature,
      response_format: { type: "json_object" }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // Optional but recommended by OpenRouter for attribution.
        "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
        "X-Title": "InterviewMate"
      },
      timeout: 120000
    }
  );

  // OpenRouter reports upstream provider failures as HTTP 200 with an `error`
  // body and no `choices`, so this has to be checked explicitly.
  if (response.data?.error) {
    const { message, code } = response.data.error;
    throw new AiError(`${model}: ${message || "provider error"}`, code === 429 ? 429 : 502);
  }

  const text = response.data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new AiError(`${model}: returned an empty response.`);
  }

  return parseJsonReply(text);
}

/**
 * A completion returning parsed JSON, falling through the model list when a
 * provider is overloaded or rate limited.
 */
async function chatJson({ prompt, temperature }) {
  let lastError;

  for (const model of MODELS) {
    try {
      return await callModel({ model, prompt, temperature });
    } catch (error) {
      lastError = toAiError(error, "generate a response");
      // A bad key or no credit will fail identically on every model.
      if ([401, 403, 402].includes(error?.response?.status)) throw lastError;
      console.warn(`AI: ${model} unavailable (${lastError.message}); trying next model.`);
    }
  }

  throw new AiError(
    `All AI models are busy right now. Free models are shared and rate limited - please try again in a minute. (last: ${lastError?.message})`,
    503
  );
}

/* ---------------- INTERVIEW REPORT ---------------- */

function safeQuestions(arr = []) {
  return arr.map(q => ({
    question: q?.question || "N/A",
    intention: q?.intention || "N/A",
    answer: q?.answer || "To be prepared"
  }));
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

  const prompt = `
Return ONLY valid JSON.

STRICT RULES:
- Exactly 5 technical questions
- Exactly 3 behavioral questions
- Exactly 3 skill gaps
- Exactly 5 day plan

FORMAT:
{
  "matchScore": number,
  "technicalQuestions": [
    { "question": "", "intention": "", "answer": "" }
  ],
  "behavioralQuestions": [
    { "question": "", "intention": "", "answer": "" }
  ],
  "skillGaps": [
    { "skill": "", "severity": "low|medium|high" }
  ],
  "preparationPlan": [
    { "day": 1, "focus": "", "tasks": [""] }
  ],
  "title": ""
}

Resume: ${resume}
Self: ${selfDescription}
Job: ${jobDescription}
`;

  requireApiKey();

  try {
    const data = await chatJson({ prompt, temperature: 0.2 });

    return {
      matchScore: Number(data.matchScore) || 0,
      technicalQuestions: safeQuestions(data.technicalQuestions).slice(0, 5),
      behavioralQuestions: safeQuestions(data.behavioralQuestions).slice(0, 3),
      skillGaps: (data.skillGaps || []).slice(0, 3).map(s => ({
        skill: s?.skill || "N/A",
        severity: ["low", "medium", "high"].includes(s?.severity) ? s.severity : "low"
      })),
      preparationPlan: (data.preparationPlan || []).slice(0, 5).map((p, i) => ({
        day: p?.day || i + 1,
        focus: p?.focus || "Practice",
        tasks: Array.isArray(p?.tasks) ? p.tasks : ["Revise basics"]
      })),
      title: data.title || "Interview Report"
    };

  } catch (error) {
    console.error("AI ERROR:", error.message);
    // Never swallow this into an empty "successful" report - the caller must
    // be able to tell the user that generation actually failed.
    throw toAiError(error, "generate the interview report");
  }
}


/* ---------------- RESUME PDF ---------------- */

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

  const prompt = `
Return ONLY valid JSON.

FORMAT:
{
  "html": "<html>...</html>"
}

Create a professional resume:
- simple design
- ATS friendly
- 1 page
- clean inline CSS

Resume: ${resume}
Self: ${selfDescription}
Job: ${jobDescription}
`;

  requireApiKey();

  let browser;
  try {
    const data = await chatJson({ prompt, temperature: 0.3 });

    const html = data.html || "<h1>No Resume Generated</h1>";

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    return await page.pdf({
      format: "A4",
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm"
      }
    });

  } catch (error) {
    console.error("PDF ERROR:", error.message);
    throw toAiError(error, "generate the resume PDF");
  } finally {
    // Without this, every failed render leaks a Chromium process.
    if (browser) await browser.close().catch(() => {});
  }
}

module.exports = {
  generateInterviewReport,
  generateResumePdf,
  AiError
};