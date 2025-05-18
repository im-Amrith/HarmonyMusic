const mongoose = require('mongoose');

const PlaylistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  coverImage: {
    type: String,
    default: 'default-playlist.jpg'
  },
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    }
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  likes: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String
  }],
  totalDuration: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual for formatted total duration (hh:mm:ss)
PlaylistSchema.virtual('formattedTotalDuration').get(function() {
  const hours = Math.floor(this.totalDuration / 3600);
  const minutes = Math.floor((this.totalDuration % 3600) / 60);
  const seconds = this.totalDuration % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  } else {
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
});

// Index for search functionality
PlaylistSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Playlist', PlaylistSchema);
