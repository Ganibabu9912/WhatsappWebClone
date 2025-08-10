const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Webhook verification endpoint
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Replace with your actual verify token
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'your_verify_token';

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Webhook endpoint for receiving messages and status updates
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    console.log('Webhook payload received:', JSON.stringify(body, null, 2));

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry[0];
      const changes = entry.changes[0];
      const value = changes.value;

      // Handle messages
      if (value.messages && value.messages.length > 0) {
        for (const message of value.messages) {
          await processIncomingMessage(message, value.metadata);
        }
      }

      // Handle status updates
      if (value.statuses && value.statuses.length > 0) {
        for (const status of value.statuses) {
          await processStatusUpdate(status);
        }
      }

      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.sendStatus(500);
  }
});

// Process incoming messages
async function processIncomingMessage(message, metadata) {
  try {
    const messageData = {
      id: message.id,
      meta_msg_id: message.id, // Using message ID as meta_msg_id for incoming messages
      wa_id: message.from,
      name: metadata.display_phone_number || 'Unknown User',
      text: {
        body: message.text?.body || 'Unsupported message type'
      },
      type: message.type || 'text',
      status: 'delivered', // Incoming messages are considered delivered
      direction: 'in',
      timestamp: new Date(parseInt(message.timestamp) * 1000),
      conversationId: message.from
    };

    // Check if message already exists
    const existingMessage = await Message.findOne({ id: message.id });
    if (!existingMessage) {
      await Message.create(messageData);
      console.log('New message saved:', message.id);
    }
  } catch (error) {
    console.error('Error processing incoming message:', error);
  }
}

// Process status updates
async function processStatusUpdate(status) {
  try {
    const updateData = {
      status: status.status,
      timestamp: new Date(parseInt(status.timestamp) * 1000)
    };

    // Update message status using meta_msg_id
    const result = await Message.findOneAndUpdate(
      { meta_msg_id: status.id },
      updateData,
      { new: true }
    );

    if (result) {
      console.log(`Message status updated: ${status.id} -> ${status.status}`);
    } else {
      console.log(`Message not found for status update: ${status.id}`);
    }
  } catch (error) {
    console.error('Error processing status update:', error);
  }
}

module.exports = router; 