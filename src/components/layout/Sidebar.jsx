import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', to: '/dashboard' },
  { icon: 'architecture', label: 'Blueprint Analysis', to: '/blueprint' },
  { icon: 'compass_calibration', label: 'Vastu Audit', to: '/vastu' },
  { icon: 'folder_special', label: 'My Library', to: '/library' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest/90 backdrop-blur-2xl border-r border-white/10 shadow-xl z-50">
      {/* Logo */}
      <div className="px-md mb-lg pt-lg">
        <h1 className="text-2xl font-black tracking-tight text-primary font-headline-md">
          VastuVision
        </h1>
        <p className="text-xs font-label-sm text-on-surface-variant opacity-70 mt-0.5 tracking-widest uppercase">
          Architectural AI
        </p>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1 px-sm">
        {navItems.map(({ icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive ? 'nav-active' : 'nav-item'
            }
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span className="text-xs font-label-sm">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto px-sm pt-md">
        <NavLink
          to="/workspace"
          className="block w-full py-3 bg-primary-container text-white font-bold rounded-xl mb-6 text-center text-sm transition-all hover:opacity-90 hover:scale-105 active:scale-95"
          style={{ boxShadow: '0 4px 20px rgba(79,70,229,0.3)' }}
        >
          + New Project
        </NavLink>

        <div className="space-y-1 border-t border-white/5 pt-4">
          <NavLink
            to="/settings"
            className="nav-item"
          >
            <span className="material-symbols-outlined">manage_accounts</span>
            <span className="text-xs font-label-sm">Settings</span>
          </NavLink>

          {/* User info */}
          {user && (
            <div className="flex items-center gap-3 px-4 py-3 mt-2 rounded-lg bg-white/5">
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-on-surface truncate">{user.name}</p>
                <p className="text-[10px] text-on-surface-variant truncate">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="text-on-surface-variant hover:text-error transition-colors flex-shrink-0"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
