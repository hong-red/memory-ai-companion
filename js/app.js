import { Storage } from './storage.js';
import { ChatAPI } from './api.js';
import { TabManager } from './tabs.js';
import { RoleManager } from './roles.js';
import { MemoryManager } from './memory.js';
import { UIManager } from './ui.js';
import { VoiceManager } from './voice.js';
import { ImageManager } from './image.js';

class App {
  constructor() {
    this.storage = new Storage();
    this.api = new ChatAPI();
    this.tabs = new TabManager();
    this.roles = new RoleManager();
    this.memory = new MemoryManager();
    this.ui = new UIManager();
    this.voice = new VoiceManager();
    this.image = new ImageManager();
    
    this.currentRole = null;
    this.chatHistory = [];
    this.isTyping = false;
    
    this.init();
  }

  async init() {
    try {
      // Initialize storage
      await this.storage.init();
      
      // Load initial data
      await this.loadInitialData();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize UI
      this.ui.init();
      
      // Setup voice recognition
      this.voice.init();
      
      // Setup image handling
      this.image.init();
      
      console.log('App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.ui.showError('Failed to initialize application');
    }
  }

  async loadInitialData() {
    // Load current role
    this.currentRole = await this.storage.getCurrentRole() || await this.roles.getDefaultRole();
    
    // Load chat history
    this.chatHistory = await this.storage.getChatHistory() || [];
    
    // Load roles
    await this.roles.loadRoles();
    
    // Load memories
    await this.memory.loadMemories();
  }

  setupEventListeners() {
    // Navigation
    document.getElementById('nav').addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        this.tabs.switchTab(e.target.dataset.tab);
      }
    });

    // Chat input
    const input = document.getElementById('input');
    const sendBtn = document.getElementById('send-btn');
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    sendBtn.addEventListener('click', () => this.sendMessage());

    // Voice button
    document.getElementById('voice-btn').addEventListener('click', () => {
      this.voice.toggleRecording();
    });

    // Image button
    document.getElementById('image-btn').addEventListener('click', () => {
      document.getElementById('image-upload').click();
    });

    // Image upload
    document.getElementById('image-upload').addEventListener('change', (e) => {
      this.image.handleImageUpload(e.target.files[0]);
    });

    // Summary button
    document.getElementById('summary-btn').addEventListener('click', () => {
      this.generateSummary();
    });

    // Modal close buttons
    document.querySelectorAll('.close-btn, .cancel-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        this.ui.closeModal(modal);
      });
    });

    // Role form
    document.getElementById('role-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.roles.saveRole();
    });

    // Memory form
    document.getElementById('memory-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.memory.saveMemory();
    });

    // Voice events
    this.voice.on('start', () => {
      document.getElementById('voice-btn').classList.add('recording');
    });

    this.voice.on('stop', (text) => {
      document.getElementById('voice-btn').classList.remove('recording');
      if (text) {
        input.value = text;
        this.sendMessage();
      }
    });

    this.voice.on('error', (error) => {
      document.getElementById('voice-btn').classList.remove('recording');
      this.ui.showError('Voice recognition failed: ' + error.message);
    });

    // Image events
    this.image.on('uploaded', (imageData) => {
      this.sendImageMessage(imageData);
    });

    this.image.on('error', (error) => {
      this.ui.showError('Image upload failed: ' + error.message);
    });
  }

  async sendMessage() {
    const input = document.getElementById('input');
    const message = input.value.trim();
    
    if (!message || this.isTyping) return;
    
    // Add user message
    this.addMessage('user', message);
    input.value = '';
    
    // Show typing indicator
    this.showTypingIndicator();
    
    try {
      // Get AI response
      const response = await this.api.sendMessage(message, this.currentRole, this.chatHistory);
      
      // Add bot message
      this.addMessage('bot', response);
      
      // Save chat history
      await this.storage.saveChatHistory(this.chatHistory);
      
      // Update summary button
      this.updateSummaryButton();
      
      // Auto-generate memory cards if enabled
      if (await this.storage.getSetting('autoMemory')) {
        this.memory.extractMemories(message, response);
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      this.addMessage('bot', 'Sorry, I encountered an error. Please try again.');
      this.ui.showError('Failed to get response: ' + error.message);
    } finally {
      this.hideTypingIndicator();
    }
  }

  async sendImageMessage(imageData) {
    if (!imageData || this.isTyping) return;
    
    // Add user message with image
    this.addMessage('user', '[Image]', imageData);
    
    // Show typing indicator
    this.showTypingIndicator();
    
    try {
      // Get AI response with image
      const response = await this.api.sendImageMessage(imageData, this.currentRole, this.chatHistory);
      
      // Add bot message
      this.addMessage('bot', response);
      
      // Save chat history
      await this.storage.saveChatHistory(this.chatHistory);
      
    } catch (error) {
      console.error('Failed to send image message:', error);
      this.addMessage('bot', 'Sorry, I cannot process images at the moment.');
      this.ui.showError('Failed to process image: ' + error.message);
    } finally {
      this.hideTypingIndicator();
    }
  }

  addMessage(role, content, imageData = null) {
    const message = {
      id: Date.now(),
      role,
      content,
      timestamp: new Date().toISOString(),
      imageData
    };
    
    this.chatHistory.push(message);
    this.ui.addMessage(message);
    
    // Scroll to bottom
    const container = document.querySelector('.chat-container');
    container.scrollTop = container.scrollHeight;
  }

  showTypingIndicator() {
    this.isTyping = true;
    document.querySelector('.typing-indicator').classList.add('active');
  }

  hideTypingIndicator() {
    this.isTyping = false;
    document.querySelector('.typing-indicator').classList.remove('active');
  }

  async generateSummary() {
    if (this.chatHistory.length < 6) {
      this.ui.showError('Need at least 6 messages to generate summary');
      return;
    }
    
    try {
      this.ui.showLoading('Generating summary...');
      
      const summary = await this.api.generateSummary(this.chatHistory);
      
      // Create diary entry
      const diary = {
        id: Date.now(),
        date: new Date().toISOString(),
        mood: this.detectMood(),
        content: summary,
        chatCount: this.chatHistory.length
      };
      
      await this.storage.saveDiaryEntry(diary);
      this.ui.showDiaryEntry(diary);
      
    } catch (error) {
      console.error('Failed to generate summary:', error);
      this.ui.showError('Failed to generate summary: ' + error.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  detectMood() {
    // Simple mood detection based on recent messages
    const recentMessages = this.chatHistory.slice(-10);
    const positiveWords = ['happy', 'good', 'great', 'awesome', 'love', 'excellent'];
    const negativeWords = ['sad', 'bad', 'terrible', 'hate', 'angry', 'frustrated'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    recentMessages.forEach(msg => {
      const text = msg.content.toLowerCase();
      positiveWords.forEach(word => {
        if (text.includes(word)) positiveScore++;
      });
      negativeWords.forEach(word => {
        if (text.includes(word)) negativeScore++;
      });
    });
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  updateSummaryButton() {
    const summaryBtn = document.getElementById('summary-btn');
    if (this.chatHistory.length > 6) {
      summaryBtn.style.display = 'inline-flex';
    } else {
      summaryBtn.style.display = 'none';
    }
  }

  async switchRole(roleId) {
    const role = await this.roles.getRole(roleId);
    if (role) {
      this.currentRole = role;
      await this.storage.setCurrentRole(roleId);
      this.ui.updateRoleDisplay(role);
      
      // Clear chat history for new role
      this.chatHistory = [];
      this.ui.clearChat();
      
      // Add welcome message
      const welcomeMessage = this.generateWelcomeMessage(role);
      this.addMessage('bot', welcomeMessage);
    }
  }

  generateWelcomeMessage(role) {
    const templates = [
      `Hello! I'm ${role.name}. ${role.description}`,
      `Hi there! I'm ${role.name}. How can I help you today?`,
      `Greetings! I'm ${role.name}. ${role.description} What's on your mind?`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});

export { App };
