const mongoose = require('mongoose');

const labSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lab name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    components: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Component',
      },
    ],
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Lab manager is required'],
    },
    assistants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Lab', labSchema);
