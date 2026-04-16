import { useEffect, useState } from 'react';
import GradientOrbs from './GradientOrbs';
import { CuemathLogo, CheckCircleIcon, WarningIcon, DownloadIcon } from './Icons';

const DIMENSION_LABELS = {
  communicationClarity: 'Communication Clarity',
  warmthAndEmpathy: 'Warmth & Empathy',
  abilityToSimplify: 'Ability to Simplify',
  patienceAndAdaptability: 'Patience & Adaptability',
  englishFluency: 'English Fluency',
};

const DIMENSION_ICONS = {
  communicationClarity: '💬',
  warmthAndEmpathy: '💛',
  abilityToSimplify: '🧩',
  patienceAndAdaptability: '🌱',
  englishFluency: '🗣️',
};

function getScoreColor(score) {
  if (score >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-600', ring: '#10B981' };
  if (score >= 60) return { bar: 'bg-brand-orange', text: 'text-brand-orange', ring: '#F5A623' };
  if (score >= 40) return { bar: 'bg-yellow-500', text: 'text-yellow-600', ring: '#F59E0B' };
  return { bar: 'bg-red-500', text: 'text-red-500', ring: '#EF4444' };
}

function getRecommendationConfig(rec) {
  switch (rec) {
    case 'ADVANCE':
      return {
        icon: '🎉',
        title: 'Advance to Next Round',
        subtitle: 'This candidate demonstrates strong tutoring potential',
        className: 'border-emerald-200',
        iconBg: 'bg-emerald-50',
        textColor: 'text-emerald-600',
      };
    case 'REVIEW':
      return {
        icon: '🔍',
        title: 'Review Recommended',
        subtitle: 'This candidate shows promise but may need additional evaluation',
        className: 'border-yellow-200',
        iconBg: 'bg-yellow-50',
        textColor: 'text-yellow-600',
      };
    default:
      return {
        icon: '⏸️',
        title: 'Not Recommended',
        subtitle: 'This candidate may not be the right fit at this time',
        className: 'border-red-200',
        iconBg: 'bg-red-50',
        textColor: 'text-red-500',
      };
  }
}

export default function ReportPhase({ report, duration }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!report) return;

    // Show content after loading animation
    const timer = setTimeout(() => setShowContent(true), 2000);
    return () => clearTimeout(timer);
  }, [report]);

  useEffect(() => {
    if (!showContent || !report) return;

    // Animate score
    const target = report.overallScore;
    let current = 0;
    const step = Math.max(1, Math.floor(target / 60));
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setAnimatedScore(current);
    }, 20);
    return () => clearInterval(interval);
  }, [showContent, report]);

  if (!report) {
    return (
      <section className="min-h-screen flex flex-col animate-fade-in">
        <GradientOrbs />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center gap-6 px-5">
          <div className="relative w-[120px] h-[120px]">
            <div className="absolute inset-0 border-[3px] border-transparent border-t-brand-orange rounded-full animate-spin-slow" />
            <div className="absolute inset-3 border-[3px] border-transparent border-t-brand-teal rounded-full animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
            <div className="absolute inset-6 border-[3px] border-transparent border-t-brand-orange-light rounded-full animate-spin-slow" style={{ animationDuration: '2.5s' }} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Analyzing Your Interview</h2>
          <p className="text-gray-500">Maya is reviewing your responses and preparing a detailed assessment...</p>
        </div>
      </section>
    );
  }

  if (!showContent) {
    return (
      <section className="min-h-screen flex flex-col animate-fade-in">
        <GradientOrbs />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center gap-6 px-5">
          <div className="relative w-[120px] h-[120px]">
            <div className="absolute inset-0 border-[3px] border-transparent border-t-brand-orange rounded-full animate-spin-slow" />
            <div className="absolute inset-3 border-[3px] border-transparent border-t-brand-teal rounded-full animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
            <div className="absolute inset-6 border-[3px] border-transparent border-t-brand-orange-light rounded-full animate-spin-slow" style={{ animationDuration: '2.5s' }} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Analyzing Your Interview</h2>
          <p className="text-gray-500">Almost done...</p>
        </div>
      </section>
    );
  }

  const scoreColor = getScoreColor(report.overallScore);
  const recConfig = getRecommendationConfig(report.recommendation);
  const circumference = 2 * Math.PI * 70; // r=70
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <section className="min-h-screen flex flex-col animate-fade-in">
      <GradientOrbs />

      <div className="relative z-10 max-w-[900px] mx-auto px-5 py-8 pb-16 w-full">
        {/* Header */}
        <div className="text-center mb-9">
          <CuemathLogo className="w-8 h-8 mx-auto" />
          <h1 className="text-2xl md:text-3xl font-extrabold mt-4 text-gray-900">Interview Assessment</h1>
          <p className="text-gray-500 text-sm mt-2">Duration: {duration} • {new Date().toLocaleDateString()}</p>
        </div>

        {/* Overall Score + Recommendation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-9">
          {/* Score Circle */}
          <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center gap-3">
            <div className="relative w-[160px] h-[160px]">
              <svg className="w-full h-full" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="10" />
                <circle
                  cx="80" cy="80" r="70" fill="none"
                  stroke={scoreColor.ring}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  transform="rotate(-90 80 80)"
                  className="score-ring-progress"
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-baseline gap-0.5">
                <span className="text-5xl font-extrabold leading-none text-gray-900">{animatedScore}</span>
                <span className="text-base text-gray-400 font-medium">/100</span>
              </div>
            </div>
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Overall Score</span>
          </div>

          {/* Recommendation */}
          <div className={`glass rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center ${recConfig.className}`}>
            <div className={`w-16 h-16 rounded-full ${recConfig.iconBg} flex items-center justify-center text-3xl`}>
              {recConfig.icon}
            </div>
            <span className={`text-lg font-bold ${recConfig.textColor}`}>{recConfig.title}</span>
            <span className="text-xs text-gray-500">{recConfig.subtitle}</span>
          </div>
        </div>

        {/* Skill Breakdown */}
        <div className="mb-9">
          <h2 className="text-xl font-bold mb-5 text-gray-900">Skill Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(report.dimensions || {}).map(([key, dim], i) => {
              const color = getScoreColor(dim.score);
              return (
                <div key={key} className="glass rounded-2xl p-5 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold flex items-center gap-2 text-gray-800">
                      <span>{DIMENSION_ICONS[key]}</span>
                      {DIMENSION_LABELS[key] || key}
                    </span>
                    <span className={`text-lg font-bold ${color.text}`}>{dim.score}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full ${color.bar} transition-all duration-1000`}
                      style={{ width: `${dim.score}%`, transitionDelay: `${i * 100 + 500}ms` }}
                    />
                  </div>
                  {dim.notes && (
                    <p className="text-xs text-gray-500 leading-relaxed mb-2">{dim.notes}</p>
                  )}
                  {dim.evidence?.length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-2">
                      {dim.evidence.slice(0, 2).map((quote, qi) => (
                        <blockquote
                          key={qi}
                          className="text-xs text-gray-500 italic pl-3 py-2 border-l-2 border-brand-orange bg-orange-50/50 rounded-r-md leading-relaxed"
                        >
                          "{quote}"
                        </blockquote>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="glass rounded-2xl p-6">
            <h3 className="text-[15px] font-semibold mb-4 flex items-center gap-2 text-gray-800">
              <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
              Strengths
            </h3>
            <ul className="flex flex-col gap-2.5">
              {(report.strengths || []).map((s, i) => (
                <li key={i} className="text-sm text-gray-600 leading-relaxed pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-emerald-500 before:font-bold">
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-2xl p-6">
            <h3 className="text-[15px] font-semibold mb-4 flex items-center gap-2 text-gray-800">
              <WarningIcon className="w-5 h-5 text-yellow-500" />
              Areas for Growth
            </h3>
            <ul className="flex flex-col gap-2.5">
              {(report.areasForImprovement || []).map((a, i) => (
                <li key={i} className="text-sm text-gray-600 leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-yellow-500 before:font-bold">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Summary */}
        <div className="glass rounded-2xl p-6 mb-8">
          <h3 className="text-[15px] font-semibold mb-3 text-gray-800">Summary</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{report.summary}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-6 py-3 glass rounded-full text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-all"
          >
            <DownloadIcon /> Download Report
          </button>
          <button
            onClick={() => location.reload()}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-orange to-brand-orange-dark text-white rounded-full text-sm font-semibold cursor-pointer glow-orange-sm hover:translate-y-[-2px] transition-all"
          >
            Start New Interview
          </button>
        </div>
      </div>
    </section>
  );
}
