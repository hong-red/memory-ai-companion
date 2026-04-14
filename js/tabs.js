export class TabManager {
  constructor() {
    this.currentTab = 'home';
    this.tabContent = document.getElementById('tab-content');
    this.tabs = {};
  }

  init() {
    // Initialize all tabs
    this.tabs = {
      home: this.createHomeTab(),
      chat: this.createChatTab(),
      roles: this.createRolesTab(),
      memory: this.createMemoryTab(),
      diary: this.createDiaryTab(),
      gallery: this.createGalleryTab(),
      notes: this.createNotesTab(),
      music: this.createMusicTab(),
      settings: this.createSettingsTab()
    };

    // Show initial tab
    this.showTab('home');
  }

  switchTab(tabName) {
    if (this.tabs[tabName]) {
      // Update navigation
      document.querySelectorAll('#nav button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
          btn.classList.add('active');
        }
      });

      // Show tab content
      this.showTab(tabName);
      this.currentTab = tabName;
    }
  }

  showTab(tabName) {
    const tabContent = this.tabs[tabName];
    if (tabContent) {
      this.tabContent.innerHTML = tabContent;
      
      // Initialize tab-specific functionality
      this.initializeTab(tabName);
    }
  }

  initializeTab(tabName) {
    switch (tabName) {
      case 'chat':
        this.initializeChatTab();
        break;
      case 'roles':
        this.initializeRolesTab();
        break;
      case 'memory':
        this.initializeMemoryTab();
        break;
      case 'diary':
        this.initializeDiaryTab();
        break;
      case 'gallery':
        this.initializeGalleryTab();
        break;
      case 'notes':
        this.initializeNotesTab();
        break;
      case 'music':
        this.initializeMusicTab();
        break;
      case 'settings':
        this.initializeSettingsTab();
        break;
    }
  }

  createHomeTab() {
    return `
      <div class="home-container">
        <h1 class="home-title">AI Companion Framework</h1>
        <p class="home-subtitle">
          Create and manage your personalized AI companions with advanced features including 
          voice interaction, image processing, and long-term memory.
        </p>
        
        <div class="home-features">
          <div class="feature-card">
            <div class="feature-icon">AI</div>
            <h3 class="feature-title">Smart Conversations</h3>
            <p class="feature-description">
              Engage in natural conversations with AI companions that remember your preferences and context.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">Voice</div>
            <h3 class="feature-title">Voice Interaction</h3>
            <p class="feature-description">
              Talk to your companions using voice input and receive spoken responses for a hands-free experience.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">Image</div>
            <h3 class="feature-title">Visual Understanding</h3>
            <p class="feature-description">
              Share images with your AI companions and have them analyze and discuss visual content.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">Memory</div>
            <h3 class="feature-title">Long-term Memory</h3>
            <p class="feature-description">
              Your companions remember important details about you and your conversations over time.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">Custom</div>
            <h3 class="feature-title">Customizable Roles</h3>
            <p class="feature-description">
              Create unique AI personalities with custom prompts, avatars, and characteristics.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">Diary</div>
            <h3 class="feature-title">Smart Diary</h3>
            <p class="feature-description">
              Automatically generate diary entries and summaries of your conversations.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  createChatTab() {
    return `
      <div id="chat">
        <div class="chat-container">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        
        <div class="input-area">
          <input type="text" id="input" placeholder="Type your message..." />
          <div class="btn-group">
            <button id="voice-btn" class="action-btn" title="Voice input">Voice</button>
            <button id="image-btn" class="action-btn" title="Send image">Image</button>
            <button id="send-btn" class="action-btn" title="Send message">Send</button>
            <button id="summary-btn" class="action-btn" title="Generate summary" style="display: none;">Summary</button>
          </div>
        </div>
      </div>
    `;
  }

  createRolesTab() {
    return `
      <div class="roles-container">
        <h2>AI Companion Roles</h2>
        <p class="tab-description">
          Create and manage different AI personalities. Each role has its own characteristics, 
          speaking style, and memory.
        </p>
        
        <div class="role-selector" id="role-selector">
          <!-- Roles will be dynamically added here -->
        </div>
        
        <button class="create-role-btn" id="create-role-btn">
          + Create New Role
        </button>
        
        <div class="role-help">
          <h3>Tips for Creating Roles</h3>
          <ul>
            <li>Be specific about personality traits and speaking style</li>
            <li>Include background story or context</li>
            <li>Define how the role should respond to different situations</li>
            <li>Set clear boundaries and guidelines</li>
          </ul>
        </div>
      </div>
    `;
  }

  createMemoryTab() {
    return `
      <div class="memory-container">
        <h2>Memory Cards</h2>
        <p class="tab-description">
          Important information and memories that your AI companions remember about you.
        </p>
        
        <div class="memory-controls">
          <button class="create-memory-btn" id="create-memory-btn">
            + Create Memory Card
          </button>
          <div class="memory-search">
            <input type="text" id="memory-search" placeholder="Search memories..." />
            <select id="memory-filter">
              <option value="all">All Tags</option>
              <option value="personal">Personal</option>
              <option value="work">Work</option>
              <option value="hobbies">Hobbies</option>
              <option value="goals">Goals</option>
            </select>
          </div>
        </div>
        
        <div class="memory-grid" id="memory-grid">
          <!-- Memory cards will be dynamically added here -->
        </div>
      </div>
    `;
  }

  createDiaryTab() {
    return `
      <div class="diary-container">
        <h2>Conversation Diary</h2>
        <p class="tab-description">
          Automatically generated summaries and reflections on your conversations.
        </p>
        
        <div class="diary-controls">
          <button class="generate-diary-btn" id="generate-diary-btn">
            Generate New Entry
          </button>
          <select id="diary-filter">
            <option value="all">All Entries</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
        
        <div class="diary-list" id="diary-list">
          <!-- Diary entries will be dynamically added here -->
        </div>
      </div>
    `;
  }

  createGalleryTab() {
    return `
      <div class="gallery-container">
        <h2>Image Gallery</h2>
        <p class="tab-description">
          Images shared with your AI companions and their analyses.
        </p>
        
        <div class="gallery-controls">
          <button class="upload-gallery-btn" id="upload-gallery-btn">
            + Upload Image
          </button>
          <button class="clear-gallery-btn" id="clear-gallery-btn">
            Clear Gallery
          </button>
        </div>
        
        <div class="gallery-grid" id="gallery-grid">
          <!-- Gallery items will be dynamically added here -->
        </div>
      </div>
    `;
  }

  createNotesTab() {
    return `
      <div class="notes-container">
        <h2>Personal Notes</h2>
        <p class="tab-description">
          Keep personal notes and thoughts separate from your conversations.
        </p>
        
        <div class="note-editor">
          <textarea id="note-editor" placeholder="Write your notes here..."></textarea>
          <div class="note-actions">
            <div class="note-info">
              <span id="note-word-count">0 words</span>
              <span id="note-last-saved">Never saved</span>
            </div>
            <div class="note-buttons">
              <button id="save-note-btn">Save Note</button>
              <button id="new-note-btn">New Note</button>
            </div>
          </div>
        </div>
        
        <div class="notes-list" id="notes-list">
          <!-- Notes list will be dynamically added here -->
        </div>
      </div>
    `;
  }

  createMusicTab() {
    return `
      <div class="music-container">
        <h2>Music Player</h2>
        <p class="tab-description">
          Background music and ambient sounds for your conversations.
        </p>
        
        <div class="music-player">
          <div class="music-controls">
            <button class="music-btn" id="music-prev-btn">Prev</button>
            <button class="music-btn" id="music-play-btn">Play</button>
            <button class="music-btn" id="music-next-btn">Next</button>
          </div>
          
          <div class="music-info">
            <div class="music-title" id="music-title">No track selected</div>
            <div class="music-artist" id="music-artist">Unknown artist</div>
          </div>
          
          <div class="music-progress">
            <div class="music-progress-bar" id="music-progress-bar"></div>
          </div>
          
          <div class="music-time">
            <span id="music-current-time">0:00</span>
            <span id="music-total-time">0:00</span>
          </div>
        </div>
        
        <div class="music-list" id="music-list">
          <!-- Music tracks will be dynamically added here -->
        </div>
      </div>
    `;
  }

  createSettingsTab() {
    return `
      <div class="settings-container">
        <h2>Settings</h2>
        
        <div class="settings-section">
          <h3>API Configuration</h3>
          <div class="setting-item">
            <label class="setting-label">Moonshot API Key</label>
            <div class="setting-control">
              <input type="password" id="api-key" placeholder="Enter your API key" />
              <button id="test-api-btn">Test</button>
            </div>
          </div>
          <div class="setting-item">
            <label class="setting-label">Model</label>
            <div class="setting-control">
              <select id="model-select">
                <option value="moonshot-v1-8k">Moonshot v1 8K</option>
                <option value="moonshot-v1-32k">Moonshot v1 32K</option>
                <option value="moonshot-v1-128k">Moonshot v1 128K</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>Voice Settings</h3>
          <div class="setting-item">
            <label class="setting-label">Voice Input</label>
            <div class="setting-control">
              <div class="toggle-switch" id="voice-input-toggle"></div>
            </div>
          </div>
          <div class="setting-item">
            <label class="setting-label">Voice Output</label>
            <div class="setting-control">
              <div class="toggle-switch" id="voice-output-toggle"></div>
            </div>
          </div>
          <div class="setting-item">
            <label class="setting-label">Voice Language</label>
            <div class="setting-control">
              <select id="voice-language">
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="zh-CN">Chinese (Mandarin)</option>
                <option value="ja-JP">Japanese</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>Memory Settings</h3>
          <div class="setting-item">
            <label class="setting-label">Auto Memory Extraction</label>
            <div class="setting-control">
              <div class="toggle-switch" id="auto-memory-toggle"></div>
            </div>
          </div>
          <div class="setting-item">
            <label class="setting-label">Memory Retention (days)</label>
            <div class="setting-control">
              <input type="number" id="memory-retention" min="1" max="365" value="30" />
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>Appearance</h3>
          <div class="setting-item">
            <label class="setting-label">Theme</label>
            <div class="setting-control">
              <select id="theme-select">
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
          <div class="setting-item">
            <label class="setting-label">Font Size</label>
            <div class="setting-control">
              <select id="font-size">
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>Data Management</h3>
          <div class="setting-item">
            <label class="setting-label">Export Data</label>
            <div class="setting-control">
              <button id="export-btn">Export All Data</button>
            </div>
          </div>
          <div class="setting-item">
            <label class="setting-label">Import Data</label>
            <div class="setting-control">
              <input type="file" id="import-file" accept=".json" style="display: none;" />
              <button id="import-btn">Import Data</button>
            </div>
          </div>
          <div class="setting-item">
            <label class="setting-label">Clear All Data</label>
            <div class="setting-control">
              <button id="clear-data-btn" class="danger">Clear All Data</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  initializeChatTab() {
    // Chat tab initialization is handled by the main app
  }

  initializeRolesTab() {
    // Role creation button
    document.getElementById('create-role-btn').addEventListener('click', () => {
      window.app.roles.showCreateRoleModal();
    });
  }

  initializeMemoryTab() {
    // Memory creation button
    document.getElementById('create-memory-btn').addEventListener('click', () => {
      window.app.memory.showCreateMemoryModal();
    });

    // Memory search
    document.getElementById('memory-search').addEventListener('input', (e) => {
      window.app.memory.filterMemories(e.target.value);
    });

    // Memory filter
    document.getElementById('memory-filter').addEventListener('change', (e) => {
      window.app.memory.filterMemoriesByTag(e.target.value);
    });
  }

  initializeDiaryTab() {
    // Generate diary button
    document.getElementById('generate-diary-btn').addEventListener('click', () => {
      window.app.generateSummary();
    });

    // Diary filter
    document.getElementById('diary-filter').addEventListener('change', (e) => {
      window.app.ui.filterDiaryEntries(e.target.value);
    });
  }

  initializeGalleryTab() {
    // Upload button
    document.getElementById('upload-gallery-btn').addEventListener('click', () => {
      document.getElementById('image-upload').click();
    });

    // Clear gallery
    document.getElementById('clear-gallery-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all gallery items?')) {
        window.app.storage.clear('gallery');
        window.app.ui.updateGallery();
      }
    });
  }

  initializeNotesTab() {
    // Note editor
    const editor = document.getElementById('note-editor');
    const wordCount = document.getElementById('note-word-count');
    
    editor.addEventListener('input', () => {
      const words = editor.value.trim().split(/\s+/).filter(word => word.length > 0);
      wordCount.textContent = `${words.length} words`;
    });

    // Save note button
    document.getElementById('save-note-btn').addEventListener('click', () => {
      window.app.ui.saveCurrentNote();
    });

    // New note button
    document.getElementById('new-note-btn').addEventListener('click', () => {
      window.app.ui.createNewNote();
    });
  }

  initializeMusicTab() {
    // Music controls
    document.getElementById('music-play-btn').addEventListener('click', () => {
      window.app.ui.toggleMusicPlayback();
    });

    document.getElementById('music-prev-btn').addEventListener('click', () => {
      window.app.ui.playPreviousTrack();
    });

    document.getElementById('music-next-btn').addEventListener('click', () => {
      window.app.ui.playNextTrack();
    });
  }

  initializeSettingsTab() {
    // API key
    document.getElementById('test-api-btn').addEventListener('click', () => {
      window.app.api.testConnection().then(success => {
        if (success) {
          alert('API connection successful!');
        } else {
          alert('API connection failed. Please check your API key.');
        }
      });
    });

    // Toggle switches
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        const setting = toggle.id.replace('-toggle', '');
        const value = toggle.classList.contains('active');
        window.app.storage.saveSetting(setting, value);
      });
    });

    // Export/Import
    document.getElementById('export-btn').addEventListener('click', () => {
      window.app.ui.exportData();
    });

    document.getElementById('import-btn').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', (e) => {
      window.app.ui.importData(e.target.files[0]);
    });

    // Clear data
    document.getElementById('clear-data-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        window.app.ui.clearAllData();
      }
    });
  }
}
