import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';

// Load env
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

// Routes
import authRoutes    from './routes/auth.js';
import projectsRoutes from './routes/projects.js';
import vastuRoutes   from './routes/vastu.js';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vastuvision';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Middleware ────────────────────────────────────────────
app.use(cors({
  origin: [
    FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://vastuvision-main.vercel.app',
    'https://vastuvision-3d.vercel.app',
    /\.vercel\.app$/,  // allow all vercel preview URLs
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],

}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request Logger (dev) ──────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ── Routes ────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'VastuVision API is running ✓', time: new Date() });
});

app.use('/api/auth',     authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/vastu',    vastuRoutes);

// Blueprint proxy → Python ML API at :8000
// Uses multer to accept the uploaded image, then forwards to FastAPI
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

app.post('/api/blueprint/analyze', upload.single('blueprint'), async (req, res) => {
  const jobId = `job_${Date.now()}`;

  // Demo room labels always returned
  const demoMeta = {
    jobId,
    rooms: [
      { name: 'Bedroom 01',  type: 'bedroom', direction: 'SW', vastu: 'optimal' },
      { name: 'Living Room', type: 'living',  direction: 'N',  vastu: 'good'    },
      { name: 'Kitchen',     type: 'kitchen', direction: 'SE', vastu: 'optimal' },
    ],
    detectedElements: {
      bedrooms: 3, windows: 12, doors: 4, entrance: 'North-East Alignment',
    },
  };

  // ── Try to forward image to the Python ML API ──────────
  if (req.file) {
    try {
      const fd = new FormData();
      fd.append('file', req.file.buffer, {
        filename: req.file.originalname || 'blueprint.png',
        contentType: req.file.mimetype || 'image/png',
      });

      const mlRes = await axios.post(`${ML_API_URL}/predict-walls/`, fd, {
        headers: fd.getHeaders(),
        timeout: 60000,          // ML inference can take a while
      });

      const wallData = mlRes.data?.['3d_coordinates'] || [];

      return res.json({
        success: true,
        source: 'ml',
        ...demoMeta,
        coordinates: { walls: wallData },   // [{start:[x,y], end:[x,y]}, ...]
      });
    } catch (mlErr) {
      console.warn('⚠️  ML API unavailable:', mlErr.message, '— returning demo walls');
    }
  }

  // ── Fallback: realistic demo wall coordinates ──────────
  // Represents a standard 3-room plan in 512×512 pixel space
  res.json({
    success: true,
    source: 'demo',
    ...demoMeta,
    coordinates: {
      walls: [
        // Outer boundary
        { start: [40,  40],  end: [470, 40]  },
        { start: [470, 40],  end: [470, 470] },
        { start: [470, 470], end: [40,  470] },
        { start: [40,  470], end: [40,  40]  },
        // Bedroom 1 divider (left third)
        { start: [185, 40],  end: [185, 250] },
        // Bedroom 2 divider (right third)
        { start: [330, 40],  end: [330, 250] },
        // Horizontal separator (bedrooms vs living)
        { start: [40,  250], end: [470, 250] },
        // Kitchen vs Living (right side)
        { start: [300, 250], end: [300, 470] },
        // Bathroom nook
        { start: [185, 250], end: [185, 330] },
        { start: [40,  330], end: [185, 330] },
      ],
    },
  });
});

// ── 404 handler ───────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Global error handler ──────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

// ── Connect to MongoDB and start server ───────────────────
async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected: ${MONGODB_URI}`);

    app.listen(PORT, () => {
      console.log(`\n🚀 VastuVision API running at http://localhost:${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('\n⚠️  Trying to start server without DB (auth will not work)...');

    // Still start the server so other routes work
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT} (no DB)`);
    });
  }
}

startServer();
