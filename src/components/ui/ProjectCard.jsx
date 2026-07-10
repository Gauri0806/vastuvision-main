import { useNavigate } from 'react-router-dom';

export default function ProjectCard({ project }) {
  const navigate = useNavigate();
  const { _id, name, status, updatedAt, thumbnailUrl, tags = [] } = project || {};

  const statusConfig = {
    'in-progress': { label: 'In Progress', cls: 'badge-progress' },
    analyzed: { label: 'Analyzed', cls: 'badge-analyzed' },
    completed: { label: 'Completed', cls: 'badge-complete' },
  };
  const st = statusConfig[status] || statusConfig['in-progress'];

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    const w = Math.floor(d / 7);
    if (h < 24) return `${h}h ago`;
    if (d < 7) return `${d}d ago`;
    return `${w}w ago`;
  };

  return (
    <div
      className="glass-panel rounded-2xl overflow-hidden group hover:border-primary/50 transition-all duration-300 cursor-pointer"
      onClick={() => navigate(`/workspace?project=${_id}`)}
    >
      {/* Thumbnail */}
      <div className="h-44 overflow-hidden relative bg-surface-container-high">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-container/20 to-secondary/10">
            <span className="material-symbols-outlined text-primary/40" style={{ fontSize: '64px' }}>home</span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/60 to-transparent" />
        {/* Status badge */}
        <div className={`absolute top-3 right-3 ${st.cls}`}>{st.label}</div>
        {/* Tags */}
        {tags.length > 0 && (
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-primary/20 border border-primary/30 rounded-full text-[10px] text-primary font-bold uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-md space-y-2">
        <h4 className="text-sm font-bold text-on-surface truncate">{name || 'Untitled Project'}</h4>
        <div className="flex justify-between items-center text-on-surface-variant">
          <span className="text-xs font-label-sm">Modified {timeAgo(updatedAt)}</span>
          <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full border border-surface bg-primary-container flex items-center justify-center text-[10px] text-white font-bold">3D</div>
            <div className="w-6 h-6 rounded-full border border-surface bg-secondary text-on-secondary flex items-center justify-center text-[10px] font-bold">V</div>
          </div>
        </div>
      </div>
    </div>
  );
}
