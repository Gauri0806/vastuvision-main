import mongoose from 'mongoose';

const vastuDetailSchema = new mongoose.Schema({
  room:    String,
  type:    String,
  zone:    String,
  element: String,
  status:  { type: String, enum: ['ideal', 'acceptable', 'conflict'] },
  message: String,
}, { _id: false });

const roomSchema = new mongoose.Schema({
  name:  String,
  zone:  String,   // N, NE, E, SE, S, SW, W, NW, C
  cx:    Number,   // pixel center x (0-512)
  cy:    Number,   // pixel center y (0-512)
  color: String,
}, { _id: false });

const wallSchema = new mongoose.Schema({
  start: [Number],  // [x, y]
  end:   [Number],  // [x, y]
}, { _id: false });

const projectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Name too long'],
      default: 'Untitled Project',
    },
    status: {
      type: String,
      enum: ['draft', 'in-progress', 'analyzed', 'completed'],
      default: 'draft',
    },
    houseType: {
      type: String,
      enum: ['1bhk', '2bhk', '3bhk', 'villa', 'raw', 'custom', ''],
      default: '',
    },
    tags: [String],

    // Blueprint & ML data
    blueprintImageUrl: { type: String, default: '' },
    blueprintWalls:    [wallSchema],   // ML-detected wall segments
    rooms:             [roomSchema],   // Room labels with zone assignments

    // Vastu Analysis Results
    vastuData: {
      score:           { type: Number, default: null },
      label:           { type: String, default: '' },
      correct:         [mongoose.Schema.Types.Mixed],
      conflicts:       [mongoose.Schema.Types.Mixed],
      recommendations: [mongoose.Schema.Types.Mixed],
      zoneDetails:     [vastuDetailSchema],
      analysisDate:    Date,
      fixesApplied:    { type: Boolean, default: false },
      fixDate:         Date,
    },

    // 3D workspace state (JSON string to avoid complex schema)
    workspace3D: {
      walls:     [mongoose.Schema.Types.Mixed],
      furniture: [mongoose.Schema.Types.Mixed],
      wallColor: String,
      floorColor: String,
      floorPattern: String,
      roomLabels: [mongoose.Schema.Types.Mixed],
      vastuRooms: [mongoose.Schema.Types.Mixed],
      blueprintTransform: mongoose.Schema.Types.Mixed,
    },

    // Thumbnail (base64 or URL)
    thumbnail: { type: String, default: '' },

    description: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Virtual: has vastu data?
projectSchema.virtual('hasVastu').get(function () {
  return this.vastuData?.score != null;
});

const Project = mongoose.model('Project', projectSchema);
export default Project;
