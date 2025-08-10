import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import './App.css';

function App() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.wa_id);
    }
  }, [selectedConversation]);

  // Expose refreshMessages function globally for status updates
  useEffect(() => {
    window.refreshMessages = () => {
      if (selectedConversation) {
        fetchMessages(selectedConversation.wa_id);
      }
    };
    
    return () => {
      delete window.refreshMessages;
    };
  }, [selectedConversation]);



  const fetchMessages = async (wa_id) => {
    try {
      const response = await fetch(`/api/messages/conversation/${wa_id}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        console.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    setSidebarOpen(false); // Close sidebar on mobile
  };

  const handleSendMessage = async (messageText) => {
    if (!selectedConversation || !messageText.trim()) return;

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wa_id: selectedConversation.wa_id,
          name: 'You',
          text: messageText.trim(),
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages(prev => [...prev, newMessage]);
        
        // Trigger contacts refresh to update sorting
        if (window.refreshContacts) {
          window.refreshContacts();
        }
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app">
      <Sidebar
        selectedConversation={selectedConversation}
        onConversationSelect={handleConversationSelect}
        loading={loading}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      <ChatArea
        conversation={selectedConversation}
        messages={messages}
        onSendMessage={handleSendMessage}
        onToggleSidebar={toggleSidebar}
      />
    </div>
  );
}

export default App; 