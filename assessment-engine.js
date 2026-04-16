const { GoogleGenerativeAI } = require('@google/generative-ai');

const ASSESSMENT_PROMPT = `You are an expert assessment evaluator at Cuemath. You have just observed a screening interview between Maya (the AI interviewer) and a tutor candidate. Your job is to produce a structured, fair, and evidence-based evaluation.

Analyze the full transcript below and produce a JSON assessment with the following structure. Be specific — cite actual quotes from the candidate as evidence.

SCORING GUIDE (0-100):
- 90-100: Exceptional — clearly demonstrates this skill
- 70-89: Good — solid demonstration with minor room for improvement
- 50-69: Borderline — shows some ability but notable weaknesses
- 30-49: Below expectations — significant concerns
- 0-29: Poor — does not demonstrate this skill

DIMENSIONS TO EVALUATE:

1. communicationClarity (0-100): How clearly and coherently does the candidate express ideas? Are their explanations structured and easy to follow?

2. warmthAndEmpathy (0-100): Does the candidate come across as approachable, kind, and caring? Would a child feel comfortable with them?

3. abilityToSimplify (0-100): Can the candidate break down complex concepts into simple, age-appropriate explanations? Do they use relatable analogies?

4. patienceAndAdaptability (0-100): How does the candidate respond to difficulty, confusion, or unexpected situations? Do they show patience and flexibility?

5. englishFluency (0-100): Is the candidate's English fluent and natural? (Note: Evaluate based on the transcription — some speech-to-text artifacts are normal and should not count against the candidate.)

IMPORTANT RULES:
- Be fair and evidence-based. Quote the candidate directly.
- Do NOT penalize for speech-to-text transcription errors
- If the interview was very short or the candidate gave minimal responses, note "insufficient data" and rate conservatively
- The overall score should be a WEIGHTED average, not a simple average. Communication and Simplification matter most for tutoring.
- recommendation must be one of: "ADVANCE", "REVIEW", "NOT_RECOMMENDED"

Respond with ONLY valid JSON matching this exact structure (no markdown, no code fences):
{
  "overallScore": <number>,
  "recommendation": "<ADVANCE|REVIEW|NOT_RECOMMENDED>",
  "dimensions": {
    "communicationClarity": {
      "score": <number>,
      "evidence": ["<direct quote 1>", "<direct quote 2>"],
      "notes": "<1-2 sentence assessment>"
    },
    "warmthAndEmpathy": {
      "score": <number>,
      "evidence": ["<direct quote 1>", "<direct quote 2>"],
      "notes": "<1-2 sentence assessment>"
    },
    "abilityToSimplify": {
      "score": <number>,
      "evidence": ["<direct quote 1>", "<direct quote 2>"],
      "notes": "<1-2 sentence assessment>"
    },
    "patienceAndAdaptability": {
      "score": <number>,
      "evidence": ["<direct quote 1>", "<direct quote 2>"],
      "notes": "<1-2 sentence assessment>"
    },
    "englishFluency": {
      "score": <number>,
      "evidence": ["<direct quote 1>", "<direct quote 2>"],
      "notes": "<1-2 sentence assessment>"
    }
  },
  "summary": "<3-4 sentence overall narrative>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "areasForImprovement": ["<area 1>", "<area 2>"],
  "interviewDuration": "<estimated duration>",
  "questionsAnswered": <number>
}`;

class AssessmentEngine {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  }

  async generateAssessment(transcript, metadata = {}) {
    try {
      const prompt = `${ASSESSMENT_PROMPT}\n\n--- INTERVIEW TRANSCRIPT ---\n\n${transcript}\n\n--- METADATA ---\nDuration: ${metadata.duration || 'Unknown'}\nQuestions asked: ${metadata.questionCount || 'Unknown'}`;

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text().trim();

      // Clean potential markdown code fences
      const cleanedJson = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const assessment = JSON.parse(cleanedJson);

      // Validate the assessment structure
      this._validateAssessment(assessment);

      return { assessment, error: null };
    } catch (error) {
      console.error('Assessment generation error:', error);
      return {
        assessment: this._getFallbackAssessment(),
        error: 'Assessment generation encountered an issue. A fallback report has been generated.',
      };
    }
  }

  _validateAssessment(assessment) {
    const requiredFields = ['overallScore', 'recommendation', 'dimensions', 'summary', 'strengths', 'areasForImprovement'];
    for (const field of requiredFields) {
      if (!(field in assessment)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    const dimensions = ['communicationClarity', 'warmthAndEmpathy', 'abilityToSimplify', 'patienceAndAdaptability', 'englishFluency'];
    for (const dim of dimensions) {
      if (!assessment.dimensions[dim]) {
        throw new Error(`Missing dimension: ${dim}`);
      }
    }
  }

  _getFallbackAssessment() {
    return {
      overallScore: 0,
      recommendation: 'REVIEW',
      dimensions: {
        communicationClarity: { score: 0, evidence: [], notes: 'Unable to assess — insufficient data or system error.' },
        warmthAndEmpathy: { score: 0, evidence: [], notes: 'Unable to assess — insufficient data or system error.' },
        abilityToSimplify: { score: 0, evidence: [], notes: 'Unable to assess — insufficient data or system error.' },
        patienceAndAdaptability: { score: 0, evidence: [], notes: 'Unable to assess — insufficient data or system error.' },
        englishFluency: { score: 0, evidence: [], notes: 'Unable to assess — insufficient data or system error.' },
      },
      summary: 'The assessment could not be completed due to insufficient data or a system error. A manual review is recommended.',
      strengths: [],
      areasForImprovement: ['Manual review required'],
      interviewDuration: 'Unknown',
      questionsAnswered: 0,
    };
  }
}

module.exports = new AssessmentEngine();
