import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: 'view_in_ar',
    title: '3D Interior Design',
    desc: 'Drag, drop and arrange furniture in an immersive real-time 3D environment.',
    color: 'primary',
  },
  {
    icon: 'architecture',
    title: 'Blueprint AI Analysis',
    desc: 'Upload any floor plan image and our AI detects walls, rooms, doors and dimensions instantly.',
    color: 'secondary',
  },
  {
    icon: 'compass_calibration',
    title: 'Vastu Intelligence',
    desc: 'Get precise Vastu compliance scores and AI-driven correction recommendations for every room.',
    color: 'tertiary',
  },
  {
    icon: 'auto_fix_high',
    title: 'AI Auto-Corrections',
    desc: 'One-click apply all Vastu fixes with intelligent furniture repositioning suggestions.',
    color: 'primary',
  },
];

const comparisons = [
  { name: 'Planner5D', hasAI: false, hasVastu: false },
  { name: 'Homestyler', hasAI: false, hasVastu: false },
  { name: 'VastuVision', hasAI: true, hasVastu: true, isUs: true },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-on-background overflow-x-hidden">
      {/* Atmospheric orbs */}
      <div className="fixed top-0 right-0 w-[700px] h-[700px] bg-primary/8 rounded-full blur-[120px] pointer-events-none -z-0" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-secondary/6 rounded-full blur-[100px] pointer-events-none -z-0" />

      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 h-16 bg-surface/70 backdrop-blur-xl border-b border-white/10">
        <div>
          <span className="text-xl font-black text-primary font-headline-md tracking-tight">VastuVision</span>
          <span className="text-xs font-label-sm text-on-surface-variant opacity-60 ml-2">Architectural AI</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">Features</a>
          <a href="#how" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">How it works</a>
          <button
            onClick={() => navigate('/login')}
            className="btn-ghost text-sm py-2 px-5"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="btn-primary text-sm py-2 px-5"
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative flex flex-col items-center justify-center text-center pt-24 pb-20 px-6 z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
          <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
          <span className="text-xs font-label-sm text-primary tracking-widest uppercase">Future of Architecture is Here</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-black font-headline-md leading-tight max-w-4xl tracking-tight mb-6"
          style={{ letterSpacing: '-0.02em' }}>
          Design Your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Dream Home
          </span>{' '}
          with AI
        </h1>

        <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed mb-10">
          Create intelligent interiors with AI-powered design, blueprint analysis, and Vastu
          optimization. Harness the wisdom of ancient tradition with the speed of artificial intelligence.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => navigate('/register')}
            className="btn-primary px-8 py-4 text-base"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>rocket_launch</span>
              Start Designing Free
            </span>
          </button>
          <button
            onClick={() => navigate('/blueprint')}
            className="btn-secondary px-8 py-4 text-base"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>architecture</span>
              Upload Blueprint
            </span>
          </button>
        </div>

        {/* Hero Card Preview */}
        <div className="relative mt-16 max-w-4xl w-full">
          <div className="glass-panel rounded-2xl p-1 overflow-hidden shadow-2xl" style={{ boxShadow: '0 0 60px rgba(79,70,229,0.2)' }}>
            <div className="rounded-xl overflow-hidden bg-surface-container aspect-video relative grid-pattern flex items-center justify-center">
              {/* Simulated 3D Preview */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
              <div className="relative z-10 text-center p-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-container/30 border border-primary/20 flex items-center justify-center"
                  style={{ animation: 'float 6s ease-in-out infinite' }}>
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '48px' }}>home</span>
                </div>
                <p className="text-secondary font-label-sm text-xs tracking-widest uppercase mb-2">3D Workspace Preview</p>
                <p className="text-on-surface-variant text-sm">Your AI-powered interior design environment</p>
                <button
                  onClick={() => navigate('/register')}
                  className="mt-6 btn-primary text-sm py-2.5 px-6 inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>play_circle</span>
                  Launch Workspace
                </button>
              </div>
              {/* Decorative floating cards */}
              <div className="absolute top-6 left-6 glass-panel p-3 rounded-xl border border-secondary/20 flex items-center gap-2 text-xs">
                <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                <span className="text-secondary font-label-sm">Vastu Score: 88%</span>
              </div>
              <div className="absolute bottom-6 right-6 glass-panel p-3 rounded-xl border border-primary/20 text-xs">
                <p className="text-primary font-label-sm">AI Analysis Complete</p>
                <p className="text-on-surface-variant">3 rooms detected</p>
              </div>
            </div>
          </div>
          {/* Glow effect */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-primary/20 blur-2xl rounded-full" />
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-16 px-6 z-10 relative">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '10,000+', label: 'Designs Created' },
            { value: '98%', label: 'Vastu Accuracy' },
            { value: '< 30s', label: 'Blueprint Analysis' },
            { value: '50+', label: 'Furniture Models' },
          ].map(({ value, label }) => (
            <div key={label} className="glass-panel p-6 rounded-xl text-center">
              <p className="text-3xl font-black text-primary font-headline-md mb-1">{value}</p>
              <p className="text-xs text-on-surface-variant font-label-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-20 px-6 z-10 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 mb-4">
              <span className="text-xs font-label-sm text-secondary tracking-widest uppercase">Core Features</span>
            </div>
            <h2 className="text-4xl font-black font-headline-md mb-4" style={{ letterSpacing: '-0.02em' }}>
              Everything You Need to Design
            </h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">
              From blueprint to beautiful interior — AI handles the heavy lifting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(({ icon, title, desc, color }) => {
              const colorMap = {
                primary: 'text-primary bg-primary/10 border-primary/20',
                secondary: 'text-secondary bg-secondary/10 border-secondary/20',
                tertiary: 'text-tertiary bg-tertiary/10 border-tertiary/20',
              };
              return (
                <div key={title} className="glass-panel p-6 rounded-2xl hover:border-white/20 transition-all duration-300 group">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${colorMap[color]} group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined">{icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-on-surface mb-2">{title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="py-20 px-6 z-10 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black font-headline-md mb-4" style={{ letterSpacing: '-0.02em' }}>
              From Blueprint to 3D in Minutes
            </h2>
          </div>
          <div className="space-y-6">
            {[
              { step: '01', icon: 'cloud_upload', title: 'Upload Your Blueprint', desc: 'Drag & drop any floor plan image (PNG, JPG, PDF). Our AI instantly starts analyzing the structure.', color: 'primary' },
              { step: '02', icon: 'psychology', title: 'AI Analyzes the Layout', desc: 'Walls, doors, windows, and room dimensions are detected in seconds using computer vision.', color: 'secondary' },
              { step: '03', icon: 'view_in_ar', title: 'Edit in 3D', desc: 'Your floor plan becomes an editable 3D room. Drag furniture, change materials, add lighting.', color: 'primary' },
              { step: '04', icon: 'compass_calibration', title: 'Get Vastu Report', desc: 'Run a full Vastu audit and apply AI-suggested corrections with a single click.', color: 'tertiary' },
            ].map(({ step, icon, title, desc, color }) => {
              const cl = { primary: 'border-primary/30 text-primary', secondary: 'border-secondary/30 text-secondary', tertiary: 'border-tertiary/30 text-tertiary' };
              return (
                <div key={step} className="glass-panel p-6 rounded-2xl flex items-start gap-6 hover:border-white/20 transition-all">
                  <div className={`flex-shrink-0 w-14 h-14 rounded-2xl border flex flex-col items-center justify-center ${cl[color]}`}>
                    <span className="text-xs font-label-sm opacity-60">{step}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{icon}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface mb-1">{title}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 px-6 z-10 relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="vastu-gradient-border rounded-2xl">
            <div className="glass-dark rounded-2xl p-12">
              <h2 className="text-4xl font-black font-headline-md mb-4" style={{ letterSpacing: '-0.02em' }}>
                Ready to Design Your Dream Home?
              </h2>
              <p className="text-on-surface-variant mb-8 leading-relaxed">
                Join architects and designers using VastuVision to create intelligent, Vastu-compliant 3D interiors.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="btn-primary px-10 py-4 text-base"
                >
                  Start Free Today
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="btn-ghost px-10 py-4 text-base"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <p className="text-xs text-on-surface-variant font-label-sm">
          © 2025 VastuVision · AI-Powered Architectural Design Platform
        </p>
      </footer>
    </div>
  );
}
