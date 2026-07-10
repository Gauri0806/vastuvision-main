import { computeVastuScore, getZoneInfo, ZONE_RULES } from '../utils/vastuEngine.js';
import Project from '../models/Project.js';

// ── POST /api/vastu/analyze ────────────────────────────────────
// Body: { rooms: [{name, zone}], projectId? }
export async function analyzeVastu(req, res) {
  try {
    const { rooms = [], projectId, blueprintWalls = [] } = req.body;

    if (!rooms.length) {
      return res.status(400).json({ success: false, message: 'No rooms provided for analysis.' });
    }

    const result = computeVastuScore(rooms);

    // Attach zone info for frontend display
    result.zoneMap = getZoneInfo();
    result.analysisDate = new Date();
    result.roomCount = rooms.length;

    // Save to project if ID provided
    if (projectId && req.user) {
      await Project.findOneAndUpdate(
        { _id: projectId, owner: req.user._id },
        {
          vastuData: {
            score:          result.score,
            label:          result.label,
            correct:        result.correct,
            conflicts:      result.conflicts,
            recommendations: result.recommendations,
            zoneDetails:    result.zoneDetails,
            rooms,
            analysisDate:   result.analysisDate,
          },
          blueprintWalls,
          status: 'analyzed',
        },
        { new: true }
      );
    }

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[vastuController] analyzeVastu error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/vastu/zones ───────────────────────────────────────
// Returns all 8 zone definitions for the frontend
export async function getZones(req, res) {
  try {
    return res.json({ success: true, zones: getZoneInfo() });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/vastu/project/:id ────────────────────────────────
// Get vastu data for a specific saved project
export async function getProjectVastu(req, res) {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    if (!project.vastuData?.score) {
      return res.json({ success: true, vastuData: null, message: 'No vastu analysis yet for this project.' });
    }

    return res.json({ success: true, vastuData: project.vastuData, project: { name: project.name, _id: project._id } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/vastu/:id/apply-fixes ───────────────────────────
// Simulate applying AI fixes: recompute with suggested zones
export async function applyFixes(req, res) {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user?._id }).catch(() => null);
    const { rooms = [] } = req.body;

    // Re-run with corrected rooms (frontend sends corrected room-zone pairs)
    const result = computeVastuScore(rooms.length ? rooms : []);

    if (project) {
      project.vastuData = {
        ...project.vastuData,
        score: result.score,
        label: result.label,
        correct: result.correct,
        conflicts: result.conflicts,
        recommendations: result.recommendations,
        fixesApplied: true,
        fixDate: new Date(),
      };
      await project.save();
    }

    return res.json({ success: true, ...result, fixesApplied: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
