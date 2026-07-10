export default function VastuScoreRing({ score = 85, size = 96 }) {
  const radius = size * 0.42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  const getColor = () => {
    if (score >= 80) return '#4edea3';
    if (score >= 60) return '#c3c0ff';
    return '#ffb4ab';
  };
  const color = getColor();

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={cx} cy={cy} r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={size * 0.08}
        />
        <circle
          cx={cx} cy={cy} r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={size * 0.09}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-black text-on-surface" style={{ fontSize: size * 0.25, lineHeight: 1 }}>
          {score}
        </span>
        <span className="text-on-surface-variant font-label-sm" style={{ fontSize: size * 0.11 }}>/ 100</span>
      </div>
    </div>
  );
}
