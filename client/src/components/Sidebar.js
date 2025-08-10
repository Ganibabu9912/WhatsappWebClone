import React, { useState, useMemo, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Menu, Search } from 'lucide-react';
import AddContactModal from './AddContactModal';
import ContextMenu from './ContextMenu';

const Sidebar = ({ 
  selectedConversation, 
  onConversationSelect, 
  loading, 
  sidebarOpen, 
  onToggleSidebar 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    isVisible: false,
    position: { x: 0, y: 0 },
    contact: null
  });

  // Fetch contacts from database
  const fetchContacts = async () => {
    try {
      setContactsLoading(true);
      const response = await fetch('https://whatsappwebclone-ctfp.onrender.com/api/contacts');
      if (response.ok) {
        const data = await response.json();
        console.log('📱 Fetched contacts:', data);
        setContacts(data);
      } else {
        console.error('Failed to fetch contacts');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setContactsLoading(false);
    }
  };

  // Smart fetch contacts with loading state
  const smartFetchContacts = async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    try {
      setIsRefreshing(true);
      const response = await fetch('https://whatsappwebclone-ctfp.onrender.com/api/contacts');
      if (response.ok) {
        const data = await response.json();
        console.log('🔄 Contacts refreshed successfully:', data);
        setContacts(data);
      } else {
        console.error('Failed to fetch contacts');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch contacts on component mount
  useEffect(() => {
    fetchContacts();
  }, []);

  // Expose refresh function globally for other components to use
  useEffect(() => {
    window.refreshContacts = smartFetchContacts;
    
    // Cleanup function to remove the global reference
    return () => {
      delete window.refreshContacts;
    };
  }, []);

  // No automatic polling - only refresh on events (message sent, manual refresh, initial load)

  // Use only contacts data to avoid duplication with conversations from App.js
  const allConversations = useMemo(() => {
    console.log('🔄 Building allConversations from contacts only:', { contacts: contacts.length });
    
    // Normalize contacts to ensure they have the correct structure
    const normalizedContacts = contacts.map(contact => {
      // If the contact has _id but no wa_id, use _id as wa_id
      if (contact._id && !contact.wa_id) {
        console.log('🔄 Normalizing contact:', contact.name, 'using _id as wa_id');
        return { ...contact, wa_id: contact._id };
      }
      return contact;
    });
    
    console.log('📱 Normalized contacts:', normalizedContacts.map(c => ({ name: c.name, wa_id: c.wa_id, hasWaId: !!c.wa_id })));
    
    // Sort by pinned status first, then by message activity
    return normalizedContacts.sort((a, b) => {
      // Pinned chats first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      const messageTimeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const messageTimeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      
      // If both have messages, sort by message time
      if (messageTimeA > 0 && messageTimeB > 0) {
        return messageTimeB - messageTimeA; // Most recent first
      }
      
      // If only one has messages, prioritize the one with messages
      if (messageTimeA > 0 && messageTimeB === 0) return -1;
      if (messageTimeB > 0 && messageTimeA === 0) return 1;
      
      // If neither has messages, sort by creation time
      const createdAtA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createdAtB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return createdAtB - createdAtA;
    });
  }, [contacts]);

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    console.log('🔍 Filtering conversations:', { searchQuery, allConversations: allConversations.length });
    if (!searchQuery.trim()) return allConversations;
    return allConversations.filter(conversation =>
      conversation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conversation.lastMessage && conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allConversations, searchQuery]);
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
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

  const handleAddContact = () => {
    setIsAddContactModalOpen(true);
  };

  const handleContactAdded = (newContact) => {
    // Add new contact - it will be sorted by the useMemo logic
    setContacts(prev => [newContact, ...prev]);
  };

  const handleRefreshContacts = () => {
    smartFetchContacts();
  };

  // Context menu handlers
  const handleContextMenu = (e, contact) => {
    e.preventDefault();
    
    // Normalize contact to ensure it has wa_id
    let normalizedContact = contact;
    if (contact._id && !contact.wa_id) {
      normalizedContact = { ...contact, wa_id: contact._id };
    }
    
    // Only show context menu if we have a valid contact with required fields
    if (!normalizedContact || !normalizedContact.wa_id || !normalizedContact.name) {
      console.error('Invalid contact for context menu:', normalizedContact);
      return;
    }
    
    console.log('📱 Opening context menu for:', normalizedContact.name, 'wa_id:', normalizedContact.wa_id);
    
    setContextMenu({
      isVisible: true,
      position: { x: e.clientX, y: e.clientY },
      contact: normalizedContact
    });
  };

  const closeContextMenu = () => {
    setContextMenu({
      isVisible: false,
      position: { x: 0, y: 0 },
      contact: null
    });
  };

  // Close context menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && contextMenu.isVisible) {
        closeContextMenu();
      }
    };

    const handleClickOutside = (e) => {
      if (contextMenu.isVisible && !e.target.closest('.context-menu')) {
        closeContextMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.isVisible]);

  const handlePinChat = async () => {
    if (!contextMenu.contact || !contextMenu.contact.wa_id) {
      console.error('No contact selected for pinning');
      return;
    }
    
    try {
      console.log('Toggling pin for contact:', contextMenu.contact.wa_id);
      const response = await fetch(`https://whatsappwebclone-ctfp.onrender.com/api/contacts/${contextMenu.contact.wa_id}/toggle/pin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: !contextMenu.contact.isPinned
        })
      });

      if (response.ok) {
        console.log('Contact pin toggled successfully');
        // Refresh contacts to show updated state
        smartFetchContacts();
        
        // Close context menu
        closeContextMenu();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to pin/unpin chat:', response.status, errorData);
        alert(`Failed to pin/unpin chat: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error pinning/unpinning chat:', error);
      alert('Error pinning/unpinning chat. Please try again.');
    }
  };

  const handleDeleteChat = async () => {
    if (!contextMenu.contact || !contextMenu.contact.wa_id) {
      console.error('No contact selected for deletion');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete the chat with ${contextMenu.contact.name}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      console.log('Deleting contact:', contextMenu.contact.wa_id);
      const response = await fetch(`https://whatsappwebclone-ctfp.onrender.com/api/contacts/${contextMenu.contact.wa_id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('Contact deleted successfully');
        // Refresh contacts to remove deleted contact
        smartFetchContacts();
        
        // If the deleted contact was selected, clear the selection
        if (selectedConversation?._id === contextMenu.contact._id) {
          onConversationSelect(null);
        }
        
        // Close context menu
        closeContextMenu();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to delete chat:', response.status, errorData);
        alert(`Failed to delete chat: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Error deleting chat. Please try again.');
    }
  };

  if (loading || contactsLoading) {
    return (
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h1>WhatsApp Web</h1>
        <div className="header-buttons">
          <button 
            className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`} 
            onClick={handleRefreshContacts} 
            title="Refresh contacts"
            disabled={isRefreshing}
          >
            <span>{isRefreshing ? '⟳' : '↻'}</span>
          </button>
          <button className="new-chat-button" onClick={handleAddContact}>
            <span>+</span>
          </button>
        </div>
      </div>
      
      {/* Search Box */}
      <div className="search-container">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
      <div className="conversations-list">
        {filteredConversations.length === 0 ? (
          <div className="empty-state">
            <h2>{searchQuery ? 'No results found' : 'No conversations yet'}</h2>
            <p>{searchQuery ? 'Try a different search term' : 'Start chatting to see your conversations here'}</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation._id}
              className={`conversation-item ${
                selectedConversation?._id === conversation._id ? 'active' : ''
              } ${conversation.isPinned ? 'pinned' : ''}`}
              onClick={() => onConversationSelect(conversation)}
              onContextMenu={(e) => handleContextMenu(e, conversation)}
            >
              <div className="avatar">
                {getInitials(conversation.name)}
              </div>
              
                             <div className="conversation-info">
                 <div className="conversation-name">{conversation.name}</div>
                 <div className="conversation-last-message">
                   {conversation.lastMessage || 'No messages yet'}
                 </div>
                 <div className={`conversation-status ${conversation.status === 'offline' ? 'offline' : ''}`}>
                   {conversation.status === 'online' ? 'online' : 
                    conversation.status === 'last seen' && conversation.lastSeen ? 
                    `last seen ${formatDistanceToNow(new Date(conversation.lastSeen), { addSuffix: true })}` : 
                    'offline'}
                 </div>
               </div>
              
              <div className="conversation-time">
                {formatTime(conversation.lastMessageTime || conversation.createdAt)}
              </div>
              
              {conversation.unreadCount > 0 && (
                <div className="unread-badge">
                  {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      <AddContactModal
        isOpen={isAddContactModalOpen}
        onClose={() => setIsAddContactModalOpen(false)}
        onContactAdded={handleContactAdded}
      />
      
      <ContextMenu
        isVisible={contextMenu.isVisible}
        position={contextMenu.position}
        onClose={closeContextMenu}
        onPinChat={handlePinChat}
        onDeleteChat={handleDeleteChat}
        isPinned={contextMenu.contact?.isPinned || false}
      />
    </div>
  );
};

export default Sidebar; 