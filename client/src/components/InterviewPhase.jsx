import { useState, useEffect, useRef, useCallback } from 'react';
import GradientOrbs from './GradientOrbs';
import { CuemathLogo, MicIcon, MicOffIcon, StopIcon, ChatIcon } from './Icons';

export default function InterviewPhase({ sessionId, greeting: initialGreeting, onEnd }) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('connecting'); // connecting | listening | thinking | speaking | paused
  const [elapsed, setElapsed] = useState(0);
  const [questionCount, setQuestionCount] = useState(1);
  const [interimText, setInterimText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const transcriptRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const currentTranscriptRef = useRef('');
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  // Maya audio analysis (TTS output)
  const mayaAudioContextRef = useRef(null);
  const mayaAnalyserRef = useRef(null);
  const isSpeakingRef = useRef(false);
  // Refs to avoid stale closures in recognition callbacks
  const statusRef = useRef(status);
  const isEndingRef = useRef(isEnding);
  const isMutedRef = useRef(isMuted);
  const lastInterimRef = useRef('');

  // Keep refs in sync with state
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { isEndingRef.current = isEnding; }, [isEnding]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Canvas visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    const dataArray = new Uint8Array(128); // For reading mic data
    const mayaDataArray = new Uint8Array(128); // For reading Maya TTS audio data

    let phase = 0;
    let rotation = 0; // Tracks the current rotation angle of the ring
    let frameCount = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      phase += 0.03;
      frameCount++;

      let currentVolume = 0;
      if (analyserRef.current && status === 'listening') {
        analyserRef.current.getByteFrequencyData(dataArray);
        currentVolume = dataArray.reduce((summary, val) => summary + val, 0) / dataArray.length;
        currentVolume = currentVolume / 128; // Normalize ~ 0 to 1
      } else if (status === 'speaking') {
        // Use real Maya audio data for rotation speed
        if (mayaAnalyserRef.current) {
          mayaAnalyserRef.current.getByteFrequencyData(mayaDataArray);
          currentVolume = mayaDataArray.reduce((sum, val) => sum + val, 0) / mayaDataArray.length / 128;
        } else {
          currentVolume = 0.3; // Fallback if analyser not ready
        }
      }

      // Rotate the ring based on volume (spins when speaking)
      if (currentVolume > 0.05) {
        rotation += 0.001 + (currentVolume * 0.006); // Subtler active rotation
      } else {
        rotation += 0.0003; // Very slow passive drift when quiet
      }

      if (status === 'connecting' || status === 'thinking') {
        // Connecting state: pulse rings (start outside avatar)
        ctx.beginPath();
        const pulseRatio = (phase * 0.3) % 1;
        ctx.arc(cx, cy, 120 + pulseRatio * 80, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(138, 156, 123, ${0.12 * (1 - pulseRatio)})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(138, 156, 123, ${0.3 * (1 - pulseRatio)})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        const pulseRatio2 = ((phase * 0.3) + 0.5) % 1;
        ctx.arc(cx, cy, 120 + pulseRatio2 * 80, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(138, 156, 123, ${0.12 * (1 - pulseRatio2)})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(138, 156, 123, ${0.3 * (1 - pulseRatio2)})`;
        ctx.stroke();
      } else {
        // Listening / Speaking state: 2 dashed rings (Inner = Maya, Outer = Candidate)
        const numBars = 64;
        const barWidth = 3;

        ctx.lineCap = 'round';
        ctx.lineWidth = barWidth;

        // --- Outer Ring (Candidate) ---
        const candRadius = 155;
        const candBaseExt = status === 'listening' ? 4 : 2; // Thicker base dashes when active
        for (let i = 0; i < numBars; i++) {
          const angle = (i / numBars) * Math.PI * 2 + (rotation * 0.8);

          let extension = candBaseExt;
          if (status === 'listening' && analyserRef.current && currentVolume > 0.01) {
            const dataIndex = Math.floor((i / numBars) * (dataArray.length * 0.7)); // Map frequencies directly
            const frequencyVal = dataArray[dataIndex] / 255;
            extension = candBaseExt + (frequencyVal * 35); // Straight data, no sinusoidal waves
          }

          const startX = cx + Math.cos(angle) * candRadius;
          const startY = cy + Math.sin(angle) * candRadius;
          const endX = cx + Math.cos(angle) * (candRadius + extension);
          const endY = cy + Math.sin(angle) * (candRadius + extension);

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = status === 'listening' ? '#368c34' : 'rgba(54, 140, 52, 0.3)'; // Dim when not active
          ctx.stroke();
        }

        // --- Inner Ring (Maya) --- Real FFT from TTS audio output
        const mayaRadius = 115;
        const mayaBaseExt = status === 'speaking' ? 4 : 2;
        // mayaDataArray was already populated above when computing currentVolume

        for (let i = 0; i < numBars; i++) {
          const angle = (i / numBars) * Math.PI * 2 - (rotation * 1.2); // Opposite rotation direction

          let extension = mayaBaseExt;
          if (status === 'speaking' && mayaAnalyserRef.current && currentVolume > 0.01) {
            const dataIndex = Math.floor((i / numBars) * (mayaDataArray.length * 0.7));
            const frequencyVal = mayaDataArray[dataIndex] / 255;
            extension = mayaBaseExt + (frequencyVal * 35);
          }

          const startX = cx + Math.cos(angle) * mayaRadius;
          const startY = cy + Math.sin(angle) * mayaRadius;
          const endX = cx + Math.cos(angle) * (mayaRadius + extension);
          const endY = cy + Math.sin(angle) * (mayaRadius + extension);

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = status === 'speaking' ? '#F5A623' : 'rgba(245, 166, 35, 0.3)';
          ctx.stroke();
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [status]);

  // Setup audio analysis for volume meter
  const setupAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
    } catch (err) {
      console.error('Audio setup error:', err);
    }
  }, []);

  // Audio element ref for TTS playback
  const audioRef = useRef(null);
  const speakCancelledRef = useRef(false);

  // Helper: fetch TTS audio for a single chunk of text from Edge TTS server
  const fetchTTSChunk = useCallback(async (text) => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
    return await res.blob();
  }, []);

  // Helper: play a single audio blob and return a promise that resolves when done
  const playAudioBlob = useCallback((blob) => {
    return new Promise((resolve, reject) => {
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Connect TTS audio to an AnalyserNode for real FFT visualization
      try {
        if (!mayaAudioContextRef.current) {
          mayaAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const mayaCtx = mayaAudioContextRef.current;
        if (mayaCtx.state === 'suspended') mayaCtx.resume();
        const source = mayaCtx.createMediaElementSource(audio);
        const analyser = mayaCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(mayaCtx.destination);
        mayaAnalyserRef.current = analyser;
      } catch (audioErr) {
        console.warn('Could not connect TTS audio to analyser:', audioErr);
      }

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        mayaAnalyserRef.current = null;
        resolve();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        mayaAnalyserRef.current = null;
        reject(new Error('Audio playback failed'));
      };

      audio.play().catch(reject);
    });
  }, []);

  // Speak text using Edge TTS (single request for full text)
  const speak = useCallback((text) => {
    return new Promise(async (resolve) => {
      isSpeakingRef.current = true;
      setStatus('speaking');

      // Cancel any ongoing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.speechSynthesis?.cancel();

      try {
        const blob = await fetchTTSChunk(text);
        await playAudioBlob(blob);
        isSpeakingRef.current = false;
        resolve();
      } catch (err) {
        console.warn('Edge TTS failed, using browser fallback:', err.message);
        speakFallback(text).then(resolve);
      }
    });
  }, [fetchTTSChunk, playAudioBlob]);

  // Browser SpeechSynthesis fallback
  const speakFallback = useCallback((text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        isSpeakingRef.current = false;
        resolve();
        return;
      }

      window.speechSynthesis.cancel(); // Clear queue to prevent double-speaking

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.name.includes('Google') && v.lang.startsWith('en') ||
        v.name.includes('Natural') && v.lang.startsWith('en') ||
        v.name.includes('Samantha')
      ) || voices.find(v => v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setStatus('speaking');
      };
      utterance.onend = () => {
        isSpeakingRef.current = false;
        resolve();
      };
      utterance.onerror = () => {
        isSpeakingRef.current = false;
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // Send message to API
  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setStatus('thinking');
    setInterimText('');

    try {
      const res = await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text }),
      });
      const data = await res.json();

      if (data.response) {
        setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
        setQuestionCount(data.questionCount || questionCount + 1);

        // Speak the response
        await speak(data.response);
        setStatus('listening');
        startListening();
      }
    } catch (err) {
      console.error('Message error:', err);
      setMessages(prev => [...prev, { role: 'ai', content: "I had a brief connection issue. Could you please repeat what you said?" }]);
      setStatus('listening');
      startListening();
    }
  }, [sessionId, questionCount, speak]);

  // Start speech recognition
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Guard against double-starts (both onerror and onend can trigger restart)
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) { }
      recognitionRef.current = null;
    }

    // Small delay to let previous instance fully clean up
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognition.maxAlternatives = 1;

    // Track if this instance's onerror already scheduled a restart
    let errorHandled = false;

    recognition.onresult = (event) => {
      if (isSpeakingRef.current) return;

      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (final) {
        currentTranscriptRef.current += final;
        lastInterimRef.current = '';
        setInterimText('');

        // Wait 3.5s of silence after finalized speech before sending
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          flushAndSend();
        }, 3500);
      } else if (interim) {
        lastInterimRef.current = interim;
        setInterimText(interim);

        // Wait 5s for interim — user might be mid-thought
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          flushAndSend();
        }, 5000);
      }
    };

    recognition.onerror = (event) => {
      console.log('Recognition error:', event.error);

      if (['no-speech', 'aborted', 'network'].includes(event.error)) {
        errorHandled = true;

        // Flush any buffered text before restarting
        const buffered = currentTranscriptRef.current.trim();
        const interim = lastInterimRef.current.trim();
        if (buffered || interim) {
          clearTimeout(silenceTimerRef.current);
          const textToSend = buffered || interim;
          currentTranscriptRef.current = '';
          lastInterimRef.current = '';
          setInterimText('');
          sendMessage(textToSend);
          // Don't restart here — sendMessage will restart after AI responds
          return;
        }

        // No buffered text — just restart listening
        scheduleRestart(800);
      }
    };

    recognition.onend = () => {
      // Don't restart if onerror already handled it
      if (errorHandled) return;

      // Auto-restart if we should still be listening
      if (shouldKeepListening()) {
        scheduleRestart(300);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setStatus('listening');
    } catch (err) {
      console.error('Recognition start error:', err);
      scheduleRestart(1000);
    }
  }, [sendMessage]);

  // Helper: check if we should keep listening
  const shouldKeepListening = useCallback(() => {
    return !isSpeakingRef.current
      && statusRef.current !== 'thinking'
      && !isEndingRef.current
      && !isMutedRef.current;
  }, []);

  // Helper: schedule a restart with a guard against rapid-fire restarts
  const restartTimerRef = useRef(null);
  const scheduleRestart = useCallback((delay) => {
    clearTimeout(restartTimerRef.current);
    restartTimerRef.current = setTimeout(() => {
      if (shouldKeepListening()) {
        startListening();
      }
    }, delay);
  }, [shouldKeepListening, startListening]);

  // Helper: flush buffered text and send as a message
  const flushAndSend = useCallback(() => {
    let text = currentTranscriptRef.current.trim();
    const interim = lastInterimRef.current.trim();
    if (!text && interim) text = interim;

    if (text) {
      currentTranscriptRef.current = '';
      lastInterimRef.current = '';
      setInterimText('');
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { }
      }
      sendMessage(text);
    }
  }, [sendMessage]);

  // Initialize conversation
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      await setupAudio();

      // Load voices
      if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
          speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
        }
      }

      // Guard: if StrictMode already unmounted this instance, don't speak
      if (cancelled) return;

      // Use greeting from landing phase
      const greetingText = initialGreeting || "Hi there! Welcome to your Cuemath tutor screening. I'm Maya, and I'll be chatting with you today. Could you start by telling me a bit about yourself?";
      setMessages([{ role: 'ai', content: greetingText }]);
      await speak(greetingText);

      if (cancelled) return;
      setStatus('listening');
      startListening();
    };

    init();

    return () => {
      cancelled = true;
      speakCancelledRef.current = true;
      clearInterval(timerRef.current);
      clearTimeout(silenceTimerRef.current);
      clearTimeout(restartTimerRef.current);
      cancelAnimationFrame(animFrameRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) { }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.speechSynthesis?.cancel();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      startListening();
    } else {
      setIsMuted(true);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { }
      }
      setStatus('paused');
    }
  };

  const handleEndInterview = async () => {
    setIsEnding(true);
    setShowEndModal(false);
    speakCancelledRef.current = true;
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }

    try {
      const res = await fetch('/api/end-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      onEnd(data);
    } catch (err) {
      onEnd({
        assessment: null,
        duration: formatTime(elapsed),
        error: 'Failed to generate assessment. Please try again.',
      });
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const statusConfig = {
    connecting: { text: 'Connecting...', dotClass: 'bg-brand-teal animate-pulse-slow' },
    listening: { text: 'Listening to you...', dotClass: 'bg-emerald-500 animate-pulse-slow' },
    thinking: { text: 'Maya is thinking...', dotClass: 'bg-yellow-500 animate-pulse-fast' },
    speaking: { text: 'Maya is speaking...', dotClass: 'bg-brand-orange animate-pulse-fast' },
    paused: { text: 'Microphone paused', dotClass: 'bg-gray-400' },
  };

  const currentStatus = statusConfig[status] || statusConfig.connecting;

  return (
    <section className="min-h-screen flex flex-col animate-fade-in" style={{ background: '#f7f4ecff' }}>

      <div className="relative z-10 flex flex-col h-screen max-h-[100dvh]">
        {/* Top Bar — warm paper tone */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4"
          style={{ background: '#f8f7f3ff', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(120,110,90,0.15)' }}>
          <div className="flex-1 flex items-center gap-2">
            <CuemathLogo className="w-7 h-7" />
            <span className="text-sm font-semibold hidden md:inline" style={{ color: '#6B6047' }}>Tutor Screening</span>
          </div>
          <div className="flex-none">
            <span className="inline-flex px-3.5 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'rgba(120,110,90,0.10)', border: '1px solid rgba(120,110,90,0.18)', color: '#6B6047' }}>
              Question {Math.min(questionCount, 7)} of 7
            </span>
          </div>
          <div className="flex-1 text-right">
            <span className="text-lg font-semibold tabular-nums" style={{ color: '#5A5040' }}>{formatTime(elapsed)}</span>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

          {/* ── Left: cream paper dot-grid visualizer ── */}
          <div className="flex-1 relative overflow-hidden">

            {/* 1. Cream base */}
            <div className="absolute inset-0" style={{ background: '#f9f6eeff' }} />

            {/* 2. CSS dot-grid pattern */}
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, #eaaa41ff 1.5px, transparent 1.5px)',
              backgroundSize: '32px 32px',
            }} />

            {/* 3. Paper grain/crumple texture overlay using SVG filter */}
            <div className="absolute inset-0 pointer-events-none" style={{ mixBlendMode: 'multiply', opacity: 0.5 }}>
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <filter id="paper-grain">
                  <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch" />
                  <feColorMatrix type="saturate" values="0" />
                  <feBlend in="SourceGraphic" mode="multiply" />
                </filter>
                <rect width="100%" height="100%" filter="url(#paper-grain)" opacity="0.18" fill="#c4b89a" />
              </svg>
            </div>

            {/* 4. Subtle radial vignette so edges are slightly warmer */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 40% 50%, transparent 30%, rgba(180,165,130,0.22) 100%)' }} />

            {/* 5. Floating UI on top */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 md:p-6 pointer-events-none">
              {/* Avatar + Canvas — always centered, never displaced */}
              <div className="relative w-[280px] h-[280px] md:w-[320px] md:h-[320px]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[140px] md:w-[170px] md:h-[170px] rounded-full z-10">
                  <img
                    src="/maya-avatar.png"
                    alt="Maya"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <canvas
                  ref={canvasRef}
                  width="400"
                  height="400"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[320px] md:h-[320px]"
                />
              </div>

              {/* Status — fixed below avatar */}
              <div className="flex items-center gap-2.5 text-lg font-bold mt-5" style={{ color: '#5A4F3A' }}>
                <div className={`w-2.5 h-2.5 rounded-full ${currentStatus.dotClass}`} />
                {currentStatus.text}
              </div>

              {/* Interim transcript — absolute so it never displaces Maya */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4">
                {interimText && (
                  <p className="max-w-[400px] text-center text-sm italic animate-fade-in px-4 py-2 rounded-xl"
                    style={{ color: '#9C8C70', background: 'rgba(244,240,229,0.85)' }}>
                    &ldquo;{interimText}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: conversation panel ── */}
          <div className="w-full md:w-[400px] flex flex-col max-h-[45vh] md:max-h-full"
            style={{ background: '#f8f7f3ff', borderLeft: '1px solid rgba(120,110,90,0.15)' }}>
            <div className="px-5 py-4 flex items-center gap-2"
              style={{ borderBottom: '1px solid rgba(120,110,90,0.15)', background: '#f8f7f3ff' }}>
              <ChatIcon />
              <span className="text-sm font-semibold" style={{ color: '#5A5040' }}>Conversation</span>
            </div>
            <div ref={transcriptRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4" style={{ background: '#f8f7f3ff' }}>
              {messages.map((msg, i) => (
                <div key={i} className="flex flex-col gap-1 animate-msg-in">
                  <span className={`text-[11px] font-semibold uppercase tracking-wider ${msg.role === 'ai' ? 'text-brand-orange' : 'text-brand-teal'}`}>
                    {msg.role === 'ai' ? 'Maya' : 'You'}
                  </span>
                  <p
                    className={`text-[13px] leading-relaxed px-3.5 py-2.5 rounded-xl ${msg.role === 'ai'
                      ? 'bg-orange-50 border border-orange-100 text-stone-700'
                      : 'bg-teal-50 border border-teal-100 text-stone-700'
                      }`}
                    style={msg.role === 'ai' ? { borderLeft: '3px solid #F5A623' } : { borderLeft: '3px solid #1B998B' }}
                  >
                    {msg.content}
                  </p>
                </div>
              ))}
              {status === 'thinking' && (
                <div className="flex flex-col gap-1 animate-msg-in">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-orange">Maya</span>
                  <div className="px-3.5 py-3 rounded-xl bg-orange-50 border border-orange-100 flex items-center gap-1.5" style={{ borderLeft: '3px solid #F5A623' }}>
                    <div className="w-2 h-2 rounded-full bg-brand-orange/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-brand-orange/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-brand-orange/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Controls — match top bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 px-4 md:px-6 py-4"
          style={{ background: '#f8f7f3ff', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(120,110,90,0.15)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              className={`w-[52px] h-[52px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${isMuted ? '' : 'hover:scale-105'
                }`}
              style={isMuted
                ? { background: 'rgba(120,110,90,0.10)', border: '1px solid rgba(120,110,90,0.20)', color: '#8C7A66' }
                : { background: 'linear-gradient(135deg, #F5A623, #E09400)', color: '#fff', boxShadow: '0 4px 20px rgba(245,166,35,0.38)' }
              }
            >
              {isMuted ? <MicOffIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
            </button>
          </div>

          <button
            onClick={() => setShowEndModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium cursor-pointer transition-all duration-300"
            style={{ background: 'rgba(120,110,90,0.08)', border: '1px solid rgba(120,110,90,0.18)', color: '#8C7A66' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,60,60,0.10)'; e.currentTarget.style.borderColor = 'rgba(220,60,60,0.30)'; e.currentTarget.style.color = '#c0392b'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(120,110,90,0.08)'; e.currentTarget.style.borderColor = 'rgba(120,110,90,0.18)'; e.currentTarget.style.color = '#8C7A66'; }}
          >
            <StopIcon /> End Interview
          </button>
        </div>
      </div>

      {/* End Confirmation Modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-[420px] w-full text-center animate-fade-in shadow-xl">
            <h3 className="text-xl font-bold mb-3 text-gray-900">End Interview?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to end the interview? Your responses will be evaluated.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => setShowEndModal(false)}
                className="px-6 py-3 glass rounded-full text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-all"
              >
                Continue Interview
              </button>
              <button
                onClick={handleEndInterview}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-sm font-semibold cursor-pointer hover:translate-y-[-1px] transition-all"
              >
                End & Get Results
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
