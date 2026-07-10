import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import VastuScoreRing from '../components/ui/VastuScoreRing';
import { vastuAPI } from '../api/vastu';
import { projectsAPI } from '../api/projects';
import jsPDF from 'jspdf';

// Room type options for labeling
const ROOM_TYPES = [
  'Master Bedroom', 'Bedroom', "Children's Bedroom", 'Guest Bedroom',
  'Kitchen', 'Living Room', 'Dining Room', 'Bathroom', 'Toilet',
  'Pooja Room', 'Study', 'Store Room', 'Balcony', 'Garage', 'Open',
];

const ZONES = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'C'];

const ZONE_COLORS = {
  N: '#3b82f6', NE: '#10b981', E: '#f59e0b', SE: '#ef4444',
  S: '#8b5cf6', SW: '#ec4899', W: '#06b6d4', NW: '#84cc16', C: '#6b7280',
};

const ZONE_LABELS = {
  N: 'North', NE: 'North-East', E: 'East', SE: 'South-East',
  S: 'South', SW: 'South-West', W: 'West', NW: 'North-West', C: 'Center',
};

export default function VastuAudit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');

  const [rooms, setRooms]             = useState([
    { name: 'Master Bedroom', zone: 'SW' },
    { name: 'Kitchen',        zone: 'SE' },
    { name: 'Living Room',    zone: 'N'  },
    { name: 'Bathroom',       zone: 'NW' },
  ]);
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [applying, setApplying]       = useState(false);
  const [activeTab, setActiveTab]     = useState('correct');
  const [projectName, setProjectName] = useState('My Project');
  const [analyzed, setAnalyzed]       = useState(false);
  const [correctionMode, setCorrectionMode] = useState(false);
  const reportRef = useRef(null);

  // Load project data if projectId provided
  useEffect(() => {
    if (!projectId) return;
    const load = async () => {
      try {
        const { data } = await projectsAPI.getById(projectId);
        if (data?.project) {
          setProjectName(data.project.name);
          if (data.project.rooms?.length) setRooms(data.project.rooms);
          if (data.project.vastuData?.score) {
            setResult(data.project.vastuData);
            setAnalyzed(true);
          }
        }
      } catch (_) {}
    };
    load();
  }, [projectId]);

  // Run vastu analysis
  const handleAnalyze = async () => {
    if (!rooms.length) return;
    setLoading(true);
    try {
      const { data } = await vastuAPI.analyze({ rooms, projectId });
      setResult(data);
      setAnalyzed(true);
      setActiveTab('correct');
    } catch (err) {
      console.error('Vastu analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply AI fixes — use suggested zones
  const handleApplyFixes = async () => {
    if (!result?.recommendations) return;
    setApplying(true);

    // Build corrected rooms from recommendations
    const correctedRooms = rooms.map(r => {
      const fix = result.recommendations.find(rec => rec.room === r.name && rec.suggestedZone);
      return fix ? { ...r, zone: fix.suggestedZone } : r;
    });
    setRooms(correctedRooms);

    try {
      // If we have a valid saved projectId, persist fixes to DB — otherwise just re-analyze
      let data;
      const isValidProject = projectId && projectId !== 'current' && projectId !== 'null' && projectId !== 'undefined';
      if (isValidProject) {
        const res = await vastuAPI.applyFixes(projectId, { rooms: correctedRooms });
        data = res.data;
      } else {
        const res = await vastuAPI.analyze({ rooms: correctedRooms });
        data = res.data;
      }
      if (data) setResult(data);
    } catch (_) {
      // Last resort: re-analyze with corrected rooms locally
      const { data } = await vastuAPI.analyze({ rooms: correctedRooms }).catch(() => ({ data: null }));
      if (data) setResult(data);
    } finally {
      setApplying(false);
    }
  };

  // Add / remove / update rooms
  const addRoom = () => setRooms(r => [...r, { name: 'Bedroom', zone: 'N' }]);
  const removeRoom = (i) => setRooms(r => r.filter((_, idx) => idx !== i));
  const updateRoom = (i, field, val) =>
    setRooms(r => r.map((room, idx) => idx === i ? { ...room, [field]: val } : room));

  // Download PDF report
  const downloadPDF = () => {
    const doc = new jsPDF();
    const score = result?.score || 0;
    const date  = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('VastuVision AI', 15, 18);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Vastu Shastra Compliance Report', 15, 28);
    doc.text(date, 150, 28);

    // Score box
    doc.setFillColor(score >= 80 ? 0 : score >= 60 ? 234 : 239,
                     score >= 80 ? 165 : score >= 60 ? 179 : 68,
                     score >= 80 ? 114 : score >= 60 ? 8 : 68);
    doc.rect(140, 45, 55, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(`${score}`, 157, 64);
    doc.setFontSize(9);
    doc.text('/ 100', 172, 64);
    doc.setFontSize(8);
    doc.text(result?.label || '', 143, 72);

    // Project info
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(projectName, 15, 58);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Rooms Analyzed: ${rooms.length}`, 15, 67);
    doc.text(`Analysis Date: ${date}`, 15, 74);

    // Room table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Room Zone Assignment', 15, 92);

    let y = 100;
    doc.setFillColor(240, 240, 250);
    doc.rect(15, y - 5, 180, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Room', 18, y);
    doc.text('Zone', 80, y);
    doc.text('Direction', 110, y);
    doc.text('Status', 155, y);
    y += 8;

    rooms.forEach((room, i) => {
      const detail = result?.zoneDetails?.find(d => d.room === room.name);
      if (i % 2 === 0) { doc.setFillColor(250, 250, 255); doc.rect(15, y - 5, 180, 8, 'F'); }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      doc.text(room.name, 18, y);
      doc.text(room.zone, 80, y);
      doc.text(ZONE_LABELS[room.zone] || room.zone, 110, y);
      const status = detail?.status || '—';
      doc.setTextColor(status === 'ideal' ? 0 : status === 'conflict' ? 200 : 100,
                       status === 'ideal' ? 150 : 50, status === 'ideal' ? 50 : 50);
      doc.text(status.toUpperCase(), 155, y);
      doc.setTextColor(30, 30, 30);
      y += 9;
    });

    // Conflicts
    if (result?.conflicts?.length) {
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(200, 50, 50);
      doc.text('Conflicts Found', 15, y);
      y += 8;
      result.conflicts.forEach(c => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        const lines = doc.splitTextToSize(`• ${c.label}: ${c.detail}`, 175);
        doc.text(lines, 18, y);
        y += lines.length * 6 + 3;
      });
    }

    // Recommendations
    if (result?.recommendations?.length) {
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('AI Recommendations', 15, y);
      y += 8;
      result.recommendations.forEach(rec => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(50, 80, 200);
        doc.text(`${rec.title}`, 18, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        const lines = doc.splitTextToSize(rec.desc, 170);
        doc.text(lines, 18, y);
        y += lines.length * 6 + 4;
      });
    }

    // Footer
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 282, 210, 15, 'F');
    doc.setTextColor(150, 150, 180);
    doc.setFontSize(8);
    doc.text('Generated by VastuVision AI — Powered by traditional Vastu Shastra rules', 15, 291);

    doc.save(`VastuReport_${projectName.replace(/\s/g, '_')}.pdf`);
  };

  const score      = result?.score || 0;
  const scoreLabel = result?.label || 'Not Analyzed';
  const scoreLabelColor = score >= 80 ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
                        : score >= 60 ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
                        : 'text-red-400 border-red-400/30 bg-red-400/10';

  return (
    <AppLayout>
      <div className="space-y-lg page-enter">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-black font-headline-md text-on-surface" style={{ letterSpacing: '-0.02em' }}>
              Vastu Audit
            </h2>
            <p className="text-on-surface-variant text-sm mt-1 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>home</span>
              Project: <strong className="text-on-surface">{projectName}</strong>
              {analyzed && <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Analyzed ✓</span>}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/blueprint')} className="btn-ghost text-sm py-2 px-4 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>architecture</span>Blueprint
            </button>
            {analyzed && (
              <button onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                Download Report
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-gutter">
          {/* Left — Room assignment + Compass map */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-gutter">

            {/* Room Zone Assignment */}
            <div className="glass-card rounded-2xl p-gutter">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">table_chart</span>
                  Room Zone Assignment
                </h3>
                <button onClick={addRoom}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-primary/40 text-primary hover:bg-primary/10 transition-all">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span> Add Room
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {rooms.map((room, i) => (
                  <div key={i} className="flex items-center gap-3 bg-surface-container-low p-3 rounded-xl border border-white/5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ZONE_COLORS[room.zone] || '#6b7280' }} />
                    <select value={room.name} onChange={e => updateRoom(i, 'name', e.target.value)}
                      className="flex-1 bg-transparent text-sm text-on-surface outline-none cursor-pointer">
                      {ROOM_TYPES.map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
                    </select>
                    <span className="text-xs text-on-surface-variant">Zone:</span>
                    <select value={room.zone} onChange={e => updateRoom(i, 'zone', e.target.value)}
                      className="bg-transparent text-sm font-bold outline-none cursor-pointer"
                      style={{ color: ZONE_COLORS[room.zone] || '#6b7280' }}>
                      {ZONES.map(z => <option key={z} value={z} className="bg-gray-900 text-white">{z} — {ZONE_LABELS[z]}</option>)}
                    </select>
                    <button onClick={() => removeRoom(i)} className="text-red-400 hover:text-red-300 ml-auto">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={handleAnalyze} disabled={loading || !rooms.length}
                className="mt-4 w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 0 20px rgba(79,70,229,0.3)' }}>
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
                  : <><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>psychology</span> Run Vastu Analysis</>}
              </button>
            </div>

            {/* Compass Zone Visual Map */}
            <div className="glass-card rounded-2xl p-gutter">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">explore</span>
                Vastu Compass Map
              </h3>
              <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
                {['NW','N','NE','W','C','E','SW','S','SE'].map(zone => {
                  const roomsInZone = rooms.filter(r => r.zone === zone);
                  const hasConflict = result?.conflicts?.some(c => c.zone === zone);
                  const hasIdeal    = result?.correct?.some(c => c.zone === zone && c.type === 'ideal');
                  return (
                    <div key={zone}
                      className="aspect-square rounded-xl flex flex-col items-center justify-center p-2 border transition-all"
                      style={{
                        borderColor: hasConflict ? '#ef4444' : hasIdeal ? '#10b981' : `${ZONE_COLORS[zone]}40`,
                        background: hasConflict ? 'rgba(239,68,68,0.1)' : hasIdeal ? 'rgba(16,185,129,0.1)' : `${ZONE_COLORS[zone]}15`,
                      }}>
                      <span className="text-xs font-bold mb-1" style={{ color: ZONE_COLORS[zone] }}>{zone}</span>
                      {roomsInZone.map(r => (
                        <span key={r.name} className="text-[9px] text-center text-on-surface-variant leading-tight">{r.name}</span>
                      ))}
                      {roomsInZone.length === 0 && <span className="text-[9px] text-on-surface-variant opacity-40">Empty</span>}
                      {hasConflict && <span className="material-symbols-outlined text-red-400 mt-1" style={{ fontSize: '12px' }}>warning</span>}
                      {hasIdeal && !hasConflict && <span className="material-symbols-outlined text-emerald-400 mt-1" style={{ fontSize: '12px' }}>check_circle</span>}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Ideal</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Conflict</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" /> Empty</span>
              </div>
            </div>
          </div>

          {/* Right — Score + Breakdown */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-gutter">
            {/* Score Ring */}
            <div className="glass-card p-gutter rounded-2xl flex flex-col items-center text-center">
              <h3 className="text-xs font-label-sm text-on-surface-variant uppercase tracking-widest mb-4">
                Vastu Compliance Score
              </h3>
              <VastuScoreRing score={score} size={180} />
              <div className={`mt-4 px-6 py-2 rounded-full border ${scoreLabelColor} text-xs font-label-sm font-bold`}>
                {scoreLabel}
              </div>
              {!analyzed && <p className="text-xs text-on-surface-variant mt-3 opacity-60">Add rooms and run analysis to see your score</p>}
            </div>

            {/* Tabs: correct / conflicts / AI */}
            {analyzed && (
              <div className="glass-card rounded-2xl flex flex-col overflow-hidden flex-1">
                <div className="grid grid-cols-3 border-b border-white/5">
                  {[
                    { key: 'correct',   icon: 'check_circle', color: 'text-emerald-400 border-emerald-400', count: result?.correct?.length },
                    { key: 'conflicts', icon: 'cancel',       color: 'text-red-400 border-red-400',         count: result?.conflicts?.length },
                    { key: 'ai',        icon: 'psychology',   color: 'text-purple-400 border-purple-400',   count: result?.recommendations?.length },
                  ].map(({ key, icon, color, count }) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                      className={`p-3 flex flex-col items-center gap-1 transition-all ${activeTab === key ? `${color} border-b-2` : 'text-on-surface-variant hover:text-on-surface'}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
                      <span className="text-[9px] font-bold capitalize">{key}</span>
                      {count > 0 && <span className="text-[9px] opacity-70">({count})</span>}
                    </button>
                  ))}
                </div>

                <div className="p-3 flex flex-col gap-2 overflow-y-auto max-h-72 custom-scrollbar">
                  {activeTab === 'correct' && (result?.correct || []).map((item, i) => (
                    <div key={i} className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/20 flex gap-2">
                      <span className="material-symbols-outlined text-emerald-400 flex-shrink-0" style={{ fontSize: '16px' }}>{item.icon || 'check_circle'}</span>
                      <div>
                        <p className="text-xs font-bold text-on-surface">{item.label}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                  {activeTab === 'correct' && !result?.correct?.length && (
                    <p className="text-xs text-on-surface-variant text-center py-4">No correct placements yet</p>
                  )}

                  {activeTab === 'conflicts' && (result?.conflicts || []).map((item, i) => (
                    <div key={i} className="bg-red-500/5 p-3 rounded-lg border border-red-500/20 flex gap-2">
                      <span className="material-symbols-outlined text-red-400 flex-shrink-0" style={{ fontSize: '16px' }}>warning</span>
                      <div>
                        <p className="text-xs font-bold text-on-surface">{item.label}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">{item.detail}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${item.severity === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {item.severity} priority
                        </span>
                      </div>
                    </div>
                  ))}
                  {activeTab === 'conflicts' && !result?.conflicts?.length && analyzed && (
                    <p className="text-xs text-emerald-400 text-center py-4">✓ No conflicts detected!</p>
                  )}

                  {activeTab === 'ai' && (result?.recommendations || []).map((rec, i) => (
                    <div key={i} className="bg-purple-500/5 p-3 rounded-lg border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-purple-400" style={{ fontSize: '14px' }}>{rec.icon || 'lightbulb'}</span>
                        <span className="text-xs font-bold text-purple-300">{rec.title}</span>
                        {rec.priority && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">{rec.priority}</span>}
                      </div>
                      <p className="text-[10px] text-on-surface-variant">{rec.desc}</p>
                      {rec.suggestedZone && (
                        <p className="text-[9px] text-purple-400 mt-1">
                          Move to {ZONE_LABELS[rec.suggestedZone]} ({rec.suggestedZone}) zone
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Apply fixes button */}
                {result?.conflicts?.length > 0 && (
                  <div className="p-3 border-t border-white/5">
                    <button onClick={handleApplyFixes} disabled={applying}
                      className="w-full py-2.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                      style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                      {applying
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Applying Fixes...</>
                        : <><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>auto_fix_high</span>Apply AI Fixes</>}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Background atmospherics */}
      <div className="fixed top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] opacity-30 pointer-events-none" />
      <div className="fixed bottom-0 left-64 -z-10 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] opacity-20 pointer-events-none" />
    </AppLayout>
  );
}
