const mongoose = require('mongoose');

const ArtistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  bio: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: 'default-artist.jpg'
  },
  genres: [{
    type: String
  }],
  socialLinks: {
    website: String,
    instagram: String,
    twitter: String,
    facebook: String,
    youtube: String
  },
  monthlyListeners: {
    type: Number,
    default: 0
  },
  albums: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album'
  }],
  topSongs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for search functionality
ArtistSchema.index({ name: 'text', genres: 'text' });

module.exports = mongoose.model('Artist', ArtistSchema);
