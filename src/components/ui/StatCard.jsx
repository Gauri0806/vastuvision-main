export default function StatCard({ icon, label, value, color = 'primary' }) {
  const colorMap = {
    primary: 'text-primary bg-primary/10',
    secondary: 'text-secondary bg-secondary/10',
    tertiary: 'text-tertiary bg-tertiary/10',
    error: 'text-error bg-error/10',
  };
  const cls = colorMap[color] || colorMap.primary;

  return (
    <div className="glass-panel p-md rounded-xl flex items-center gap-4 hover:border-white/20 transition-all duration-300 group">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${cls} group-hover:scale-110 transition-transform`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="text-xs font-label-sm text-on-surface-variant">{label}</p>
        <p className="text-2xl font-black text-on-surface font-headline-md">{value}</p>
      </div>
    </div>
  );
}
