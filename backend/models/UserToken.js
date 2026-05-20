const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  token:            { type: String, required: true },
  facilityCode:     { type: Number, required: true },
  accessCode:       { type: Number, required: true },
  employeeEmail:    { type: String, required: true, lowercase: true, trim: true },
  generatedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  generatedByEmail: { type: String },
  sentAt:           { type: Date, default: Date.now },
  status:           { type: String, enum: ['sent', 'failed'], default: 'sent' },
}, { timestamps: true, collection: 'usertokens' }); // ← explicit collection name

module.exports = mongoose.model('UserToken', tokenSchema);
