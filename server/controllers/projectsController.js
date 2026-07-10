import Project from '../models/Project.js';

// GET /api/projects
export async function getAllProjects(req, res) {
  try {
    const projects = await Project.find({ owner: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(Number(req.query.limit) || 50);
    res.json({ success: true, projects, total: projects.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// GET /api/projects/:id
export async function getProjectById(req, res) {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// POST /api/projects
export async function createProject(req, res) {
  try {
    const { name, houseType, rooms, status, tags, description } = req.body;
    const project = await Project.create({
      owner: req.user._id,
      name: name || 'Untitled Project',
      houseType,
      rooms,
      status: status || 'in-progress',
      tags: tags || [],
      description,
    });
    res.status(201).json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// PUT /api/projects/:id
export async function updateProject(req, res) {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// DELETE /api/projects/:id
export async function deleteProject(req, res) {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    res.json({ success: true, message: 'Project deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// POST /api/projects/:id/models
export async function saveModel(req, res) {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    project.models.push({ name: req.body.name || 'Model', data: req.body });
    await project.save();
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}
