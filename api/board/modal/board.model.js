import mongoose from 'mongoose';
const { Schema } = mongoose;

// Activity Schema
const activitySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['create', 'update', 'delete'], required: true },
  entity: { type: String, enum: ['board', 'group', 'task', 'comment'], required: true },
  entityId: { type: Schema.Types.ObjectId, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Comment Schema
const commentSchema = new Schema({
  title: { type: String },
  createdAt: { type: Date, default: Date.now },
  byMember: {
    _id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fullname: { type: String, required: true }
  },
  activities: [activitySchema] // Activity log for comments
});

// Task Schema
const taskSchema = new Schema({
  title: { type: String, required: true },
  archivedAt: { type: Date, default: null },
  status: { type: String, required: true },
  priority: { type: String, required: true },
  dueDate: { type: Date, default: null },
  description: { type: String, default: null },
  comments: [commentSchema],
  activities: [activitySchema], // Activity log for tasks
  checklists: [Schema.Types.Mixed],
  memberIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  byMember: { type: Schema.Types.ObjectId, ref: 'User' },
  style: { type: Schema.Types.Mixed }
});

// Group Schema
const groupSchema = new Schema({
  title: { type: String, required: true },
  archivedAt: { type: Date, default: null },
  style: {
    backgroundColor: { type: String, default: '#FFFFFF' }
  },
  tasks: [taskSchema],
  activities: [activitySchema], // Activity log for groups
  createdBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

// Board Schema
const boardSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  isStarred: { type: Boolean, default: false },
  archivedAt: { type: Date, default: null },
  createdBy: {
    _id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true },
    fullname: { type: String, required: true },
    isAdmin: { type: Boolean, default: null }
  },
  label: { type: String, default: 'Items' },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  groups: [groupSchema],
  activities: [activitySchema], // Activity log for boards
  cmpsOrder: [{ type: String }]
});

// Create and export the Board model
const Board = mongoose.model('Board', boardSchema);

export default Board;
