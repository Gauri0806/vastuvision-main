import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Still verifying the stored token against the server
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0b1326',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <div style={{
          width: 48, height: 48,
          border: '4px solid rgba(195,192,255,0.15)',
          borderTop: '4px solid #4edea3',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{
          color: '#c7c4d8', fontSize: 11,
          letterSpacing: '0.15em', textTransform: 'uppercase',
        }}>
          Loading VastuVision…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not authenticated — but also check localStorage as a safety net
  // for the rare case where React state hasn't caught up yet
  const hasLocalToken = !!localStorage.getItem('vv_token');
  if (!isAuthenticated && !hasLocalToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
