const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Target User ID is required'],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null indicates automatic system adjustments (e.g. automatic fines on return)
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
    },
    type: {
      type: String,
      enum: ['topup', 'fine', 'refund', 'adjustment'],
      required: [true, 'Transaction type is required'],
    },
    previousBalance: {
      type: Number,
      required: [true, 'Previous balance is required'],
    },
    newBalance: {
      type: Number,
      required: [true, 'New balance is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
