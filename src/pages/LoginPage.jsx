import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // If already logged in, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      setSuccess(true);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message;
      if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Cannot connect to server. Make sure the backend is running on port 5000.');
      } else {
        setError(msg || 'Invalid credentials. Please try again.');
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
        style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(78,222,163,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <div className="w-full max-w-4xl glass-panel rounded-2xl overflow-hidden shadow-2xl flex relative z-10"
        style={{ boxShadow: '0 0 60px rgba(79,70,229,0.15)' }}>

        {/* ── Left decorative panel ── */}
        <div className="hidden md:flex w-2/5 flex-col justify-between p-10 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a0f6e 0%, #4f46e5 100%)' }}>
          <div className="absolute inset-0 grid-pattern opacity-20" />

          {/* Logo */}
          <div className="relative z-10">
            <h1 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
              VastuVision
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 }}>Architectural AI Platform</p>
          </div>

          {/* Vastu score card */}
          <div className="relative z-10">
            <div className="glass-dark p-4 rounded-xl" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(78,222,163,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#4edea3' }}>compass_calibration</span>
                </div>
                <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Vastu Score</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: '#4edea3', lineHeight: 1 }}>88%</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 3 }}>compliance</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: '88%', height: '100%', background: '#4edea3', borderRadius: 3,
                  boxShadow: '0 0 8px #4edea3' }} />
              </div>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 16, lineHeight: 1.6 }}>
              Design your dream home with AI-powered intelligence and Vastu wisdom.
            </p>
          </div>
        </div>

        {/* ── Right: Login form ── */}
        <div className="flex-1 p-10 flex flex-col justify-center">
          <div style={{ marginBottom: 28 }}>
            <h2 className="font-black text-on-surface"
              style={{ fontSize: 28, letterSpacing: '-0.02em', fontFamily: 'Hanken Grotesk, sans-serif', marginBottom: 6 }}>
              Welcome Back
            </h2>
            <p style={{ color: '#c7c4d8', fontSize: 14 }}>Sign in to your VastuVision account</p>
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
              Signed in! Redirecting…
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
                  id="login-email"
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

            {/* Password */}
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
                  id="login-password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-glass"
                  style={{ paddingLeft: 44 }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading || success}
              className="btn-primary"
              style={{ padding: '14px 24px', marginTop: 4, width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                opacity: (loading || success) ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Signing in…
                </>
              ) : success ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
                  Redirecting…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>login</span>
                  Sign In
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#c7c4d8' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#c3c0ff', fontWeight: 700, textDecoration: 'none' }}>
                Create one free
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
