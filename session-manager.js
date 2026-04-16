const { v4: uuidv4 } = require('uuid');

class SessionManager {
  constructor() {
    this.sessions = new Map();
    // Clean up stale sessions every 30 minutes
    setInterval(() => this._cleanup(), 30 * 60 * 1000);
  }

  createSession() {
    const id = uuidv4();
    const session = {
      id,
      status: 'active', // active | completed | abandoned
      startTime: Date.now(),
      conversationHistory: [],
      questionCount: 0,
      report: null,
    };
    this.sessions.set(id, session);
    return session;
  }

  getSession(id) {
    return this.sessions.get(id) || null;
  }

  addMessage(sessionId, role, content) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    session.conversationHistory.push({
      role,
      content,
      timestamp: Date.now(),
    });
    return session;
  }

  incrementQuestionCount(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) session.questionCount++;
    return session;
  }

  setReport(sessionId, report) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    session.report = report;
    session.status = 'completed';
    session.endTime = Date.now();
    return session;
  }

  setStatus(sessionId, status) {
    const session = this.sessions.get(sessionId);
    if (session) session.status = status;
    return session;
  }

  getTranscript(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return '';
    return session.conversationHistory
      .map((msg) => `${msg.role === 'user' ? 'Candidate' : 'Maya (Interviewer)'}: ${msg.content}`)
      .join('\n\n');
  }

  _cleanup() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [id, session] of this.sessions) {
      if (session.startTime < oneHourAgo) {
        this.sessions.delete(id);
      }
    }
  }
}

module.exports = new SessionManager();
