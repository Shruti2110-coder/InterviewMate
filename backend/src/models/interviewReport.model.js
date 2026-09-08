const mongoose = require('mongoose');

const technicalQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  intention: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  }
}, { _id: false });

const behavioralQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  intention: { type: String, required: true },
  answer: { type: String, required: true }
}, { _id: false });

const skillGapSchema = new mongoose.Schema({
  skill: { type: String, required: true },
  severity: {
    type: String,
    enum: ["low", "medium", "high"],
    required: true
  }
}, { _id: false });

const preparationPlanSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  focus: { type: String, required: true },
  tasks: [{ type: String, required: true }]
});

const interviewReportSchema = new mongoose.Schema({
  jobDescription: {
    type: String,
    required: true
  },
  resume: String,
  selfDescription: String,
  // The AI returns a title and the UI renders it; without this field mongoose
  // strips it on save and every plan shows as "Untitled Position".
  title: String,
  matchScore: {
    type: Number,
    min: 0,
    max: 100
  },
  technicalQuestions: [technicalQuestionSchema],
  behavioralQuestions: [behavioralQuestionSchema],
  skillGaps: [skillGapSchema],
  preparationPlan: [preparationPlanSchema],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  }
}, { timestamps: true });

module.exports = mongoose.model('InterviewReport', interviewReportSchema);