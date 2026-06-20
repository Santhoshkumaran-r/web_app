const mongoose = require('mongoose');

const emailConfigSchema = new mongoose.Schema(
  {
    // null = system-wide admin config
    // ObjectId = vendor or user specific config
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    ownerRole: {
      type: String,
      enum: ['admin', 'vendor', 'user'],
      default: 'admin',
    },

    provider: {
      type: String,
      enum: ['gmail', 'zoho', 'outlook'],
      default: 'gmail',
    },

    smtpUser:   { type: String,  default: '' },
    smtpPass:   { type: String,  default: '' },
    smtpHost:   { type: String,  default: '' },
    smtpPort:   { type: Number,  default: 587 },
    smtpSecure: { type: Boolean, default: false },

    fromName:  { type: String,  default: 'EI RFID Solutions' },
    fromEmail: { type: String,  default: '' },
    isEnabled: { type: Boolean, default: false },

    lastTestedAt:   { type: Date,   default: null },
    lastTestStatus: { type: String, enum: ['success', 'failed', 'never'], default: 'never' },
    lastTestError:  { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailConfig', emailConfigSchema);