import express from 'express';
import { analyzeVastu, getZones, getProjectVastu, applyFixes } from '../controllers/vastuController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public zone info
router.get('/zones', getZones);

// Protected routes (require login)
router.post('/analyze', protect, analyzeVastu);
router.get('/project/:id', protect, getProjectVastu);
router.post('/:id/apply-fixes', protect, applyFixes);

// Legacy route kept for backwards compat
router.get('/:id', protect, getProjectVastu);

export default router;
