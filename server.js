require('dotenv').config();
const express = require('express');
const path = require('path');
const conversationEngine = require('./conversation-engine');
const assessmentEngine = require('./assessment-engine');
const sessionManager = require('./session-manager');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Store chat sessions in memory (keyed by session ID)
const chatSessions = new Map();

// --- API Routes ---

// Start a new interview session
app.post('/api/start-session', async (req, res) => {
  try {
    const session = sessionManager.createSession();
    const { greeting, chatSession } = await conversationEngine.startConversation();

    chatSessions.set(session.id, chatSession);
    sessionManager.addMessage(session.id, 'assistant', greeting);

    res.json({
      sessionId: session.id,
      greeting,
      status: 'active',
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start interview session. Please try again.' });
  }
});

// Send a message (candidate transcript) and get AI response
app.post('/api/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: 'Session ID and message are required.' });
    }

    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found. It may have expired.' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'This session has already ended.' });
    }

    const chatSession = chatSessions.get(sessionId);
    if (!chatSession) {
      return res.status(404).json({ error: 'Chat session not found.' });
    }

    // Record candidate message
    sessionManager.addMessage(sessionId, 'user', message);
    sessionManager.incrementQuestionCount(sessionId);

    // Check if we should wrap up (after 7+ exchanges or 12+ minutes)
    const elapsed = Date.now() - session.startTime;
    const shouldWrapUp = session.questionCount >= 7 || elapsed > 12 * 60 * 1000;

    let aiResponse;
    if (shouldWrapUp && session.questionCount >= 7) {
      const { response, error } = await conversationEngine.sendMessage(
        chatSession,
        message + '\n\n[SYSTEM NOTE: This has been a good conversation. After responding to this, begin wrapping up the interview naturally. Ask if they have questions, then thank them warmly.]'
      );
      aiResponse = response || error;
    } else {
      const { response, error } = await conversationEngine.sendMessage(chatSession, message);
      aiResponse = response || error;
    }

    sessionManager.addMessage(sessionId, 'assistant', aiResponse);

    res.json({
      response: aiResponse,
      questionCount: session.questionCount,
      elapsed: Math.floor(elapsed / 1000),
      shouldWrapUp,
    });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message. Please try again.' });
  }
});

// End session and generate assessment
app.post('/api/end-session', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required.' });
    }

    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    // Generate transcript
    const transcript = sessionManager.getTranscript(sessionId);
    const duration = Date.now() - session.startTime;
    const durationMinutes = Math.floor(duration / 60000);
    const durationSeconds = Math.floor((duration % 60000) / 1000);

    // Generate assessment
    const { assessment, error } = await assessmentEngine.generateAssessment(transcript, {
      duration: `${durationMinutes}m ${durationSeconds}s`,
      questionCount: session.questionCount,
    });

    sessionManager.setReport(sessionId, assessment);

    // Clean up chat session
    chatSessions.delete(sessionId);

    res.json({
      assessment,
      duration: `${durationMinutes}m ${durationSeconds}s`,
      error,
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to generate assessment. Please try again.' });
  }
});

// Get session report
app.get('/api/session/:id/report', (req, res) => {
  const session = sessionManager.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }
  if (!session.report) {
    return res.status(400).json({ error: 'Assessment not yet generated.' });
  }
  res.json({ report: session.report });
});

// Text-to-Speech via Microsoft Edge TTS (free, no API key, neural quality)
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required.' });
    }

    const tts = new MsEdgeTTS();
    await tts.setMetadata('en-US-AvaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(text);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');

    audioStream.on('data', (chunk) => {
      res.write(chunk);
    });

    audioStream.on('close', () => {
      res.end();
    });

    audioStream.on('error', (err) => {
      console.error('Edge TTS stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'TTS generation failed.' });
      } else {
        res.end();
      }
    });
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'TTS generation failed.' });
  }
});


// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🎯 Cuemath AI Tutor Screener is running!`);
  console.log(`   http://localhost:${PORT}\n`);
});
