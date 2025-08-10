import React from 'react';

const ContextMenu = ({ 
  isVisible, 
  position, 
  onClose, 
  onPinChat, 
  onDeleteChat, 
  isPinned 
}) => {
  if (!isVisible) return null;

  const handlePinClick = () => {
    onPinChat();
    onClose();
  };

  const handleDeleteClick = () => {
    onDeleteChat();
    onClose();
  };

  return (
    <>
      {/* Backdrop to close menu when clicking outside */}
      <div 
        className="context-menu-backdrop" 
        onClick={onClose}
      />
      
      {/* Context menu */}
      <div 
        className="context-menu"
        style={{
          top: position.y,
          left: position.x
        }}
      >
        <button 
          className="context-menu-item"
          onClick={handlePinClick}
        >
          <span className="context-menu-icon">
            {isPinned ? '📌' : '📍'}
          </span>
          {isPinned ? 'Unpin chat' : 'Pin chat'}
        </button>
        
        <button 
          className="context-menu-item delete"
          onClick={handleDeleteClick}
        >
          <span className="context-menu-icon">🗑️</span>
          Delete chat
        </button>
      </div>
    </>
  );
};

export default ContextMenu;
