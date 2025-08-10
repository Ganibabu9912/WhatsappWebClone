const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const Message = require('../models/Message');

// Get all contacts with conversation summary
router.get('/', async (req, res) => {
  try {
    const { search, archived, blocked, pinned } = req.query;
    
    // Build filter object
    const filter = {};
    if (archived !== undefined) filter.isArchived = archived === 'true';
    if (blocked !== undefined) filter.isBlocked = blocked === 'true';
    if (pinned !== undefined) filter.isPinned = pinned === 'true';
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }
    
    const contacts = await Contact.find(filter)
      .sort({ isPinned: -1, lastSeen: -1, name: 1 })
      .select('-__v');
    
    // Get conversation summary for each contact
    const contactsWithSummary = await Promise.all(
      contacts.map(async (contact) => {
        const lastMessage = await Message.findOne({ wa_id: contact.wa_id })
          .sort({ timestamp: -1 })
          .select('text.body timestamp status direction');
        
        const unreadCount = await Message.countDocuments({
          wa_id: contact.wa_id,
          direction: 'in',
          status: { $ne: 'read' }
        });
        
        return {
          ...contact.toObject(),
          lastMessage: lastMessage ? lastMessage.text.body : null,
          lastMessageTime: lastMessage ? lastMessage.timestamp : null,
          unreadCount
        };
      })
    );
    
    // Sort contacts by last message time (most recent first)
    contactsWithSummary.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      
      // If both have messages, sort by message time
      if (timeA > 0 && timeB > 0) {
        return timeB - timeA; // Most recent first
      }
      
      // If only one has messages, prioritize the one with messages
      if (timeA > 0 && timeB === 0) return -1;
      if (timeA === 0 && timeB > 0) return 1;
      
      // If neither has messages, sort by creation time
      const createdAtA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createdAtB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return createdAtB - createdAtA;
    });
    
    res.json(contactsWithSummary);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Get a specific contact by wa_id
router.get('/:wa_id', async (req, res) => {
  try {
    const { wa_id } = req.params;
    const contact = await Contact.findOne({ wa_id }).select('-__v');
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// Create a new contact
router.post('/', async (req, res) => {
  try {
    const { wa_id, name, profilePicture, notes, labels } = req.body;
    
    if (!wa_id || !name) {
      return res.status(400).json({ error: 'wa_id and name are required' });
    }
    
    // Check if contact already exists
    const existingContact = await Contact.findOne({ wa_id });
    if (existingContact) {
      return res.status(409).json({ error: 'Contact already exists' });
    }
    
    const contactData = {
      wa_id,
      name,
      profilePicture,
      notes,
      labels
    };
    
    const newContact = await Contact.create(contactData);
    res.status(201).json(newContact);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// Update a contact
router.put('/:wa_id', async (req, res) => {
  try {
    const { wa_id } = req.params;
    const updateData = req.body;
    
    // Remove wa_id from update data to prevent changing the unique identifier
    delete updateData.wa_id;
    
    const updatedContact = await Contact.findOneAndUpdate(
      { wa_id },
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!updatedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// Delete a contact
router.delete('/:wa_id', async (req, res) => {
  try {
    const { wa_id } = req.params;
    
    // Check if contact exists
    const contact = await Contact.findOne({ wa_id });
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    // Delete contact and all associated messages
    await Promise.all([
      Contact.deleteOne({ wa_id }),
      Message.deleteMany({ wa_id })
    ]);
    
    res.json({ message: 'Contact and messages deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// Toggle contact status (archive, block, pin, mute)
router.patch('/:wa_id/toggle/:action', async (req, res) => {
  try {
    const { wa_id, action } = req.params;
    const { value, muteUntil } = req.body;
    
    let updateData = {};
    
    switch (action) {
      case 'archive':
        updateData.isArchived = value;
        break;
      case 'block':
        updateData.isBlocked = value;
        break;
      case 'pin':
        updateData.isPinned = value;
        break;
      case 'mute':
        updateData.isMuted = value;
        if (muteUntil) updateData.muteUntil = muteUntil;
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    const updatedContact = await Contact.findOneAndUpdate(
      { wa_id },
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!updatedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(updatedContact);
  } catch (error) {
    console.error('Error toggling contact status:', error);
    res.status(500).json({ error: 'Failed to toggle contact status' });
  }
});

// Update contact status (online/offline/last seen)
router.patch('/:wa_id/status', async (req, res) => {
  try {
    const { wa_id } = req.params;
    const { status, lastSeen } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const updateData = { status };
    if (lastSeen) updateData.lastSeen = lastSeen;
    
    const updatedContact = await Contact.findOneAndUpdate(
      { wa_id },
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!updatedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(updatedContact);
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({ error: 'Failed to update contact status' });
  }
});

// Demo endpoint to simulate contact coming online
router.post('/demo/online/:wa_id', async (req, res) => {
  try {
    const { wa_id } = req.params;
    
    const updatedContact = await Contact.findOneAndUpdate(
      { wa_id },
      { 
        status: 'online',
        lastSeen: null
      },
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!updatedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(updatedContact);
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({ error: 'Failed to update contact status' });
  }
});

// Demo endpoint to simulate contact going offline
router.post('/demo/offline/:wa_id', async (req, res) => {
  try {
    const { wa_id } = req.params;
    
    const updatedContact = await Contact.findOneAndUpdate(
      { wa_id },
      { 
        status: 'last seen',
        lastSeen: new Date()
      },
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!updatedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(updatedContact);
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({ error: 'Failed to update contact status' });
  }
});

module.exports = router;
