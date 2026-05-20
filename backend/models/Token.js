const mongoose = require('mongoose');

// Stores every token that was ever generated — for audit trail
const tokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
    },
    facilityCode: {
      type: Number,
      required: true,
    },
    accessCode: {
      type: Number,
      required: true,
    },
    employeeEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',   // which admin generated this
      required: true,
    },
    generatedByEmail: {
      type: String,  // stored flat for easy display in logs
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      default: 'sent',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Token', tokenSchema);
