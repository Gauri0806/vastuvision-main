import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/auth';

const DEFAULT_PREFS = {
  vastuOverlay: true,
  aiSuggestions: true,
  emailNotifications: false,
  autoSave: true,
};

export default function AccountSettings() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await authAPI.updateProfile(form);
      updateUser(data.user || { ...user, ...form });
      showMsg('success', 'Profile updated successfully!');
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) {
      showMsg('error', 'New passwords do not match.');
      return;
    }
    if (pwForm.newPw.length < 6) {
      showMsg('error', 'Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.newPw });
      showMsg('success', 'Password changed successfully!');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const togglePref = (key) => setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));

  const prefItems = [
    { key: 'vastuOverlay', label: 'Enable Vastu overlay by default' },
    { key: 'aiSuggestions', label: 'Show AI suggestions automatically' },
    { key: 'emailNotifications', label: 'Email notifications for project updates' },
    { key: 'autoSave', label: 'Auto-save 3D workspace changes' },
  ];

  const tabs = [
    { key: 'profile', icon: 'person', label: 'Profile' },
    { key: 'password', icon: 'lock', label: 'Password' },
    { key: 'preferences', icon: 'tune', label: 'Preferences' },
  ];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-lg page-enter">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-black font-headline-md text-on-surface" style={{ letterSpacing: '-0.02em' }}>
            Account Settings
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">Manage your profile and preferences</p>
        </div>

        {/* User Summary Card */}
        <div className="glass-panel p-md rounded-2xl flex items-center gap-6">
          <div
            className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center text-3xl font-black text-white flex-shrink-0"
            style={{ boxShadow: '0 0 20px rgba(79,70,229,0.3)' }}
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-on-surface">{user?.name || 'User'}</h3>
            <p className="text-on-surface-variant text-sm">{user?.email}</p>
            <div className="flex gap-2 mt-2">
              <span className="px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-full text-xs font-label-sm text-secondary">
                Pro User
              </span>
              <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-label-sm text-primary">
                Verified
              </span>
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`p-4 rounded-xl text-sm transition-all ${
              message.type === 'success'
                ? 'bg-secondary/10 border border-secondary/30 text-secondary'
                : 'bg-error/10 border border-error/30 text-error'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface-container rounded-xl border border-white/5">
          {tabs.map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all ${
                activeTab === key
                  ? 'bg-primary-container text-white font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="glass-panel p-lg rounded-2xl space-y-lg">
            <h3 className="text-lg font-bold text-on-surface">Personal Information</h3>
            <form onSubmit={handleProfileSave} className="space-y-md">
              <div>
                <label className="block text-xs font-label-sm text-on-surface-variant mb-2 uppercase tracking-widest">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>person</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-glass pl-11"
                    placeholder="Your full name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-label-sm text-on-surface-variant mb-2 uppercase tracking-widest">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>mail</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-glass pl-11"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-sm py-3 px-8 flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="glass-panel p-lg rounded-2xl space-y-lg">
            <h3 className="text-lg font-bold text-on-surface">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-md">
              {[
                { label: 'Current Password', key: 'current', val: pwForm.current },
                { label: 'New Password', key: 'newPw', val: pwForm.newPw },
                { label: 'Confirm New Password', key: 'confirm', val: pwForm.confirm },
              ].map(({ label, key, val }) => (
                <div key={key}>
                  <label className="block text-xs font-label-sm text-on-surface-variant mb-2 uppercase tracking-widest">
                    {label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>lock</span>
                    <input
                      type="password"
                      value={val}
                      onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                      className="input-glass pl-11"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-sm py-3 px-8 flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="glass-panel p-lg rounded-2xl space-y-lg">
            <h3 className="text-lg font-bold text-on-surface">Design Preferences</h3>
            <div className="space-y-4">
              {prefItems.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                  onClick={() => togglePref(key)}
                >
                  <span className="text-sm text-on-surface">{label}</span>
                  <button
                    className={`w-12 h-6 rounded-full relative border transition-all flex-shrink-0 ${
                      prefs[key] ? 'bg-primary/30 border-primary/50' : 'bg-white/10 border-white/10'
                    }`}
                    onClick={(e) => { e.stopPropagation(); togglePref(key); }}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                        prefs[key] ? 'right-1 bg-primary' : 'left-1 bg-outline'
                      }`}
                      style={prefs[key] ? { boxShadow: '0 0 8px rgba(79,70,229,0.8)' } : {}}
                    />
                  </button>
                </div>
              ))}
            </div>
            <div className="pt-4 flex justify-end">
              <button
                onClick={() => showMsg('success', 'Preferences saved!')}
                className="btn-primary text-sm py-3 px-8"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
