# WhatsApp Web Clone

A full-stack WhatsApp Web clone built with React, Node.js, and MongoDB. This application provides a responsive, mobile-friendly interface that mimics the look and feel of WhatsApp Web, complete with conversation management, message status tracking, and real-time updates.

## Features

### 🚀 Core Functionality
- **Webhook Payload Processor**: Automatically processes incoming WhatsApp webhook payloads
- **Message Management**: Stores and retrieves messages with MongoDB
- **Status Tracking**: Real-time message status updates (sent, delivered, read)
- **Conversation Grouping**: Messages organized by user (wa_id)

### 💬 WhatsApp Web-like Interface
- **Responsive Design**: Works seamlessly on both desktop and mobile devices
- **Conversation List**: Sidebar showing all conversations with last message preview
- **Chat Interface**: Message bubbles with timestamps and status indicators
- **User Avatars**: Dynamic initials-based avatars for each conversation
- **Unread Counts**: Visual indicators for unread messages

### 📱 User Experience
- **Clean Design**: Modern, intuitive interface matching WhatsApp Web aesthetics
- **Mobile Optimized**: Touch-friendly controls and responsive layout
- **Real-time Updates**: Instant message delivery and status changes
- **Demo Mode**: Send messages that are saved to the database (no actual WhatsApp integration)

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Webhook Processing** for WhatsApp Business API
- **RESTful APIs** for message management

### Frontend
- **React 18** with functional components and hooks
- **Responsive CSS** with mobile-first design
- **Lucide React** for modern icons
- **Date-fns** for time formatting

## Project Structure

```
WhatsappWebClone/
├── server/                 # Backend Node.js server
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── index.js           # Main server file
│   └── package.json       # Backend dependencies
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.js         # Main app component
│   │   └── index.js       # React entry point
│   └── package.json       # Frontend dependencies
├── package.json           # Root package.json
└── README.md              # This file
```

## Prerequisites

Before running this project, make sure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB Atlas** account (or local MongoDB instance)
- **WhatsApp Business API** access (for webhook functionality)

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd WhatsappWebClone
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install

# Return to root
cd ..
```

### 3. Environment Configuration

#### Backend (.env file)
Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/whatsapp?retryWrites=true&w=majority
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
NODE_ENV=development
```

#### MongoDB Atlas Setup
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database named `whatsapp`
4. Create a collection named `processed_messages`
5. Get your connection string and update `MONGODB_URI`

### 4. Run the Application

#### Development Mode (Both Frontend and Backend)
```bash
npm run dev
```

#### Run Separately
```bash
# Backend only
npm run server

# Frontend only
npm run client
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## API Endpoints

### Webhook Endpoints
- `GET /api/webhook` - Webhook verification
- `POST /api/webhook` - Receive webhook payloads

### Message Endpoints
- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/conversation/:wa_id` - Get messages for a conversation
- `POST /api/messages/send` - Send a new message (demo)
- `GET /api/messages/stats` - Get message statistics

## Webhook Configuration

To receive real WhatsApp messages, configure your webhook:

1. **WhatsApp Business API Setup**:
   - Set webhook URL: `https://your-domain.com/api/webhook`
   - Set verify token: Use the same value as `WHATSAPP_VERIFY_TOKEN`

2. **Webhook Payload Processing**:
   - Incoming messages are automatically saved to MongoDB
   - Status updates automatically update message status
   - All data is stored in the `processed_messages` collection

## Deployment

### Frontend (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy the build folder
```

### Backend (Render/Heroku)
```bash
cd server
# Set environment variables in your hosting platform
# Deploy the server folder
```

### Environment Variables for Production
- `MONGODB_URI`: Your production MongoDB connection string
- `WHATSAPP_VERIFY_TOKEN`: Your webhook verification token
- `NODE_ENV`: Set to `production`

## Customization

### Styling
- Modify `client/src/index.css` for theme changes
- Update colors, fonts, and layout in the CSS file

### Functionality
- Add new message types in `server/models/Message.js`
- Extend webhook processing in `server/routes/webhook.js`
- Add new UI components in `client/src/components/`

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   - Check your connection string
   - Ensure your IP is whitelisted in MongoDB Atlas
   - Verify database and collection names

2. **Webhook Not Working**:
   - Check webhook URL configuration
   - Verify verify token matches
   - Ensure HTTPS is enabled for production

3. **Frontend Not Loading**:
   - Check if backend is running on port 5000
   - Verify proxy configuration in client/package.json
   - Check browser console for errors

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Open an issue in the repository

---

**Note**: This is a demo application for educational purposes. It does not actually send messages to WhatsApp users but simulates the WhatsApp Web experience with local data storage. 