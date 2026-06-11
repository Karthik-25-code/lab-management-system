const mongoose = require('mongoose');

const labCompletionRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecture',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    daStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    teacherStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    requestedVerifierIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    actionedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Verifier who approved/rejected (final verifier)
    },
    daActionedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    teacherActionedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    adminActionedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Allow only one active pending request per student per lecture
labCompletionRequestSchema.index({ studentId: 1, lectureId: 1, status: 1 });

module.exports = mongoose.model('LabCompletionRequest', labCompletionRequestSchema);
