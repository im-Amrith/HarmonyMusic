const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  },
  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album'
  },
  duration: {
    type: Number,  // Duration in seconds
    required: true
  },
  releaseDate: {
    type: Date,
    required: true
  },
  coverImage: {
    type: String,
    default: 'default-cover.jpg'
  },
  audioFile: {
    type: String,
    required: true
  },
  genre: [{
    type: String,
    required: true
  }],
  lyrics: {
    type: String,
    default: ''
  },
  playCount: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  features: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist'
  }],
  isExplicit: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for formatted duration (mm:ss)
SongSchema.virtual('formattedDuration').get(function() {
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
});

// Index for search functionality
SongSchema.index({ title: 'text', genre: 'text' });

module.exports = mongoose.model('Song', SongSchema);
