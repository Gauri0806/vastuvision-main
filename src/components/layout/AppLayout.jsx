import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Atmospheric glow orbs */}
      <div className="atmo-orb-primary" />
      <div className="atmo-orb-secondary" />

      <Sidebar />

      <div className="ml-64 flex flex-col min-h-screen relative z-10">
        <TopNav />
        <main className="flex-1 p-margin-desktop page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
