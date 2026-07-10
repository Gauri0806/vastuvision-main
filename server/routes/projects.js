import express from 'express';
import Project from '../models/Project.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require login
router.use(protect);

// ── GET /api/projects ──────────────────────────────────────────
// List user's projects with real stats
router.get('/', async (req, res) => {
  try {
    const { limit = 20, page = 1, status } = req.query;
    const filter = { owner: req.user._id };
    if (status) filter.status = status;

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort({ updatedAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .select('-workspace3D'),   // exclude heavy 3D data from list
      Project.countDocuments(filter),
    ]);

    // Real stats
    const stats = {
      total,
      analyzed:   await Project.countDocuments({ owner: req.user._id, status: 'analyzed' }),
      completed:  await Project.countDocuments({ owner: req.user._id, status: 'completed' }),
      withVastu:  await Project.countDocuments({ owner: req.user._id, 'vastuData.score': { $ne: null } }),
      layouts:    await Project.countDocuments({ owner: req.user._id, houseType: { $ne: '' } }),
    };

    return res.json({ success: true, projects, stats, total, page: Number(page) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/projects ─────────────────────────────────────────
// Create new project
router.post('/', async (req, res) => {
  try {
    const { name, houseType, tags, description } = req.body;
    const project = await Project.create({
      owner:    req.user._id,
      name:     name || 'Untitled Project',
      houseType: houseType || '',
      tags:     tags || [],
      description: description || '',
      status:   'draft',
    });
    return res.status(201).json({ success: true, project });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ── GET /api/projects/:id ──────────────────────────────────────
// Get single project with full data (including 3D state)
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    return res.json({ success: true, project });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/projects/:id ──────────────────────────────────────
// Update project (name, status, rooms, walls, 3D state, vastu, thumbnail)
router.put('/:id', async (req, res) => {
  try {
    const allowed = ['name', 'status', 'houseType', 'tags', 'description',
                     'blueprintWalls', 'rooms', 'vastuData', 'workspace3D',
                     'thumbnail', 'blueprintImageUrl'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      update,
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    return res.json({ success: true, project });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/projects/:id ───────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    return res.json({ success: true, message: 'Project deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/projects/:id/workspace ─────────────────────────
// Save 3D workspace state (walls, furniture, colors)
router.patch('/:id/workspace', async (req, res) => {
  try {
    const { walls, furniture, wallColor, floorColor, floorPattern, roomLabels, vastuRooms, blueprintTransform } = req.body;
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { workspace3D: { walls, furniture, wallColor, floorColor, floorPattern, roomLabels, vastuRooms, blueprintTransform }, status: 'in-progress' },
      { new: true }
    );
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    return res.json({ success: true, message: 'Workspace saved.', project });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
