import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/blueprint': 'Blueprint Analysis',
  '/vastu': 'Vastu Audit',
  '/library': 'My Library',
  '/workspace': '3D Workspace',
  '/settings': 'Settings',
};

export default function TopNav() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');

  const title = pageTitles[location.pathname] || 'VastuVision';

  return (
    <header className="flex justify-between items-center w-full px-md h-16 bg-surface/80 backdrop-blur-xl sticky top-0 border-b border-white/10 z-40"
      style={{ boxShadow: '0 0 20px rgba(79,70,229,0.1)' }}>
      {/* Left: Search */}
      <div className="flex items-center gap-sm bg-surface-container/50 px-4 py-2 rounded-full border border-white/5 w-72">
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>search</span>
        <input
          className="bg-transparent border-none outline-none text-xs text-on-surface placeholder:text-on-surface-variant/50 w-full"
          placeholder="Search projects or tools..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
        />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <button
          className="p-2 hover:bg-surface-variant/50 transition-colors rounded-full relative text-on-surface-variant"
          title="Notifications"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full" />
        </button>

        <button
          className="p-2 hover:bg-surface-variant/50 transition-colors rounded-full text-on-surface-variant"
          title="Settings"
          onClick={() => navigate('/settings')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>settings</span>
        </button>

        <button
          onClick={() => navigate('/settings')}
          className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary/30 bg-primary-container flex items-center justify-center text-white font-bold text-sm hover:border-primary/60 transition-all"
        >
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </button>
      </div>
    </header>
  );
}
