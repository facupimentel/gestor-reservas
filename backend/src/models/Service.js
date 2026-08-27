const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    duration: {
      // duración en minutos
      type: Number,
      required: true,
      min: 5,
    },
    price: { type: Number, required: true, min: 0, default: 0 },
    color: { type: String, default: '#20303A' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
