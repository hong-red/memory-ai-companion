export class UIManager {
  constructor() {
    this.currentNote = null;
    this.musicPlayer = null;
    this.isLoading = false;
  }

  init() {
    this.setupGlobalEventListeners();
    this.initializeComponents();
  }

  setupGlobalEventListeners() {
    // Handle modal clicks outside content
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeModal(e.target);
      }
    });

    // Handle escape key for modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
          this.closeModal(activeModal);
        }
      }
    });
  }

  initializeComponents() {
    // Initialize any UI components that need setup
    this.setupTooltips();
    this.setupNotifications();
  }

  setupTooltips() {
    // Simple tooltip implementation
    document.addEventListener('mouseenter', (e) => {
      if (e.target.hasAttribute('title')) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = e.target.getAttribute('title');
        tooltip.style.cssText = `
          position: absolute;
          background: rgba(5, 19, 23, 0.95);
          color: #00e1ff;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          z-index: 10000;
          pointer-events: none;
          backdrop-filter: blur(6px);
          border: 1px solid rgba(0, 225, 255, 0.3);
        `;
        
        document.body.appendChild(tooltip);
        
        const rect = e.target.getBoundingClientRect();
        tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
        
        e.target._tooltip = tooltip;
      }
    });

    document.addEventListener('mouseleave', (e) => {
      if (e.target._tooltip) {
        document.body.removeChild(e.target._tooltip);
        e.target._tooltip = null;
      }
    });
  }

  setupNotifications() {
    // Create notification container
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10001;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  addMessage(message) {
    const container = document.querySelector('.chat-container');
    if (!container) return;

    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.role}`;
    messageElement.dataset.messageId = message.id;

    if (message.imageData) {
      const imageElement = document.createElement('img');
      imageElement.src = message.imageData;
      imageElement.style.cssText = `
        max-width: 200px;
        max-height: 200px;
        border-radius: 8px;
        margin-bottom: 8px;
        cursor: pointer;
      `;
      
      imageElement.addEventListener('click', () => {
        this.showImageModal(message.imageData);
      });
      
      messageElement.appendChild(imageElement);
    }

    const textElement = document.createElement('div');
    textElement.textContent = message.content;
    messageElement.appendChild(textElement);

    // Add timestamp
    const timestampElement = document.createElement('div');
    timestampElement.className = 'message-timestamp';
    timestampElement.textContent = new Date(message.timestamp).toLocaleTimeString();
    timestampElement.style.cssText = `
      font-size: 11px;
      opacity: 0.6;
      margin-top: 4px;
    `;
    messageElement.appendChild(timestampElement);

    // Add click-to-speak for bot messages
    if (message.role === 'bot') {
      messageElement.style.cursor = 'pointer';
      messageElement.addEventListener('click', () => {
        this.speakMessage(message.content);
      });
    }

    container.appendChild(messageElement);
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  clearChat() {
    const container = document.querySelector('.chat-container');
    if (container) {
      container.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    }
  }

  updateRoleDisplay(role) {
    const header = document.querySelector('header');
    if (header) {
      header.textContent = `AI Companion - ${role.name}`;
    }
  }

  showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
      background: ${type === 'error' ? 'rgba(255, 68, 68, 0.9)' : 
                     type === 'success' ? 'rgba(52, 255, 167, 0.9)' : 
                     'rgba(0, 225, 255, 0.9)'};
      color: ${type === 'error' ? 'white' : '#051317'};
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 8px;
      backdrop-filter: blur(6px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-size: 14px;
      max-width: 300px;
      pointer-events: auto;
      cursor: pointer;
      transition: all 0.3s ease;
    `;

    container.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        setTimeout(() => {
          if (notification.parentNode) {
            container.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);

    // Click to remove
    notification.addEventListener('click', () => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          container.removeChild(notification);
        }
      }, 300);
    });
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showInfo(message) {
    this.showNotification(message, 'info');
  }

  showModal(content, title = '') {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    
    modal.innerHTML = `
      <div class="modal-content">
        ${title ? `<div class="modal-header"><h3>${title}</h3><button class="close-btn">&times;</button></div>` : ''}
        <div class="modal-body">${content}</div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add close functionality
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeModal(modal);
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });

    return modal;
  }

  closeModal(modal) {
    if (modal && modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  }

  showImageModal(imageSrc) {
    const modal = this.showModal(`
      <img src="${imageSrc}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;" />
    `, 'Image');

    return modal;
  }

  showLoading(message = 'Loading...') {
    this.isLoading = true;
    
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(5, 19, 23, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10002;
      backdrop-filter: blur(5px);
    `;

    loadingOverlay.innerHTML = `
      <div style="text-align: center;">
        <div style="width: 40px; height: 40px; border: 3px solid rgba(0, 225, 255, 0.3); border-top: 3px solid #00e1ff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
        <div style="color: #00e1ff; font-size: 16px;">${message}</div>
      </div>
    `;

    document.body.appendChild(loadingOverlay);
  }

  hideLoading() {
    this.isLoading = false;
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  showDiaryEntry(diary) {
    const modal = this.showModal(`
      <div class="diary-entry">
        <div class="diary-date">${new Date(diary.date).toLocaleDateString()}</div>
        <div class="diary-mood">Mood: ${diary.mood}</div>
        <div class="diary-content">${diary.content}</div>
        ${diary.chatCount ? `<div style="margin-top: 12px; font-size: 12px; opacity: 0.7;">Based on ${diary.chatCount} messages</div>` : ''}
      </div>
    `, 'Diary Entry');

    return modal;
  }

  speakMessage(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      window.speechSynthesis.speak(utterance);
    } else {
      this.showError('Speech synthesis not supported in your browser');
    }
  }

  async saveCurrentNote() {
    const editor = document.getElementById('note-editor');
    const content = editor.value.trim();
    
    if (!content) {
      this.showError('Note content cannot be empty');
      return;
    }

    try {
      const note = {
        id: this.currentNote ? this.currentNote.id : this.generateNoteId(),
        content,
        createdAt: this.currentNote ? this.currentNote.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await window.app.storage.saveNote(note);
      this.currentNote = note;
      
      document.getElementById('note-last-saved').textContent = 'Saved just now';
      this.showSuccess('Note saved successfully');
      
    } catch (error) {
      console.error('Failed to save note:', error);
      this.showError('Failed to save note: ' + error.message);
    }
  }

  createNewNote() {
    if (this.currentNote && document.getElementById('note-editor').value.trim()) {
      if (!confirm('You have unsaved changes. Are you sure you want to create a new note?')) {
        return;
      }
    }

    this.currentNote = null;
    document.getElementById('note-editor').value = '';
    document.getElementById('note-word-count').textContent = '0 words';
    document.getElementById('note-last-saved').textContent = 'Never saved';
  }

  generateNoteId() {
    return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async exportData() {
    try {
      this.showLoading('Exporting data...');
      
      const data = await window.app.storage.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-companion-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      this.showSuccess('Data exported successfully');
      
    } catch (error) {
      console.error('Failed to export data:', error);
      this.showError('Failed to export data: ' + error.message);
    } finally {
      this.hideLoading();
    }
  }

  async importData(file) {
    if (!file) return;

    try {
      this.showLoading('Importing data...');
      
      const text = await file.text();
      const data = JSON.parse(text);
      
      const success = await window.app.storage.importData(data);
      
      if (success) {
        this.showSuccess('Data imported successfully');
        // Reload the app to show imported data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        this.showError('Failed to import data');
      }
      
    } catch (error) {
      console.error('Failed to import data:', error);
      this.showError('Failed to import data: ' + error.message);
    } finally {
      this.hideLoading();
    }
  }

  async clearAllData() {
    try {
      this.showLoading('Clearing all data...');
      
      // Clear all IndexedDB stores
      await window.app.storage.clear('roles');
      await window.app.storage.clear('chatHistory');
      await window.app.storage.clear('memories');
      await window.app.storage.clear('diary');
      await window.app.storage.clear('gallery');
      await window.app.storage.clear('notes');
      await window.app.storage.clear('music');
      await window.app.storage.clear('settings');
      
      // Clear localStorage
      localStorage.clear();
      
      this.showSuccess('All data cleared successfully');
      
      // Reload the app
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to clear data:', error);
      this.showError('Failed to clear data: ' + error.message);
    } finally {
      this.hideLoading();
    }
  }

  updateGallery() {
    // This would be implemented to update the gallery display
    console.log('Gallery update would be implemented here');
  }

  filterDiaryEntries(filter) {
    // This would be implemented to filter diary entries
    console.log('Diary filter would be implemented here');
  }

  toggleMusicPlayback() {
    // This would be implemented to toggle music playback
    console.log('Music playback toggle would be implemented here');
  }

  playPreviousTrack() {
    // This would be implemented to play previous track
    console.log('Previous track would be implemented here');
  }

  playNextTrack() {
    // This would be implemented to play next track
    console.log('Next track would be implemented here');
  }

  // Utility methods
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks ago`;
    } else if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)} months ago`;
    } else {
      return `${Math.floor(diffDays / 365)} years ago`;
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}
