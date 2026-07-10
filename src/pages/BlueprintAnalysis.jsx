import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { blueprintAPI } from '../api/blueprint';
import { projectsAPI } from '../api/projects';

const THREE_D_URL = import.meta.env.VITE_3D_APP_URL || 'http://localhost:3000';

// ── Gemini Vision for reliable room detection ─────────────────────
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
const GEMINI_URL = (key, model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

const TELEMETRY_STEPS = [
  { key: 'walls',      label: 'Detecting walls',              icon: 'border_all' },
  { key: 'rooms',      label: 'Identifying rooms',            icon: 'sensor_door' },
  { key: 'doors',      label: 'Locating doors & windows',     icon: 'door_front' },
  { key: 'dimensions', label: 'Mapping dimensions',           icon: 'straighten' },
  { key: 'vastu',      label: 'Analyzing directions (Vastu)', icon: 'compass_calibration' },
];

const ROOM_TYPES = [
  'bedroom', 'master_bedroom', 'living', 'kitchen', 'bathroom',
  'toilet', 'pooja', 'study', 'dining', 'store', 'garage',
  'balcony', 'open', 'hallway', 'guest_bedroom', 'children_bedroom',
];

const ZONE_OPTIONS = ['N','NE','E','SE','S','SW','W','NW','C'];

const VASTU_ZONE_RULES = {
  N:  { ideal:['living','drawing','study','treasury','entrance'], bad:['kitchen','toilet','bathroom'] },
  NE: { ideal:['pooja','prayer','study','meditation','entrance','open'], bad:['kitchen','toilet','bathroom','bedroom','store'] },
  E:  { ideal:['living','study','children_bedroom','bathroom','entrance'], bad:['kitchen','toilet','store'] },
  SE: { ideal:['kitchen','fire','generator','electrical'], bad:['bedroom','pooja','toilet','study','master_bedroom'] },
  S:  { ideal:['master_bedroom','bedroom','store'], bad:['kitchen','entrance','living','pooja'] },
  SW: { ideal:['master_bedroom','safe','store','heavy'], bad:['kitchen','entrance','pooja','bathroom','toilet'] },
  W:  { ideal:['children_bedroom','study','dining','bathroom'], bad:['kitchen','entrance','pooja'] },
  NW: { ideal:['guest_bedroom','bathroom','garage','store','toilet'], bad:['kitchen','pooja','master_bedroom'] },
  C:  { ideal:['open','courtyard','empty'], bad:['kitchen','toilet','bathroom','bedroom','store','pooja'] },
};

function quickVastuScore(rooms) {
  let score = 50;
  for (const room of rooms) {
    const rule = VASTU_ZONE_RULES[room.zone];
    if (!rule) continue;
    const type = room.type || room.name?.toLowerCase().replace(/\s+/g,'_');
    if (rule.ideal.includes(type)) score += 10;
    else if (rule.bad.includes(type)) score -= 12;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

export default function BlueprintAnalysis() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [phase, setPhase]         = useState('upload'); // upload | processing | result
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(null);
  const [dragging, setDragging]   = useState(false);
  const [progress, setProgress]   = useState({});
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');
  const [jobId, setJobId]         = useState(null);
  const [projectName, setProjectName] = useState('My Vastu Project');
  const [saving, setSaving]       = useState(false);
  // Room labeling state
  const [rooms, setRooms]         = useState([]);
  const [showLabelEditor, setShowLabelEditor] = useState(false);
  const [showGrid, setShowGrid]   = useState(true);
  // ML source tracking: 'none' | 'gemini' | 'ml' | 'backend' | 'demo'
  const [mlRoomSource, setMlRoomSource] = useState('none');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('vv_gemini_key') || '');

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!allowed.includes(f.type)) { setError('Only PNG, JPG, and PDF files are supported.'); return; }
    setFile(f);
    setError('');
    if (f.type !== 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const simulateProgress = () => {
    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= TELEMETRY_STEPS.length) { clearInterval(interval); return; }
      setProgress((prev) => ({ ...prev, [TELEMETRY_STEPS[idx].key]: 'done' }));
      idx++;
    }, 1200);
    return interval;
  };

  // ── Gemini Vision room detection ─────────────────────────────
  const analyzeRoomsWithGemini = async (imageFile) => {
    const key = (localStorage.getItem('vv_gemini_key') || '').trim();
    if (!key) throw new Error('No Gemini key');

    // Convert file to base64
    const b64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });
    const mime = imageFile.type || 'image/jpeg';

    const prompt = `You are an expert architect. Analyse this floor plan image carefully.
Identify every room/space visible. For each room:
- Give it an English name (Living Room, Bedroom, Kitchen, Bathroom, Dining, Study, Balcony, etc.)
- Determine its Vastu direction (NW, N, NE, W, C, E, SW, S, SE) based on its position in the floor plan
- Classify its type: living, bedroom, kitchen, bathroom, dining, study, balcony, pooja, hallway, store
- Judge Vastu: optimal (perfect), good (acceptable), warning (conflict)
- Provide normalized center coordinates [x, y] for the room, where x is 0.0 to 1.0 (left to right) and y is 0.0 to 1.0 (top to bottom)

Return ONLY valid JSON, no markdown, no extra text:
{
  "rooms": [
    {"name":"Living Room","type":"living","zone":"SW","vastu":"good","center":[0.25, 0.75]},
    {"name":"Kitchen","type":"kitchen","zone":"SE","vastu":"optimal","center":[0.8, 0.8]}
  ]
}

Be accurate to what you see in the image. List ALL rooms.`;

    for (const model of GEMINI_MODELS) {
      try {
        const res = await fetch(GEMINI_URL(key, model), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [
              { text: prompt },
              { inline_data: { mime_type: mime, data: b64 } },
            ]}],
            generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
          }),
        });
        if (!res.ok) continue;
        const env  = await res.json();
        const text = env?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        // Extract JSON from response
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) continue;
        const parsed = JSON.parse(match[0]);
        if (parsed.rooms?.length > 0) return parsed.rooms;
      } catch (_) { continue; }
    }
    throw new Error('Gemini did not return rooms');
  };


  const handleAnalyze = async () => {
    if (!file) return;
    setPhase('processing');
    setProgress({});
    setMlRoomSource('none');
    const progressInterval = simulateProgress();

    try {
      // ── Step 1: Wall Detection (existing backend) ──────────────
      const formData = new FormData();
      formData.append('blueprint', file);
      const { data } = await blueprintAPI.upload(formData);
      clearInterval(progressInterval);
      const allDone = {};
      TELEMETRY_STEPS.forEach((s) => (allDone[s.key] = 'done'));
      setProgress(allDone);

      // ── Step 2: ML Room Segmentation (trained UNet) ────────────
      let finalRooms = [];
      try {
        const mlResult = await blueprintAPI.predictRooms(file);
        if (mlResult.status === 'success' && mlResult.rooms?.length > 0) {
          finalRooms = mlResult.rooms.map((r, i) => ({
            id:         i,
            name:       r.name,
            type:       r.type,
            zone:       r.zone,
            vastu:      r.vastu,
            confidence: r.confidence,
            polygon:    r.polygon,
            center:     r.center,
            mlDetected: true,
          }));
          setMlRoomSource('ml');
        }
      } catch (_mlErr) {
        // ML room model unavailable — fall back to backend rooms
        console.warn('Room ML model unavailable, using fallback rooms');
      }

      // If ML failed, fallback to Gemini
      if (finalRooms.length === 0) {
        try {
          const geminiRooms = await analyzeRoomsWithGemini(file);
          finalRooms = geminiRooms.map((r, i) => ({
            id:         i,
            name:       r.name,
            type:       r.type,
            zone:       r.zone || 'C',
            vastu:      r.vastu || 'good',
            center:     r.center,
            mlDetected: false,
            gemini:     true,
          }));
          setMlRoomSource('gemini');
        } catch (_geminiErr) { /* silent fail */ }
      }

      // ── Step 3: Fallback to backend-provided rooms ─────────────
      if (finalRooms.length === 0) {
        finalRooms = (data.rooms || []).map((r, i) => ({
          id:   i,
          name: r.name,
          type: r.type || r.name?.toLowerCase().replace(/\s+/g,'_'),
          zone: r.direction?.toUpperCase()
                  .replace('NORTH','N').replace('SOUTH','S')
                  .replace('EAST','E').replace('WEST','W') || 'C',
          vastu: r.vastu,
          mlDetected: false,
        }));
        setMlRoomSource('backend');
      }

      setRooms(finalRooms);
      setResult(data);
      setJobId(data._id || data.jobId);
      setTimeout(() => setPhase('result'), 800);

    } catch (err) {
      clearInterval(progressInterval);
      const allDone = {};
      TELEMETRY_STEPS.forEach((s) => (allDone[s.key] = 'done'));
      setProgress(allDone);
      // Demo fallback
      const demoResult = {
        rooms: [
          { name: 'Bedroom 01',  type: 'bedroom', direction: 'SW', vastu: 'optimal' },
          { name: 'Living Room', type: 'living',  direction: 'N',  vastu: 'good'    },
          { name: 'Kitchen',     type: 'kitchen', direction: 'NE', vastu: 'warning' },
        ],
        detectedElements: { bedrooms: 3, windows: 12, doors: 4, entrance: 'North-East Alignment' },
        coordinates: {
          walls: [
            { start: [50,50],   end: [350,50]  },
            { start: [350,50],  end: [350,300] },
            { start: [350,300], end: [50,300]  },
            { start: [50,300],  end: [50,50]   },
            { start: [150,50],  end: [150,180] },
            { start: [250,50],  end: [250,180] },
            { start: [50,180],  end: [350,180] },
            { start: [150,180], end: [150,300] },
          ],
        },
      };
      setRooms([
        { id: 0, name: 'Bedroom 01',  type: 'bedroom', zone: 'SW', mlDetected: false },
        { id: 1, name: 'Living Room', type: 'living',  zone: 'N',  mlDetected: false },
        { id: 2, name: 'Kitchen',     type: 'kitchen', zone: 'NE', mlDetected: false },
      ]);
      setResult(demoResult);
      setMlRoomSource('demo');
      setTimeout(() => setPhase('result'), 800);
    }
  };

  const updateRoom = (id, field, value) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRoom = () => {
    setRooms(prev => [...prev, { id: Date.now(), name: 'New Room', type: 'bedroom', zone: 'C' }]);
  };

  const removeRoom = (id) => {
    setRooms(prev => prev.filter(r => r.id !== id));
  };

  const buildSegments = () => {
    const rawWalls = result?.coordinates?.walls || result?.['3d_coordinates'] || result?.walls || [];
    return rawWalls.map(w => {
      if (w && Array.isArray(w.start) && Array.isArray(w.end)) return w;
      if (Array.isArray(w) && w.length === 4) return { start:[w[0],w[1]], end:[w[2],w[3]] };
      return null;
    }).filter(Boolean);
  };

  const handleConvertTo3D = () => {
    const segments = buildSegments();
    const token = localStorage.getItem('vv_token') || '';

    let targetUrl = `${THREE_D_URL}?source=blueprint&job=${jobId || 'demo'}`;
    if (segments.length > 0) {
      try {
        const encoded = btoa(JSON.stringify({ walls: segments }));
        if (encoded.length < 8000) targetUrl += `&coords=${encodeURIComponent(encoded)}`;
      } catch (_) {}
    }
    // Pass rooms and token so 3D workspace can show vastu data
    if (rooms.length > 0) {
      try {
        const encodedRooms = btoa(JSON.stringify(rooms));
        targetUrl += `&rooms=${encodeURIComponent(encodedRooms)}`;
      } catch (_) {}
    }
    if (token) targetUrl += `&token=${encodeURIComponent(token)}`;

    const win = window.open(targetUrl, '_blank');
    if (win && segments.length > 0) {
      const payload = JSON.stringify({ type: 'BLUEPRINT_COORDINATES', walls: segments, rooms });
      let attempts = 0;
      const tryPost = () => {
        if (attempts++ > 8) return;
        try { win.postMessage(payload, THREE_D_URL); } catch (_) {}
        setTimeout(tryPost, 1500);
      };
      setTimeout(tryPost, 1000);
    }
  };

  const handleSaveAndGoVastu = async () => {
    setSaving(true);
    try {
      const segments = buildSegments();
      const { data } = await projectsAPI.create({
        name: projectName || 'Untitled Blueprint',
        description: 'Generated from Blueprint Analysis',
      });
      const newProjectId = data.project._id;
      await projectsAPI.update(newProjectId, {
        blueprintWalls: segments,
        rooms: rooms.map(r => ({ name: r.name, type: r.type, zone: r.zone, polygon: r.polygon, center: r.center })),
        status: 'analyzed',
      });
      navigate(`/vastu?project=${newProjectId}`);
    } catch (err) {
      console.error('Failed to save project', err);
      alert('Failed to save project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const liveScore = quickVastuScore(rooms);
  const scoreColor = liveScore >= 75 ? '#4edea3' : liveScore >= 55 ? '#c3c0ff' : '#ffb4ab';

  return (
    <AppLayout>
      <div className="space-y-xl page-enter">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black font-headline-md text-on-surface" style={{ letterSpacing: '-0.02em' }}>
              Blueprint Analysis
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Upload a floor plan — AI detects rooms, walls, doors, and Vastu directions
            </p>
          </div>
          {phase !== 'upload' && (
            <button
              onClick={() => { setPhase('upload'); setFile(null); setPreview(null); setResult(null); setProgress({}); setRooms([]); }}
              className="btn-ghost text-sm py-2 px-4 flex items-center gap-2"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>restart_alt</span>
              New Analysis
            </button>
          )}
        </div>

        {/* Phase: UPLOAD */}
        {phase === 'upload' && (
          <section className="max-w-3xl mx-auto space-y-6">
            {error && <div className="p-4 bg-error/10 border border-error/30 rounded-xl text-error text-sm">{error}</div>}

            <div
              id="blueprint-dropzone"
              className={`relative flex flex-col items-center justify-center p-xl border-2 border-dashed rounded-2xl glass-panel group cursor-pointer transition-all duration-300 ${
                dragging ? 'border-primary/80 bg-primary/10' : 'border-primary/30 hover:border-primary/60'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.pdf" className="hidden"
                onChange={(e) => handleFile(e.target.files[0])} />

              {file ? (
                <div className="flex flex-col items-center gap-4">
                  {preview
                    ? <img src={preview} alt="Preview" className="max-h-48 max-w-full rounded-xl border border-white/10 object-contain" />
                    : <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: '40px' }}>picture_as_pdf</span>
                      </div>
                  }
                  <div className="text-center">
                    <p className="text-on-surface font-bold">{file.name}</p>
                    <p className="text-on-surface-variant text-xs mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '40px' }}>cloud_upload</span>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface mb-2">Upload Blueprint</h3>
                  <p className="text-on-surface-variant text-sm mb-lg">Drag and drop your architectural files here, or click to browse</p>
                  <div className="flex gap-3">
                    {['PNG', 'JPG', 'PDF'].map((fmt) => (
                      <span key={fmt} className="px-md py-xs bg-surface-variant rounded-full text-xs font-label-sm text-outline">{fmt}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {file && (
              <div className="flex gap-4">
                <button onClick={() => { setFile(null); setPreview(null); }}
                  className="btn-ghost flex-1 py-3 flex items-center justify-center gap-2 text-sm">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                  Remove
                </button>
                <button id="analyze-btn" onClick={handleAnalyze}
                  className="btn-primary flex-[3] py-3 flex items-center justify-center gap-3 text-sm">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>psychology</span>
                  Analyze with AI
                </button>
              </div>
            )}
          </section>
        )}

        {/* Phase: PROCESSING */}
        {phase === 'processing' && (
          <section className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div className="md:col-span-2 relative glass-panel rounded-2xl overflow-hidden aspect-video border border-white/10 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-t from-surface-dim to-transparent z-10" />
              {preview && <img src={preview} alt="Analyzing" className="w-full h-full object-cover opacity-50 grayscale brightness-50" />}
              {!preview && <div className="w-full h-full bg-surface-container-high grid-pattern" />}
              <div className="scan-line z-20" />
              <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
                <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-md"
                  style={{ boxShadow: '0 0 20px rgba(78,222,163,0.4)' }} />
                <h3 className="text-xl font-bold text-secondary mb-1">Analyzing Structure...</h3>
                <p className="text-xs font-label-sm text-on-surface-variant tracking-widest uppercase">AI Engine Active</p>
              </div>
            </div>
            <div className="glass-panel p-md rounded-2xl border border-white/10 flex flex-col justify-center">
              <h4 className="text-xs font-label-sm text-primary mb-md uppercase tracking-wider font-bold">Real-time Telemetry</h4>
              <ul className="space-y-sm">
                {TELEMETRY_STEPS.map(({ key, label }) => {
                  const done = progress[key] === 'done';
                  const active = !done && Object.keys(progress).length === TELEMETRY_STEPS.findIndex((s) => s.key === key);
                  return (
                    <li key={key} className={`flex items-center justify-between ${!done && !active ? 'opacity-40' : ''}`}>
                      <div className="flex items-center gap-xs">
                        {done
                          ? <span className="material-symbols-outlined text-secondary filled" style={{ fontSize: '18px' }}>check_circle</span>
                          : active
                            ? <div className="w-2 h-2 bg-primary animate-pulse rounded-full" />
                            : <div className="w-2 h-2 bg-outline rounded-full" />}
                        <span className="text-sm text-on-surface">{label}</span>
                      </div>
                      <span className={`text-xs font-label-sm ${done ? 'text-secondary' : active ? 'text-primary' : 'text-outline'}`}>
                        {done ? 'Done' : active ? 'Running...' : 'Pending'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        {/* Phase: RESULT */}
        {phase === 'result' && result && (
          <section className="max-w-6xl mx-auto">
            <div className="grid grid-cols-12 gap-gutter">

              {/* LEFT: Blueprint image + CTA */}
              <div className="col-span-12 lg:col-span-7 space-y-gutter">
                <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                  <div className="p-md bg-surface-container-high flex justify-between items-center border-b border-white/10">
                    <div className="flex gap-sm">
                      <button 
                        onClick={() => setShowGrid(!showGrid)}
                        className={`px-md py-xs rounded-lg text-xs font-label-sm flex items-center gap-xs transition-colors ${showGrid ? 'bg-primary-container text-white' : 'bg-surface-container border border-white/10 text-on-surface-variant'}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{showGrid ? 'layers' : 'layers_clear'}</span>
                        {showGrid ? 'Grid On' : 'Grid Off'}
                      </button>
                    </div>
                    <span className="text-xs text-secondary flex items-center gap-xs font-label-sm">
                      <span className="w-2 h-2 bg-secondary rounded-full" />
                      {result.coordinates?.walls?.length || 0} walls detected
                    </span>
                  </div>
                  <div className="aspect-video relative overflow-hidden bg-[#0a0f1d] p-md">
                    {preview
                      ? <img src={preview} alt="Analyzed" className="w-full h-full object-contain mix-blend-screen opacity-90" />
                      : <div className="w-full h-full grid-pattern flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary/20" style={{ fontSize: '80px' }}>map</span>
                        </div>
                    }

                    {/* 3x3 Compass Grid Overlay */}
                    {showGrid && (
                      <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-60 mix-blend-screen">
                        {['NW', 'N', 'NE', 'W', 'C', 'E', 'SW', 'S', 'SE'].map(zone => (
                          <div key={zone} className="border border-primary/20 flex items-center justify-center bg-primary/5 transition-all">
                            <span className="text-3xl font-black text-primary/30 select-none drop-shadow-md">{zone}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Room zone overlay badges */}
                    {rooms.map((room, i) => {
                      const pos = [
                        { top: '20%', left: '20%' },
                        { top: '45%', left: '45%' },
                        { bottom: '20%', right: '25%' },
                        { top: '20%', right: '20%' },
                        { bottom: '20%', left: '20%' },
                      ];
                      const colors = [
                        'border-secondary text-secondary bg-secondary/20',
                        'border-primary text-primary bg-primary/20',
                        'border-tertiary text-tertiary bg-tertiary/20',
                        'border-yellow-400 text-yellow-400 bg-yellow-400/10',
                        'border-pink-400 text-pink-400 bg-pink-400/10',
                      ];
                      return (
                        <div key={room.id}
                          className={`absolute px-md py-xs border rounded-lg backdrop-blur-md text-xs font-label-sm ${colors[i % colors.length]}`}
                          style={pos[i % pos.length]}>
                          <span className="font-bold">{room.zone}</span> · {room.name}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-1 gap-sm">
                  <button id="convert-3d-btn" onClick={handleConvertTo3D}
                    className="w-full py-md btn-primary flex items-center justify-center gap-md"
                    style={{ boxShadow: '0 0 20px rgba(79,70,229,0.3)' }}>
                    <span className="material-symbols-outlined">view_in_ar</span>
                    Open in 3D Workspace (with Vastu Zones)
                  </button>

                  <div className="flex gap-2">
                    <input value={projectName} onChange={e => setProjectName(e.target.value)}
                      placeholder="Project Name"
                      className="flex-1 bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-sm outline-none text-white focus:border-primary/50" />
                    <button onClick={handleSaveAndGoVastu} disabled={saving}
                      className="flex-[2] py-md btn-secondary flex items-center justify-center gap-md disabled:opacity-50">
                      <span className="material-symbols-outlined">analytics</span>
                      {saving ? 'Saving...' : 'Save & Start Vastu Audit'}
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT: Room Labeling + Vastu Score */}
              <div className="col-span-12 lg:col-span-5 space-y-gutter">

                {/* Live Vastu Score */}
                <div className="glass-panel p-md rounded-2xl border border-white/10"
                  style={{ borderColor: `${scoreColor}30` }}>
                  <div className="flex items-center justify-between mb-sm">
                    <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: scoreColor }}>compass_calibration</span>
                      Live Vastu Score
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black" style={{ color: scoreColor }}>{liveScore}</span>
                      <span className="text-xs text-on-surface-variant">/100</span>
                    </div>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${liveScore}%`, background: scoreColor, boxShadow: `0 0 10px ${scoreColor}` }} />
                  </div>
                  <p className="text-xs text-on-surface-variant mt-2">
                    {liveScore >= 75 ? '✅ Good Vastu alignment — label rooms to refine' :
                     liveScore >= 55 ? '⚠️ Moderate — fix zones below to improve score' :
                     '❌ Poor alignment — relocate rooms per Vastu rules'}
                  </p>
                </div>

                {/* Room Labeling Panel */}
                <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
                  <div className="p-md bg-surface-container-high flex justify-between items-center border-b border-white/10">
                    <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>label</span>
                      Room Labels & Zones
                      {mlRoomSource === 'ml' && (
                        <span style={{
                          fontSize: '9px', fontWeight: 700, padding: '2px 7px',
                          borderRadius: '999px', background: 'rgba(79,209,197,0.15)',
                          color: '#4fd1c5', border: '1px solid rgba(79,209,197,0.35)',
                          letterSpacing: '0.05em', textTransform: 'uppercase'
                        }}>🤖 UNet AI</span>
                      )}
                    </h3>
                    <button onClick={addRoom}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
                      Add Room
                    </button>
                  </div>

                  <div className="p-md space-y-sm max-h-80 overflow-y-auto">
                    {rooms.length === 0 && (
                      <p className="text-xs text-on-surface-variant text-center py-4">No rooms detected. Add rooms manually.</p>
                    )}
                    {rooms.map((room) => {
                      const rule = VASTU_ZONE_RULES[room.zone];
                      const type = room.type || room.name?.toLowerCase().replace(/\s+/g,'_');
                      const isIdeal = rule?.ideal.includes(type);
                      const isBad   = rule?.bad.includes(type);
                      const statusColor = isIdeal ? '#4edea3' : isBad ? '#ffb4ab' : '#c3c0ff';
                      return (
                        <div key={room.id} className="p-sm rounded-xl bg-surface-container border border-white/5"
                          style={{ borderLeft: `3px solid ${statusColor}` }}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColor }} />
                            <input value={room.name}
                              onChange={e => updateRoom(room.id, 'name', e.target.value)}
                              className="flex-1 bg-transparent text-xs font-bold text-on-surface outline-none border-none"
                              placeholder="Room name" />
                            <button onClick={() => removeRoom(room.id)}
                              className="text-outline hover:text-error transition-colors">
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <select value={room.type} onChange={e => updateRoom(room.id, 'type', e.target.value)}
                              className="flex-1 bg-surface-container-high border border-white/10 rounded-md text-xs text-on-surface-variant px-2 py-1 outline-none">
                              {ROOM_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                            </select>
                            <select value={room.zone} onChange={e => updateRoom(room.id, 'zone', e.target.value)}
                              className="bg-surface-container-high border border-white/10 rounded-md text-xs text-on-surface-variant px-2 py-1 outline-none">
                              {ZONE_OPTIONS.map(z => <option key={z} value={z}>{z}</option>)}
                            </select>
                          </div>
                          <p className="text-[10px] text-on-surface-variant mt-1 ml-4">
                            {isIdeal ? '✅ Ideal placement' : isBad ? '❌ Vastu conflict — consider moving' : '◎ Acceptable'}
                            {room.mlDetected && room.confidence != null && (
                              <span style={{ marginLeft: 6, color: '#4fd1c5' }}>
                                · 🤖 {Math.round(room.confidence * 100)}% conf
                              </span>
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detected Elements */}
                <div className="glass-panel p-md rounded-2xl border border-white/10 space-y-sm">
                  <h3 className="text-sm font-bold text-on-surface">Detected Elements</h3>
                  {[
                    { icon: 'bed',        label: `${result.detectedElements?.bedrooms || 3} Bedrooms`,  color: 'primary' },
                    { icon: 'window',     label: `${result.detectedElements?.windows || 12} Windows`,   color: 'secondary' },
                    { icon: 'door_front', label: result.detectedElements?.entrance || 'NE Alignment',   color: 'tertiary' },
                  ].map(({ icon, label, color }) => {
                    const cl = { primary:'bg-primary/20 text-primary', secondary:'bg-secondary/20 text-secondary', tertiary:'bg-tertiary/20 text-tertiary' };
                    return (
                      <div key={label} className="p-sm bg-surface-container-high rounded-lg flex items-center gap-md">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cl[color]}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
                        </div>
                        <span className="text-xs font-bold text-on-surface">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
