const mongoose = require('mongoose');

// Stores every token that was ever generated — for audit trail
const tokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    facilityCode: {
      type: Number,
      required: true,
    },
    accessCode: {
      type: Number,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    employeeEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    generatedByEmail: {
      type: String,
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