import { useState, useEffect } from 'react';
import GradientOrbs from './GradientOrbs';
import { CuemathLogo, MicIcon } from './Icons';

/* ── Maya illustration avatar (girl with headphones) ── */
function MayaIllustration() {
  return (
    <img
      src="/maya-avatar.png"
      alt="Maya — your friendly AI interviewer"
      className="w-[120px] h-[120px] rounded-full object-cover"
    />
  );
}

/* ── Step Icon (circle with icon inside) ── */
function StepIcon({ type, active }) {
  const base = "w-10 h-10 rounded-full flex items-center justify-center shrink-0";
  if (type === 'mic') {
    return (
      <div className={`${base} bg-brand-orange`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </div>
    );
  }
  if (type === 'question') {
    return (
      <div className={`${base} border-2 border-gray-300 bg-white`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9 9a3 3 0 1 1 3.5 2.96C12 12.5 12 13.5 12 14" />
          <circle cx="12" cy="18" r="0.5" fill="#999" />
        </svg>
      </div>
    );
  }
  // checkmark
  return (
    <div className={`${base} border-2 border-gray-300 bg-white`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}

/* ── Decorative math operator doodle ── */
function MathDoodle({ symbol, className, size = 36 }) {
  const s = size;
  const half = s / 2;
  const pad = s * 0.2;

  const paths = {
    plus: `M${half} ${pad}V${s - pad}M${pad} ${half}H${s - pad}`,
    minus: `M${pad} ${half}H${s - pad}`,
    times: `M${pad} ${pad}L${s - pad} ${s - pad}M${s - pad} ${pad}L${pad} ${s - pad}`,
    divide: `M${pad} ${half}H${s - pad}`,
    percent: `M${s - pad} ${pad}L${pad} ${s - pad}`,
    equals: `M${pad} ${half - 4}H${s - pad}M${pad} ${half + 4}H${s - pad}`,
    pi: `M${pad} ${pad + 4}H${s - pad}M${half - 5} ${pad + 4}V${s - pad}M${half + 5} ${pad + 4}V${s - pad}`,
    sqrt: `M${pad} ${half + 2}L${half - 4} ${s - pad}L${half + 2} ${pad}H${s - pad}`,
    triangle: `M${half} ${pad}L${s - pad} ${s - pad}H${pad}Z`,
    square: `M${pad} ${pad}H${s - pad}V${s - pad}H${pad}Z`,
    circle: `M${half} ${pad}A${half - pad} ${half - pad} 0 1 1 ${half - 0.01} ${pad}`,
  };

  return (
    <div className={`absolute pointer-events-none select-none ${className}`}>
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
        <path d={paths[symbol] || paths.plus} stroke="#F5A623" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
        {/* Divide dots */}
        {symbol === 'divide' && (
          <>
            <circle cx={half} cy={half - 8} r="2.5" fill="#F5A623" opacity="0.55" />
            <circle cx={half} cy={half + 8} r="2.5" fill="#F5A623" opacity="0.55" />
          </>
        )}
        {/* Percent dots */}
        {symbol === 'percent' && (
          <>
            <circle cx={pad + 3} cy={pad + 3} r="3" fill="#F5A623" opacity="0.55" />
            <circle cx={s - pad - 3} cy={s - pad - 3} r="3" fill="#F5A623" opacity="0.55" />
          </>
        )}
      </svg>
    </div>
  );
}

export default function LandingPhase({ onStart }) {
  const [checks, setChecks] = useState({
    browser: 'loading',
    mic: 'loading',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setChecks(c => ({ ...c, browser: SpeechRecognition ? 'checked' : 'failed' }));

    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(t => t.stop());
        setChecks(c => ({ ...c, mic: 'checked' }));
      })
      .catch(() => setChecks(c => ({ ...c, mic: 'failed' })));
  }, []);

  const allPassed = checks.browser === 'checked' && checks.mic === 'checked';

  const handleBegin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/start-session', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start session');
      const data = await res.json();
      onStart(data.sessionId, data.greeting);
    } catch (err) {
      setError('Could not connect to the server. Please make sure the backend is running.');
      setLoading(false);
    }
  };

  /* Status pill badge (green dot + label) */
  const StatusBadge = ({ status, label }) => {
    const dotColor = status === 'checked' ? 'bg-emerald-500' : status === 'failed' ? 'bg-red-400' : 'border-2 border-gray-300 border-t-brand-orange animate-spin';
    return (
      <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-sm border border-gray-100 text-xs font-medium text-ink-700">
        {status === 'checked' ? (
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        ) : (
          <div className={`w-3 h-3 rounded-full ${dotColor}`} />
        )}
        {label}
      </div>
    );
  };

  return (
    <section className="min-h-screen flex flex-col animate-fade-in">
      <GradientOrbs />

      {/* Decorative math operator and geometric doodles */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <MathDoodle symbol="plus" className="top-[15%] left-[3%] rotate-12" size={38} />
        <MathDoodle symbol="circle" className="top-[25%] left-[8%] rotate-45" size={24} />
        <MathDoodle symbol="times" className="top-[40%] left-[4%] -rotate-6" size={28} />
        <MathDoodle symbol="square" className="bottom-[35%] left-[2%] rotate-12" size={30} />
        <MathDoodle symbol="divide" className="bottom-[15%] left-[5%] rotate-6" size={34} />
        
        <MathDoodle symbol="percent" className="bottom-[25%] right-[7%] -rotate-12" size={32} />
        <MathDoodle symbol="triangle" className="bottom-[10%] right-[3%] rotate-12" size={26} />
        <MathDoodle symbol="pi" className="top-[12%] right-[5%] rotate-6" size={36} />
        <MathDoodle symbol="circle" className="top-[30%] right-[8%] -rotate-12" size={20} />
        <MathDoodle symbol="sqrt" className="top-[45%] right-[3%] -rotate-3" size={40} />
      </div>

      <div className="relative z-10 w-full min-h-screen flex flex-col">

        {/* ── Navbar ── */}
        <nav className="w-full px-6 md:px-10 py-5 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CuemathLogo />
            <span className="text-lg font-bold tracking-tight text-ink-800">cuemath</span>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={checks.browser} label="Browser" />
            <StatusBadge status={checks.mic} label="Microphone" />
          </div>
        </nav>

        {/* ── Hero Section ── */}
        <div className="flex-1 flex items-center justify-center px-6 md:px-10 pb-8">
          <div className="max-w-[960px] w-full mx-auto">

            <div className="grid grid-cols-1 md:grid-cols-[1fr,380px] gap-10 md:gap-16 items-center">

              {/* Left — Copy */}
              <div className="order-2 md:order-1 text-center md:text-left">
                <div className="animate-fade-in-up">
                  <h1 className="text-[2.5rem] md:text-[3.25rem] leading-[1.1] font-extrabold text-ink-900 mb-5 tracking-tight">
                    Hi there! Let's have
                    <br />
                    a quick chat.
                  </h1>
                </div>

                <div className="animate-fade-in-up-delayed">
                  <p className="text-lg md:text-[18px] text-ink-700 leading-relaxed max-w-[450px] font-medium mx-auto md:mx-0 mb-8">
                    A friendly 10-minute voice conversation with Maya, our
                    AI interviewer. She'll learn about your teaching style —
                    no trick questions, no stress.
                  </p>
                </div>

                {/* Steps — horizontal icon stepper with connecting lines */}
                <div className="animate-fade-in-up-delayed-2">
                  <div className="flex items-start gap-0 mb-9 justify-center md:justify-start">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center">
                      <StepIcon type="mic" />
                      <p className="text-md font-bold text-ink-800 mt-2.5">1. Voice Chat</p>
                      <p className="text-xs text-ink-700">approx. 10 min voice call</p>
                    </div>
                    {/* Connecting line */}
                    <div className="w-12 md:w-16 h-px bg-brand-orange/40 mt-5 shrink-0" />
                    {/* Step 2 */}
                    <div className="flex flex-col items-center">
                      <StepIcon type="question" />
                      <p className="text-md font-bold text-ink-800 mt-2.5">2. Q&A</p>
                      <p className="text-xs text-ink-700">About your teaching</p>
                    </div>
                    {/* Connecting line */}
                    <div className="w-12 md:w-16 h-px bg-gray-300 mt-5 shrink-0" />
                    {/* Step 3 */}
                    <div className="flex flex-col items-center">
                      <StepIcon type="check" />
                      <p className="text-md font-bold text-ink-800 mt-2.5">3. Results</p>
                      <p className="text-xs text-ink-700">Instant Feedback</p>
                    </div>
                  </div>
                </div>

                {/* CTA + Status */}
                <div className="animate-fade-in-up-delayed-3">
                  <div className="flex flex-row items-center gap-4 flex-wrap">
                    <button
                      id="btn-begin"
                      onClick={handleBegin}
                      disabled={!allPassed || loading}
                      className="group inline-flex items-center justify-center gap-2.5 px-10 py-4 bg-brand-orange text-white rounded-full font-semibold text-[15px] cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 w-full md:w-auto min-w-[280px]"
                      style={{ boxShadow: '0 4px 20px rgba(245,166,35,0.35)' }}
                    >
                      {loading ? (
                        <>
                          <div className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Getting ready...
                        </>
                      ) : (
                        <>
                          <div className="w-9 h-7 rounded-full bg-white/25 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                            <MicIcon className="w-4 h-4 text-white" />
                          </div>
                          Start Conversation
                        </>
                      )}
                    </button>

                    <span className="text-xs text-ink-700">
                      Takes about 10 minutes
                    </span>
                  </div>

                  {error && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm text-left max-w-[440px]">
                      {error}
                    </div>
                  )}

                  {/* Mobile status checks */}
                  <div className="md:hidden flex items-center justify-center gap-4 mt-5">
                    <StatusBadge status={checks.browser} label="Browser" />
                    <StatusBadge status={checks.mic} label="Microphone" />
                  </div>
                </div>
              </div>

              {/* Right — Maya Card */}
              <div className="order-1 md:order-2 flex justify-center animate-fade-in-up">
                <div className="bg-white rounded-3xl border-2 border-brand-orange/60 p-8 md:p-10 w-full max-w-[360px] flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                  style={{ boxShadow: '0 2px 14px rgba(181, 151, 103, 0.35)' }}
                >
                  <div className="mb-5">
                    <MayaIllustration />
                  </div>

                  <h2 className="text-md font-bold text-ink-900 mb-2">
                    Meet Maya
                  </h2>
                  <p className="text-sm font-medium text-ink-700 leading-relaxed mb-6">
                    Your friendly AI interviewer. She'll ask about your experience and how you'd approach teaching math to kids.
                  </p>

                  {/* What Maya looks for */}
                  <div className="w-full font-medium space-y-2.5">
                    {[
                      { emoji: '💬', label: 'Communication skills' },
                      { emoji: '🧩', label: 'Ability to simplify concepts' },
                      { emoji: '💛', label: 'Warmth & patience' },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-warm-100/60 text-left transition-all duration-200 hover:bg-warm-200/60"
                      >
                        <span className="text-base">{item.emoji}</span>
                        <span className="text-sm font-medium text-ink-700">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 md:px-10 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-xs text-ink-400">
            <a href="#" className="hover:text-ink-600 text-ink-700 transition-colors">Privacy Policy</a>
            <span className="text-ink-700">|</span>
            <a href="#" className="hover:text-ink-600 text-ink-700 transition-colors">Terms of Service</a>
          </div>
          <p className="text-[11px] text-ink-700 text-right leading-relaxed">
            Cuemath is a math learning platform for students.
            <br />
            © 2026 Cuemath. All rights reserved.
          </p>
        </div>

      </div>
    </section>
  );
}
