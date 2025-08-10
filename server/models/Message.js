const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // WhatsApp message ID
  id: {
    type: String,
    required: true,
    unique: true
  },
  
  // Meta message ID for status updates
  meta_msg_id: {
    type: String,
    required: true
  },
  
  // WhatsApp user ID
  wa_id: {
    type: String,
    required: true,
    index: true
  },
  
  // User name
  name: {
    type: String,
    required: true
  },
  
  // Message content
  text: {
    body: {
      type: String,
      required: true
    }
  },
  
  // Message type
  type: {
    type: String,
    default: 'text'
  },
  
  // Message status: sent, delivered, read
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  
  // Message direction: in or out
  direction: {
    type: String,
    enum: ['in', 'out'],
    required: true
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  // Conversation ID (for grouping messages)
  conversationId: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Create compound index for efficient querying
messageSchema.index({ wa_id: 1, timestamp: -1 });
messageSchema.index({ conversationId: 1, timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema); 