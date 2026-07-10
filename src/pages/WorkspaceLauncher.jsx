import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { projectsAPI } from '../api/projects';
import { useNavigate } from 'react-router-dom';

const THREE_D_URL = import.meta.env.VITE_3D_APP_URL || 'http://localhost:3000';

const HOUSE_TYPES = [
  { id: '1bhk', icon: 'home', label: '1 BHK', popular: false },
  { id: '2bhk', icon: 'apartment', label: '2 BHK', popular: true },
  { id: '3bhk', icon: 'domain', label: '3 BHK', popular: false },
  { id: 'villa', icon: 'villa', label: 'Villa', popular: false },
  { id: 'raw', icon: 'foundation', label: 'Raw House', popular: false },
  { id: 'custom', icon: 'edit_square', label: 'Custom', popular: false },
];

export default function WorkspaceLauncher() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('2bhk');
  const [rooms, setRooms] = useState({ bedrooms: 2, bathrooms: 2, kitchen: 1, living: 1 });
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);

  const updateRoom = (key, delta) => {
    setRooms((prev) => ({ ...prev, [key]: Math.max(0, prev[key] + delta) }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    const token = localStorage.getItem('vv_token') || '';
    try {
      const { data } = await projectsAPI.create({
        name: projectName || `New ${HOUSE_TYPES.find((h) => h.id === selected)?.label} Project`,
        houseType: selected,
        rooms,
        status: 'in-progress',
      });
      const projectId = data._id || data.project?._id;
      const params = new URLSearchParams({
        type: selected,
        bedrooms: rooms.bedrooms,
        bathrooms: rooms.bathrooms,
        projectId: projectId || 'new',
        ...(token ? { token } : {}),
      });
      window.open(`${THREE_D_URL}?${params}`, '_blank');
      navigate('/dashboard');
    } catch {
      // Even without backend, still open 3D app
      const params = new URLSearchParams({ type: selected, bedrooms: rooms.bedrooms, bathrooms: rooms.bathrooms });
      window.open(`${THREE_D_URL}?${params}`, '_blank');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      {/* Full page modal overlay style */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100] flex items-center justify-center p-md ml-64">
        <div className="glass-panel max-w-4xl w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
          style={{ maxHeight: '90vh', boxShadow: '0 0 60px rgba(79,70,229,0.2)' }}>

          {/* Left visual panel */}
          <div className="w-full md:w-2/5 relative p-xl flex flex-col justify-end overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1a0f6e 0%, #4f46e5 100%)' }}>
            <div className="absolute inset-0 grid-pattern opacity-20" />
            {/* Floating 3D icon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ animation: 'float 6s ease-in-out infinite' }}>
              <div className="w-32 h-32 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                <span className="material-symbols-outlined text-white" style={{ fontSize: '64px' }}>home</span>
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-4xl font-black text-white font-headline-md mb-sm leading-tight" style={{ letterSpacing: '-0.02em' }}>
                Architecture<br />Reimagined.
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Begin your journey by selecting the foundation of your future home.
              </p>
            </div>
          </div>

          {/* Right: Configuration */}
          <div className="flex-1 p-xl flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-lg">
              <div>
                <h2 className="text-2xl font-black font-headline-md text-on-surface" style={{ letterSpacing: '-0.02em' }}>
                  What type of house?
                </h2>
                <p className="text-on-surface-variant text-sm mt-1">
                  Choose a layout to initialize the 3D workspace
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-2 rounded-full hover:bg-white/5"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Project name */}
            <div className="mb-lg">
              <label className="block text-xs font-label-sm text-on-surface-variant mb-2 uppercase tracking-widest">
                Project Name (optional)
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="input-glass"
                placeholder="e.g. My Dream Villa"
              />
            </div>

            {/* House type grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-md mb-xl">
              {HOUSE_TYPES.map(({ id, icon, label, popular }) => (
                <button
                  key={id}
                  id={`house-type-${id}`}
                  onClick={() => setSelected(id)}
                  className={`group p-md rounded-xl border text-left flex flex-col gap-sm transition-all ${
                    selected === id
                      ? 'border-2 border-primary bg-primary/10 active-glow'
                      : 'border border-white/5 bg-surface-container-high hover:border-primary hover:bg-primary/5'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className={`material-symbols-outlined text-3xl ${selected === id ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'} transition-colors`}>
                      {icon}
                    </span>
                    {popular && (
                      <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Popular</span>
                    )}
                  </div>
                  <div className="text-xs font-label-sm font-bold text-on-surface">{label}</div>
                </button>
              ))}
            </div>

            {/* Room configuration */}
            {selected === 'custom' && (
              <div className="space-y-gutter mb-xl">
                <h3 className="text-xs font-label-sm text-secondary uppercase tracking-widest font-bold">
                  Room Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  {[
                    { key: 'bedrooms', icon: 'bed', label: 'Bedrooms' },
                    { key: 'bathrooms', icon: 'bathtub', label: 'Bathrooms' },
                    { key: 'kitchen', icon: 'countertops', label: 'Kitchen' },
                    { key: 'living', icon: 'weekend', label: 'Living Rooms' },
                  ].map(({ key, icon, label }) => (
                    <div key={key} className="flex items-center justify-between p-sm glass-panel rounded-lg">
                      <div className="flex items-center gap-md">
                        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '20px' }}>{icon}</span>
                        <span className="text-xs font-label-sm text-on-surface">{label}</span>
                      </div>
                      <div className="flex items-center gap-md">
                        <button
                          onClick={() => updateRoom(key, -1)}
                          className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 text-on-surface transition-all"
                        >
                          −
                        </button>
                        <span className="font-bold text-on-surface w-4 text-center">{rooms[key]}</span>
                        <button
                          onClick={() => updateRoom(key, 1)}
                          className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 text-on-surface transition-all"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-auto flex justify-end gap-md">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-ghost px-xl py-3 text-sm"
              >
                Skip for now
              </button>
              <button
                id="generate-workspace-btn"
                onClick={handleGenerate}
                disabled={loading}
                className="btn-secondary px-xl py-3 text-sm flex items-center gap-2 disabled:opacity-50"
                style={{ boxShadow: '0 0 20px rgba(78,222,163,0.3)' }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>rocket_launch</span>
                    Generate Workspace
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
