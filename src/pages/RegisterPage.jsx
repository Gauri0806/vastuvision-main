import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // After register sets isAuthenticated, this effect navigates
  useEffect(() => {
    if (success && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [success, isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      // Mark success — the useEffect above will navigate once isAuthenticated flips
      setSuccess(true);
      // Also navigate directly as a fallback (belt + suspenders)
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message;
      if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Cannot connect to server. Make sure the backend is running on port 5000.');
      } else {
        setError(msg || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: '#0b1326' }}>

      {/* Atmospheric orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(78,222,163,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <div className="w-full max-w-4xl glass-panel rounded-2xl overflow-hidden shadow-2xl flex relative z-10"
        style={{ boxShadow: '0 0 60px rgba(78,222,163,0.1)' }}>

        {/* ── Left decorative panel ── */}
        <div className="hidden md:flex w-2/5 flex-col justify-between p-10 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #003824 0%, #00a572 100%)' }}>
          <div className="absolute inset-0 grid-pattern opacity-20" />

          {/* Logo */}
          <div className="relative z-10">
            <h1 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
              VastuVision
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 }}>Architectural AI Platform</p>
          </div>

          {/* Feature list */}
          <div className="relative z-10 space-y-4">
            {[
              'AI Blueprint Analysis',
              'Vastu Compliance Engine',
              '3D Interior Designer',
              'Smart Furniture Suggestions',
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12, color: 'white' }}>check</span>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>{feat}</span>
              </div>
            ))}
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 16 }}>
              Join thousands of designers and architects.
            </p>
          </div>
        </div>

        {/* ── Right: form ── */}
        <div className="flex-1 p-10 flex flex-col justify-center">
          <div style={{ marginBottom: 28 }}>
            <h2 className="font-black text-on-surface"
              style={{ fontSize: 28, letterSpacing: '-0.02em', fontFamily: 'Hanken Grotesk, sans-serif', marginBottom: 6 }}>
              Create Your Account
            </h2>
            <p style={{ color: '#c7c4d8', fontSize: 14 }}>Start designing for free — no credit card required</p>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              marginBottom: 16, padding: '12px 16px',
              background: 'rgba(255,180,171,0.08)',
              border: '1px solid rgba(255,180,171,0.3)',
              borderRadius: 12, color: '#ffb4ab', fontSize: 14,
            }}>
              {error}
            </div>
          )}

          {/* Success banner */}
          {success && (
            <div style={{
              marginBottom: 16, padding: '12px 16px',
              background: 'rgba(78,222,163,0.1)',
              border: '1px solid rgba(78,222,163,0.3)',
              borderRadius: 12, color: '#4edea3', fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
              Account created! Redirecting to dashboard…
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Full name */}
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#c7c4d8', marginBottom: 8,
                letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined"
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 18, color: '#c7c4d8', pointerEvents: 'none' }}>person</span>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-glass"
                  style={{ paddingLeft: 44 }}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#c7c4d8', marginBottom: 8,
                letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined"
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 18, color: '#c7c4d8', pointerEvents: 'none' }}>mail</span>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-glass"
                  style={{ paddingLeft: 44 }}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#c7c4d8', marginBottom: 8,
                  letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined"
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 18, color: '#c7c4d8', pointerEvents: 'none' }}>lock</span>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input-glass"
                    style={{ paddingLeft: 44 }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#c7c4d8', marginBottom: 8,
                  letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Confirm
                </label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined"
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 18, color: '#c7c4d8', pointerEvents: 'none' }}>lock_reset</span>
                  <input
                    id="reg-confirm"
                    type="password"
                    required
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    className="input-glass"
                    style={{ paddingLeft: 44 }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              id="reg-submit"
              type="submit"
              disabled={loading || success}
              className="btn-primary"
              style={{ padding: '14px 24px', marginTop: 8, width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                opacity: (loading || success) ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Creating account…
                </>
              ) : success ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
                  Redirecting…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>rocket_launch</span>
                  Create Free Account
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#c7c4d8' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#c3c0ff', fontWeight: 700, textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>
          </div>
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <Link to="/" style={{ fontSize: 12, color: 'rgba(199,196,216,0.5)', textDecoration: 'none' }}>
              ← Back to home
            </Link>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
