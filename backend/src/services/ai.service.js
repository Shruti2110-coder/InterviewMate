const axios = require("axios");
const puppeteer = require("puppeteer");

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

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: "Return ONLY valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let text = response.data.choices[0].message.content;
    text = text.replace(/```json|```/g, "").trim();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return fallback();
    }

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
    console.log("AI ERROR:", error.message);
    return fallback();
  }
}

function fallback() {
  return {
    matchScore: 0,
    technicalQuestions: [],
    behavioralQuestions: [],
    skillGaps: [],
    preparationPlan: [],
    title: "Error generating report"
  };
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

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: "Return ONLY valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let text = response.data.choices[0].message.content;
    text = text.replace(/```json|```/g, "").trim();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON from AI");
    }

    const html = data.html || "<h1>No Resume Generated</h1>";

  const browser = await puppeteer.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox"
  ]
});

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm"
      }
    });

    await browser.close();

    return pdfBuffer;

  } catch (error) {
    console.log("PDF ERROR:", error.message);
    throw error;
  }
}

module.exports = {
  generateInterviewReport,
  generateResumePdf
};