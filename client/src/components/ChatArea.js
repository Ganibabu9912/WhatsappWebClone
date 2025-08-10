import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Send, Menu, Check, CheckCheck, Search, X } from 'lucide-react';

const ChatArea = ({ conversation, messages, onSendMessage, onToggleSidebar }) => {
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const searchInputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for message status updates
  useEffect(() => {
    if (!conversation?.wa_id) return;

    const pollStatusUpdates = async () => {
      try {
        const response = await fetch(`https://whatsappwebclone-ctfp.onrender.com/api/messages/status-updates/${conversation.wa_id}`);
        if (response.ok) {
          const statusUpdates = await response.json();
          if (statusUpdates.length > 0) {
            // Trigger a refresh of messages to show updated statuses
            // This will be handled by the parent component
            if (window.refreshMessages) {
              window.refreshMessages();
            }
          }
        }
      } catch (error) {
        console.error('Error polling status updates:', error);
      }
    };

    const interval = setInterval(pollStatusUpdates, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [conversation?.wa_id]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [messageText]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      setIsSearchActive(false);
      return;
    }

    const results = messages
      .map((message, index) => ({
        message,
        index,
        text: message.text.body.toLowerCase()
      }))
      .filter(item => item.text.includes(searchQuery.toLowerCase()));

    setSearchResults(results);
    setCurrentSearchIndex(0);
    setIsSearchActive(results.length > 0);
  }, [searchQuery, messages]);

  // Scroll to highlighted message when search index changes
  useEffect(() => {
    if (searchResults.length > 0 && currentSearchIndex < searchResults.length) {
      const messageElement = document.querySelector(`[data-message-index="${searchResults[currentSearchIndex].index}"]`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentSearchIndex, searchResults]);

  // Handle keyboard shortcuts for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'f') {
          e.preventDefault();
          setIsSearchActive(true);
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }
      }
      
      if (isSearchActive && searchResults.length > 0) {
        if (e.key === 'Enter') {
          e.preventDefault();
          setCurrentSearchIndex((prev) => (prev + 1) % searchResults.length);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setSearchQuery('');
          setIsSearchActive(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchActive, searchResults.length]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (messageText.trim() && !isTyping) {
      onSendMessage(messageText);
      setMessageText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchActive(false);
  };

  const nextSearchResult = () => {
    if (searchResults.length > 0) {
      setCurrentSearchIndex((prev) => (prev + 1) % searchResults.length);
    }
  };

  const previousSearchResult = () => {
    if (searchResults.length > 0) {
      setCurrentSearchIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    }
  };

  const isMessageHighlighted = (messageIndex) => {
    return searchResults.some((result, index) => 
      result.index === messageIndex && index === currentSearchIndex
    );
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return format(date, 'HH:mm');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Check className="status-icon sent" />;
      case 'delivered':
        return <CheckCheck className="status-icon delivered" />;
      case 'read':
        return <CheckCheck className="status-icon read" />;
      default:
        return <Check className="status-icon sent" />;
    }
  };

  if (!conversation) {
    return (
      <div className="chat-area">
        <div className="empty-state">
          <h2>Welcome to WhatsApp Web</h2>
          <p>Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      {/* Chat Header */}
      <div className="chat-header">
        <button className="mobile-menu-button" onClick={onToggleSidebar}>
          <Menu />
        </button>
        
        <div className="avatar">
          {getInitials(conversation.name)}
        </div>
        
        <div className="chat-header-info">
          <h2>{conversation.name}</h2>
          <p>
            {conversation.status === 'online' ? 'online' : 
             conversation.status === 'last seen' && conversation.lastSeen ? 
             `last seen ${format(new Date(conversation.lastSeen), 'HH:mm')}` : 
             'offline'}
          </p>
        </div>
        
        <button 
          className="search-toggle-button"
          onClick={() => setIsSearchActive(!isSearchActive)}
          title="Search messages (Ctrl+F)"
        >
          <Search size={20} />
        </button>
      </div>

      {/* Search Bar */}
      {isSearchActive && (
        <div className="chat-search-container">
          <div className="chat-search-box">
            <Search size={16} className="chat-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="chat-search-input"
            />
            {searchQuery && (
              <button className="chat-search-clear" onClick={clearSearch}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search Results Info */}
      {searchResults.length > 0 && (
        <div className="search-results-info">
          <span className="search-results-count">
            {currentSearchIndex + 1} of {searchResults.length} results
          </span>
          <div className="search-results-nav">
            <button 
              className="search-nav-button"
              onClick={previousSearchResult}
              disabled={searchResults.length <= 1}
            >
              ↑ Previous
            </button>
            <button 
              className="search-nav-button"
              onClick={nextSearchResult}
              disabled={searchResults.length <= 1}
            >
              ↓ Next
            </button>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <h2>No messages yet</h2>
            <p>Start the conversation by sending a message</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id}
              data-message-index={index}
              className={`message ${message.direction === 'out' ? 'outgoing' : 'incoming'} ${
                isMessageHighlighted(index) ? 'highlighted' : ''
              }`}
            >
              <div className="message-bubble">
                <div className="message-text">{message.text.body}</div>
                <div className="message-time">{formatTime(message.timestamp)}</div>
                
                {message.direction === 'out' && (
                  <div className="message-status">
                    {getStatusIcon(message.status)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        <form onSubmit={handleSubmit} className="message-input-form">
          <textarea
            ref={textareaRef}
            className="message-input"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message"
            rows="1"
            disabled={isTyping}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!messageText.trim() || isTyping}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatArea; 