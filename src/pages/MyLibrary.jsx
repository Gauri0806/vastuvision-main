import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { projectsAPI } from '../api/projects';

const STATUS_COLORS = {
  draft:       'text-gray-400  bg-gray-400/10  border-gray-400/20',
  'in-progress': 'text-blue-400  bg-blue-400/10  border-blue-400/20',
  analyzed:    'text-purple-400 bg-purple-400/10 border-purple-400/20',
  completed:   'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
};

const STATUS_ICONS = {
  draft: 'draft', 'in-progress': 'pending', analyzed: 'analytics', completed: 'task_alt',
};

export default function MyLibrary() {
  const navigate = useNavigate();
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [deleting,  setDeleting]  = useState(null);
  const [filter,    setFilter]    = useState('all');
  const [search,    setSearch]    = useState('');
  const [creating,  setCreating]  = useState(false);
  const [newName,   setNewName]   = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data } = await projectsAPI.getAll({ limit: 50 });
      setProjects(data?.projects || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await projectsAPI.delete(id);
      setProjects(p => p.filter(proj => proj._id !== id));
    } catch (err) {
      alert('Failed to delete project. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { data } = await projectsAPI.create({ name: newName.trim() });
      setProjects(p => [data.project, ...p]);
      setNewName('');
      setShowCreate(false);
    } catch (err) {
      alert('Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  const filtered = projects.filter(p => {
    const matchFilter = filter === 'all' || p.status === filter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <AppLayout>
      <div className="space-y-lg page-enter">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-black font-headline-md text-on-surface" style={{ letterSpacing: '-0.02em' }}>
              My Library
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              {projects.length} project{projects.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 0 20px rgba(79,70,229,0.3)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            New Project
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="glass-card rounded-2xl p-8 w-full max-w-md border border-white/10">
              <h3 className="text-xl font-bold mb-4">New Project</h3>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="e.g. 2BHK Apartment Plan"
                className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 mb-4" autoFocus />
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)} className="flex-1 btn-ghost py-2.5 rounded-xl text-sm">Cancel</button>
                <button onClick={handleCreate} disabled={creating || !newName.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search + Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-surface-container-low border border-white/10 rounded-xl px-3 py-2 flex-1 min-w-48">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>search</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search projects..." className="bg-transparent text-sm outline-none flex-1 text-on-surface" />
          </div>
          <div className="flex gap-2">
            {['all', 'draft', 'in-progress', 'analyzed', 'completed'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filter === f ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-white/10'}`}>
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Projects grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-30">folder_open</span>
            <p className="text-on-surface-variant">
              {search ? 'No projects match your search' : 'No projects yet. Create your first one!'}
            </p>
            {!search && (
              <button onClick={() => setShowCreate(true)}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
            {filtered.map(project => (
              <div key={project._id}
                className="glass-card rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all group flex flex-col">
                {/* Thumbnail / placeholder */}
                <div className="h-36 relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg,#1e1b4b,#0f172a)' }}>
                  {project.thumbnail
                    ? <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                    : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary/30" style={{ fontSize: '64px' }}>
                          {project.houseType ? 'home' : 'architecture'}
                        </span>
                      </div>
                    )}
                  {/* Status badge */}
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${STATUS_COLORS[project.status]}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>{STATUS_ICONS[project.status]}</span>
                    {project.status}
                  </div>
                  {/* Vastu score badge */}
                  {project.vastuData?.score != null && (
                    <div className="absolute bottom-3 left-3 px-2 py-1 rounded-full text-[10px] font-bold bg-black/60 border border-white/20 text-white flex items-center gap-1">
                      <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>temple_hindu</span>
                      Vastu {project.vastuData.score}/100
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <h3 className="font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
                    {project.houseType && (
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 uppercase">{project.houseType}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>schedule</span>
                      {timeAgo(project.updatedAt)}
                    </span>
                  </div>
                  {project.rooms?.length > 0 && (
                    <p className="text-[10px] text-on-surface-variant">{project.rooms.length} rooms labeled</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto pt-2">
                    <button onClick={() => navigate(`/vastu?project=${project._id}`)}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-bold border border-primary/30 text-primary hover:bg-primary/10 transition-all flex items-center justify-center gap-1">
                      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>analytics</span>
                      Vastu
                    </button>
                    <button onClick={() => {
                        const token = localStorage.getItem('vv_token') || '';
                        const params = new URLSearchParams({ projectId: project._id, ...(token ? { token } : {}) });
                        window.open(`http://localhost:3000/?${params}`, '_blank');
                      }}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-bold border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-all flex items-center justify-center gap-1">
                      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>view_in_ar</span>
                      3D
                    </button>
                    <button onClick={() => handleDelete(project._id, project.name)}
                      disabled={deleting === project._id}
                      className="py-1.5 px-2 rounded-lg text-[11px] border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        {deleting === project._id ? 'hourglass_empty' : 'delete'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
