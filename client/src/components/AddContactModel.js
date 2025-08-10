import React, { useState } from 'react';
import { X, User, Phone, Image, FileText, Tag } from 'lucide-react';
import './AddContactModel.css';

const AddContactModal = ({ isOpen, onClose, onContactAdded }) => {
  const [formData, setFormData] = useState({
    wa_id: '',
    name: '',
    profilePicture: '',
    notes: '',
    labels: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.wa_id.trim() || !formData.name.trim()) {
      setError('WhatsApp ID and Name are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const contactData = {
        wa_id: formData.wa_id.trim(),
        name: formData.name.trim(),
        profilePicture: formData.profilePicture.trim() || null,
        notes: formData.notes.trim() || '',
        labels: formData.labels.trim() ? formData.labels.split(',').map(label => label.trim()) : []
      };

      const response = await fetch('https://whatsappwebclone-ctfp.onrender.com/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      if (response.ok) {
        const newContact = await response.json();
        onContactAdded(newContact);
        handleClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create contact');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      wa_id: '',
      name: '',
      profilePicture: '',
      notes: '',
      labels: ''
    });
    setError('');
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Contact</h2>
          <button className="close-button" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="contact-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="wa_id">
              <Phone size={16} />
              WhatsApp ID *
            </label>
            <input
              type="text"
              id="wa_id"
              name="wa_id"
              value={formData.wa_id}
              onChange={handleInputChange}
              placeholder="Enter WhatsApp ID (e.g., 1234567890)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">
              <User size={16} />
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter contact name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="profilePicture">
              <Image size={16} />
              Profile Picture URL
            </label>
            <input
              type="url"
              id="profilePicture"
              name="profilePicture"
              value={formData.profilePicture}
              onChange={handleInputChange}
              placeholder="https://example.com/profile.jpg"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">
              <FileText size={16} />
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Add notes about this contact"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="labels">
              <Tag size={16} />
              Labels
            </label>
            <input
              type="text"
              id="labels"
              name="labels"
              value={formData.labels}
              onChange={handleInputChange}
              placeholder="family, work, friends (comma separated)"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContactModal;
