const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  // WhatsApp user ID (unique identifier)
  wa_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Contact name
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  // Profile picture URL (optional)
  profilePicture: {
    type: String,
    default: null
  },
  
  // Contact status (online, offline, last seen)
  status: {
    type: String,
    enum: ['online', 'offline', 'last seen'],
    default: 'offline'
  },
  
  // Last seen timestamp
  lastSeen: {
    type: Date,
    default: null
  },
  
  // Contact is archived or not
  isArchived: {
    type: Boolean,
    default: false
  },
  
  // Contact is blocked or not
  isBlocked: {
    type: Boolean,
    default: false
  },
  
  // Contact is pinned or not
  isPinned: {
    type: Boolean,
    default: false
  },
  
  // Contact is muted or not
  isMuted: {
    type: Boolean,
    default: false
  },
  
  // Mute until timestamp
  muteUntil: {
    type: Date,
    default: null
  },
  
  // Contact notes
  notes: {
    type: String,
    default: ''
  },
  
  // Contact labels/tags
  labels: [{
    type: String,
    trim: true
  }],
  
  // Last message content
  lastMessage: {
    type: String,
    default: ''
  },
  
  // Last message timestamp
  lastMessageTime: {
    type: Date,
    default: null
  },
  
  // Contact metadata
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
contactSchema.index({ name: 'text' }); // Text search on name
contactSchema.index({ isArchived: 1, isBlocked: 1 });
contactSchema.index({ isPinned: 1, lastSeen: -1 });

// Virtual for contact initials
contactSchema.virtual('initials').get(function() {
  if (!this.name) return '?';
  return this.name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

// Ensure virtual fields are serialized
contactSchema.set('toJSON', { virtuals: true });
contactSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Contact', contactSchema);
