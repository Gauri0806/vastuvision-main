import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import StatCard from '../components/ui/StatCard';
import ProjectCard from '../components/ui/ProjectCard';
import VastuScoreRing from '../components/ui/VastuScoreRing';
import { projectsAPI } from '../api/projects';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, layouts: 0, analyzed: 0, withVastu: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const { data } = await projectsAPI.getAll({ limit: 4 });
        if (data?.projects?.length) setProjects(data.projects);
        if (data?.stats) setStats(data.stats);
      } catch {
        // Use demo data if backend not connected
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AppLayout>
      <div className="space-y-xl">

        {/* Hero Section */}
        <section className="grid grid-cols-12 gap-gutter items-center min-h-[500px]">
          <div className="col-span-12 lg:col-span-6 space-y-md">
            <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-xs font-label-sm text-primary tracking-widest uppercase">Future of Architecture</span>
            </div>
            <h2 className="text-5xl font-black font-headline-md leading-tight" style={{ letterSpacing: '-0.02em' }}>
              {greeting()},{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                {user?.name?.split(' ')[0] || 'Designer'}
              </span>
            </h2>
            <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
              Create intelligent interiors with AI-powered design, blueprint analysis, and Vastu optimization.
            </p>
            <div className="flex flex-wrap gap-md pt-2">
              <button
                onClick={() => navigate('/workspace')}
                className="btn-primary px-8 py-4 flex items-center gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_home</span>
                Start New Project
              </button>
              <button
                onClick={() => navigate('/blueprint')}
                className="btn-secondary px-8 py-4 flex items-center gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>cloud_upload</span>
                Upload Blueprint
              </button>
              <button
                onClick={() => navigate('/library')}
                className="btn-ghost px-8 py-4 flex items-center gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>folder_special</span>
                My Library
              </button>
            </div>
          </div>

          {/* Right: Animated visual */}
          <div className="col-span-12 lg:col-span-6 relative">
            <div className="glass-panel p-4 rounded-2xl relative z-10 aspect-video overflow-hidden shadow-2xl"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="w-full h-full rounded-xl overflow-hidden bg-surface-container grid-pattern flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
                {/* Floating animation */}
                <div className="relative z-10 text-center" style={{ animation: 'float 6s ease-in-out infinite' }}>
                  <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-primary-container/20 border border-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '48px' }}>view_in_ar</span>
                  </div>
                  <p className="text-secondary text-xs font-label-sm tracking-widest uppercase">3D Workspace Ready</p>
                </div>
                {/* Overlay info cards */}
                <div className="absolute top-4 left-4 glass-panel p-3 rounded-xl border border-secondary/20 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                    <span className="text-secondary font-label-sm">AI Analysis Active</span>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 glass-panel p-3 rounded-xl border border-primary/20 text-xs">
                  <p className="text-primary font-label-sm">Vastu: 88% ✓</p>
                </div>
              </div>
            </div>
            {/* Decorative glow orbs */}
            <div className="absolute -top-8 -right-8 w-48 h-48 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-secondary/10 blur-3xl rounded-full pointer-events-none" />
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          <StatCard icon="folder"      label="Total Projects"    value={stats.total    || 0} color="primary"   />
          <StatCard icon="layers"      label="Saved Layouts"     value={stats.layouts  || 0} color="secondary" />
          <StatCard icon="task_alt"    label="Analyzed Designs"  value={stats.analyzed || 0} color="tertiary"  />
          <StatCard icon="verified"    label="Vastu Reports"     value={stats.withVastu|| 0} color="primary"   />
        </section>

        {/* Recent Projects */}
        <section className="space-y-md">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-2xl font-bold font-headline-md text-on-surface">Recent Projects</h3>
              <p className="text-xs font-label-sm text-on-surface-variant mt-1">Pick up where you left off</p>
            </div>
            <button
              onClick={() => navigate('/library')}
              className="text-primary text-sm font-label-sm flex items-center gap-2 hover:underline"
            >
              View All Projects
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-panel rounded-2xl h-56 animate-pulse bg-surface-container-high" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">
              {projects.map((p) => <ProjectCard key={p._id} project={p} />)}
            </div>
          )}
        </section>

        {/* Bento: Vastu + Templates */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          {/* AI Vastu Audit Card */}
          <div className="lg:col-span-2 glass-panel p-lg rounded-2xl relative overflow-hidden group">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div className="space-y-2 flex-1">
                <h3 className="text-2xl font-bold font-headline-md">AI Vastu Audit</h3>
                <p className="text-on-surface-variant max-w-md text-sm leading-relaxed">
                  {stats.withVastu > 0
                    ? <><strong className="text-secondary">{stats.withVastu} project{stats.withVastu > 1 ? 's' : ''}</strong> analyzed with Vastu scoring. Upload a blueprint to analyze your next floor plan.</>
                    : <>No Vastu analysis yet. Upload a blueprint and run an audit to see your home&apos;s Vastu compliance score.</>}
                </p>
              </div>
              <VastuScoreRing score={stats.withVastu > 0 ? Math.min(100, 60 + stats.withVastu * 5) : 0} size={96} />
            </div>
            <div className="mt-lg grid grid-cols-2 gap-md">
              <div className="p-sm rounded-xl bg-white/5 border border-white/5">
                <span className="text-xs font-label-sm text-on-surface-variant">Total Scans</span>
                <p className="font-bold text-secondary text-sm mt-0.5">{stats.withVastu || 0} done</p>
              </div>
              <div className="p-sm rounded-xl bg-white/5 border border-white/5">
                <span className="text-xs font-label-sm text-on-surface-variant">Next Step</span>
                <p className="font-bold text-primary text-sm mt-0.5">{stats.total > 0 ? 'Run Audit' : 'Upload Plan'}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/vastu')}
              className="mt-lg w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all text-sm"
            >
              {stats.withVastu > 0 ? 'View Vastu Reports →' : 'Start First Vastu Audit →'}
            </button>
          </div>

          {/* Templates Card */}
          <div className="glass-panel p-lg rounded-2xl flex flex-col justify-between"
            style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.1) 0%, transparent 100%)' }}>
            <div>
              <h3 className="text-xl font-bold font-headline-md mb-1">New Templates</h3>
              <p className="text-on-surface-variant text-xs font-label-sm">Updated weekly by AI Architects</p>
            </div>
            <div className="space-y-4 my-6">
              {[
                { name: 'Nordic Minimalist 2.0', icon: 'weekend' },
                { name: 'Urban Micro-Apartment', icon: 'apartment' },
                { name: 'Zen Vastu Harmony', icon: 'spa' },
              ].map(({ name, icon }) => (
                <div key={name} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-14 h-10 rounded-lg bg-surface-container overflow-hidden flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-all">
                    <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '22px' }}>{icon}</span>
                  </div>
                  <span className="text-sm text-on-surface group-hover:text-primary transition-colors">{name}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/library')}
              className="py-3 text-secondary font-bold border border-secondary/30 rounded-xl hover:bg-secondary/10 transition-all text-sm"
            >
              Browse All Templates
            </button>
          </div>
        </section>

      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/workspace')}
        className="fixed bottom-12 right-12 w-16 h-16 bg-primary-container text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-50"
        style={{ boxShadow: '0 0 30px rgba(79,70,229,0.4)' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>add</span>
      </button>
    </AppLayout>
  );
}
