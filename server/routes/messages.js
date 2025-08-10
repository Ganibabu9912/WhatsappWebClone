const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Get all conversations (grouped by user)
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $group: {
          _id: '$wa_id',
          name: { $first: '$name' },
          lastMessage: { $first: '$text.body' },
          lastMessageTime: { $first: '$timestamp' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$direction', 'in'] }, { $ne: ['$status', 'read'] }] },
                1,
                0
              ]
            }
          },
          messageCount: { $sum: 1 }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a specific conversation
router.get('/conversation/:wa_id', async (req, res) => {
  try {
    const { wa_id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (page - 1) * limit;

    const messages = await Message.find({ wa_id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    // Mark incoming messages as read
    await Message.updateMany(
      { wa_id, direction: 'in', status: { $ne: 'read' } },
      { status: 'read' }
    );

    res.json(messages.reverse()); // Return in chronological order
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a new message (demo)
router.post('/send', async (req, res) => {
  try {
    const { wa_id, name, text } = req.body;

    if (!wa_id || !text) {
      return res.status(400).json({ error: 'wa_id and text are required' });
    }

    const messageData = {
      id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      meta_msg_id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      wa_id,
      name: name || 'You',
      text: { body: text },
      type: 'text',
      status: 'sent',
      direction: 'out',
      timestamp: new Date(),
      conversationId: wa_id
    };

    const newMessage = await Message.create(messageData);
    console.log('Demo message sent:', newMessage.id);

    // Simulate WhatsApp message status flow
    setTimeout(async () => {
      try {
        // Update to "delivered" after 2 seconds
        await Message.findByIdAndUpdate(newMessage._id, { status: 'delivered' });
        console.log(`Message ${newMessage.id} status updated to delivered`);
        
        // Update to "read" after another 3 seconds (total 5 seconds)
        setTimeout(async () => {
          try {
            await Message.findByIdAndUpdate(newMessage._id, { status: 'read' });
            console.log(`Message ${newMessage.id} status updated to read`);
          } catch (error) {
            console.error('Error updating message status to read:', error);
          }
        }, 3000);
      } catch (error) {
        console.error('Error updating message status to delivered:', error);
      }
    }, 2000);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get message status updates for a specific conversation
router.get('/status-updates/:wa_id', async (req, res) => {
  try {
    const { wa_id } = req.params;
    const { lastUpdate } = req.query;
    
    const query = { wa_id, direction: 'out' };
    if (lastUpdate) {
      query.updatedAt = { $gt: new Date(lastUpdate) };
    }
    
    const statusUpdates = await Message.find(query)
      .select('id status updatedAt')
      .sort({ updatedAt: -1 });
    
    res.json(statusUpdates);
  } catch (error) {
    console.error('Error fetching status updates:', error);
    res.status(500).json({ error: 'Failed to fetch status updates' });
  }
});

// Get message statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Message.aggregate([
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          totalConversations: { $distinct: '$wa_id' },
          messagesByStatus: {
            $push: '$status'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalMessages: 1,
          totalConversations: { $size: '$totalConversations' },
          sentCount: {
            $size: {
              $filter: {
                input: '$messagesByStatus',
                cond: { $eq: ['$$this', 'sent'] }
              }
            }
          },
          deliveredCount: {
            $size: {
              $filter: {
                input: '$messagesByStatus',
                cond: { $eq: ['$$this', 'delivered'] }
              }
            }
          },
          readCount: {
            $size: {
              $filter: {
                input: '$messagesByStatus',
                cond: { $eq: ['$$this', 'read'] }
              }
            }
          }
        }
      }
    ]);

    res.json(stats[0] || {
      totalMessages: 0,
      totalConversations: 0,
      sentCount: 0,
      deliveredCount: 0,
      readCount: 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router; 