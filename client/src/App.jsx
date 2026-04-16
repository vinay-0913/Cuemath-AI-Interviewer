import { useState } from 'react';
import LandingPhase from './components/LandingPhase';
import InterviewPhase from './components/InterviewPhase';
import ReportPhase from './components/ReportPhase';

export default function App() {
  const [phase, setPhase] = useState('landing'); // landing | interview | report
  const [sessionId, setSessionId] = useState(null);
  const [greeting, setGreeting] = useState('');
  const [report, setReport] = useState(null);
  const [duration, setDuration] = useState('');

  const handleStartInterview = (sid, greetingText) => {
    setSessionId(sid);
    setGreeting(greetingText);
    setPhase('interview');
  };

  const handleEndInterview = (assessmentData) => {
    setReport(assessmentData.assessment);
    setDuration(assessmentData.duration);
    setPhase('report');
  };

  return (
    <div className="relative min-h-screen">
      {phase === 'landing' && <LandingPhase onStart={handleStartInterview} />}
      {phase === 'interview' && (
        <InterviewPhase sessionId={sessionId} greeting={greeting} onEnd={handleEndInterview} />
      )}
      {phase === 'report' && <ReportPhase report={report} duration={duration} />}
    </div>
  );
}
