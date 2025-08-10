const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-clone';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Import routes
const webhookRoutes = require('./routes/webhook');
const messageRoutes = require('./routes/messages');
const contactRoutes = require('./routes/contacts');

// Routes
app.use('/api/webhook', webhookRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/contacts', contactRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'WhatsApp Web Clone Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 