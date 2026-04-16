// Warm, organic background shapes — light theme
export default function GradientOrbs() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Top-right warm orange glow */}
      <div
        className="orb w-[600px] h-[600px] -top-[15%] -right-[10%] animate-float"
        style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.08), transparent 65%)' }}
      />
      {/* Bottom-left teal glow */}
      <div
        className="orb w-[500px] h-[500px] -bottom-[15%] -left-[8%] animate-float-delayed"
        style={{ background: 'radial-gradient(circle, rgba(27,153,139,0.05), transparent 65%)' }}
      />
      {/* Center pale amber wash */}
      <div
        className="orb w-[800px] h-[400px] top-[20%] left-[10%]"
        style={{ background: 'radial-gradient(ellipse, rgba(245,166,35,0.04), transparent 70%)' }}
      />
    </div>
  );
}
