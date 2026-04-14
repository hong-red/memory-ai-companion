export class MemoryManager {
  constructor() {
    this.memories = [];
    this.filteredMemories = [];
    this.currentFilter = 'all';
  }

  async loadMemories() {
    try {
      this.memories = await window.app.storage.getAllMemories() || [];
      this.filteredMemories = [...this.memories];
      this.updateMemoryGrid();
    } catch (error) {
      console.error('Failed to load memories:', error);
      this.memories = [];
      this.filteredMemories = [];
    }
  }

  showCreateMemoryModal(memoryId = null) {
    const modal = document.getElementById('memory-modal');
    const title = document.getElementById('memory-modal-title');
    const form = document.getElementById('memory-form');
    
    if (memoryId && this.getMemory(memoryId)) {
      // Edit existing memory
      const memory = this.getMemory(memoryId);
      title.textContent = 'Edit Memory Card';
      document.getElementById('memory-title').value = memory.title;
      document.getElementById('memory-content').value = memory.content;
      document.getElementById('memory-tags').value = memory.tags.join(', ');
      form.dataset.editId = memoryId;
    } else {
      // Create new memory
      title.textContent = 'Create Memory Card';
      form.reset();
      delete form.dataset.editId;
    }
    
    modal.classList.add('active');
  }

  async saveMemory() {
    const form = document.getElementById('memory-form');
    const editId = form.dataset.editId;
    
    const memoryData = {
      title: document.getElementById('memory-title').value.trim(),
      content: document.getElementById('memory-content').value.trim(),
      tags: this.parseTags(document.getElementById('memory-tags').value),
    };

    if (!memoryData.title || !memoryData.content) {
      window.app.ui.showError('Please fill in all required fields');
      return;
    }

    try {
      if (editId) {
        // Update existing memory
        const existingMemory = this.getMemory(editId);
        memoryData.id = editId;
        memoryData.createdAt = existingMemory.createdAt;
        memoryData.updatedAt = new Date().toISOString();
        
        await window.app.storage.saveMemory(memoryData);
        
        // Update local memories array
        const index = this.memories.findIndex(m => m.id === editId);
        if (index !== -1) {
          this.memories[index] = memoryData;
        }
      } else {
        // Create new memory
        memoryData.id = this.generateMemoryId();
        memoryData.createdAt = new Date().toISOString();
        
        await window.app.storage.saveMemory(memoryData);
        this.memories.push(memoryData);
      }
      
      this.filterMemories(this.currentFilter);
      window.app.ui.closeModal(document.getElementById('memory-modal'));
      window.app.ui.showSuccess(editId ? 'Memory updated successfully' : 'Memory created successfully');
      
    } catch (error) {
      console.error('Failed to save memory:', error);
      window.app.ui.showError('Failed to save memory: ' + error.message);
    }
  }

  async deleteMemory(memoryId) {
    if (!confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
      return;
    }

    try {
      await window.app.storage.deleteMemory(memoryId);
      
      // Update local memories array
      this.memories = this.memories.filter(m => m.id !== memoryId);
      
      this.filterMemories(this.currentFilter);
      window.app.ui.showSuccess('Memory deleted successfully');
      
    } catch (error) {
      console.error('Failed to delete memory:', error);
      window.app.ui.showError('Failed to delete memory: ' + error.message);
    }
  }

  parseTags(tagString) {
    if (!tagString) return [];
    
    return tagString
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 10); // Limit to 10 tags
  }

  generateMemoryId() {
    return 'memory_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getMemory(memoryId) {
    return this.memories.find(m => m.id === memoryId) || null;
  }

  filterMemories(searchTerm = '') {
    if (searchTerm) {
      this.filteredMemories = this.memories.filter(memory => 
        memory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.tags.some(tag => tag.includes(searchTerm.toLowerCase()))
      );
    } else {
      this.filteredMemories = [...this.memories];
    }
    
    this.updateMemoryGrid();
  }

  filterMemoriesByTag(tag) {
    this.currentFilter = tag;
    
    if (tag === 'all') {
      this.filteredMemories = [...this.memories];
    } else {
      this.filteredMemories = this.memories.filter(memory => 
        memory.tags.includes(tag)
      );
    }
    
    this.updateMemoryGrid();
  }

  updateMemoryGrid() {
    const grid = document.getElementById('memory-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (this.filteredMemories.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>No memories found. Create your first memory card to get started!</p>
        </div>
      `;
      return;
    }

    // Sort by creation date (newest first)
    const sortedMemories = [...this.filteredMemories].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    sortedMemories.forEach(memory => {
      const memoryCard = document.createElement('div');
      memoryCard.className = 'memory-card';
      memoryCard.dataset.memoryId = memory.id;

      memoryCard.innerHTML = `
        <h4>${this.escapeHtml(memory.title)}</h4>
        <p>${this.escapeHtml(memory.content)}</p>
        <div class="memory-tags">
          ${memory.tags.map(tag => `<span class="memory-tag">${this.escapeHtml(tag)}</span>`).join('')}
        </div>
        <div class="memory-actions">
          <button class="edit-memory-btn" data-memory-id="${memory.id}">Edit</button>
          <button class="delete-memory-btn" data-memory-id="${memory.id}">Delete</button>
        </div>
      `;

      // Add event listeners
      const editBtn = memoryCard.querySelector('.edit-memory-btn');
      const deleteBtn = memoryCard.querySelector('.delete-memory-btn');

      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showCreateMemoryModal(memory.id);
      });

      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteMemory(memory.id);
      });

      memoryCard.addEventListener('click', () => {
        this.showMemoryDetails(memory);
      });

      grid.appendChild(memoryCard);
    });
  }

  showMemoryDetails(memory) {
    // Create a simple modal to show memory details
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${this.escapeHtml(memory.title)}</h3>
          <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p><strong>Created:</strong> ${new Date(memory.createdAt).toLocaleDateString()}</p>
          ${memory.updatedAt ? `<p><strong>Updated:</strong> ${new Date(memory.updatedAt).toLocaleDateString()}</p>` : ''}
          <div class="memory-tags">
            ${memory.tags.map(tag => `<span class="memory-tag">${this.escapeHtml(tag)}</span>`).join('')}
          </div>
          <hr style="margin: 16px 0; opacity: 0.3;">
          <p>${this.escapeHtml(memory.content)}</p>
        </div>
        <div class="modal-actions">
          <button class="edit-memory-btn">Edit</button>
          <button class="delete-memory-btn">Delete</button>
          <button class="close-btn">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    modal.querySelector('.close-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('.edit-memory-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
      this.showCreateMemoryModal(memory.id);
    });

    modal.querySelector('.delete-memory-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
      this.deleteMemory(memory.id);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  async extractMemories(userMessage, botResponse) {
    try {
      const extractedMemories = await window.app.api.extractMemories([
        { role: 'user', content: userMessage },
        { role: 'bot', content: botResponse }
      ]);

      for (const memoryData of extractedMemories) {
        // Check if similar memory already exists
        const existingMemory = this.memories.find(m => 
          m.title.toLowerCase() === memoryData.title.toLowerCase()
        );

        if (!existingMemory) {
          const newMemory = {
            id: this.generateMemoryId(),
            title: memoryData.title,
            content: memoryData.content,
            tags: memoryData.tags || [],
            createdAt: new Date().toISOString(),
            autoExtracted: true
          };

          await window.app.storage.saveMemory(newMemory);
          this.memories.push(newMemory);
        }
      }

      this.filterMemories(this.currentFilter);
      
      if (extractedMemories.length > 0) {
        window.app.ui.showSuccess(`Extracted ${extractedMemories.length} new memories`);
      }

    } catch (error) {
      console.error('Failed to extract memories:', error);
    }
  }

  getMemoryStats() {
    const tagCounts = {};
    this.memories.forEach(memory => {
      memory.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return {
      total: this.memories.length,
      autoExtracted: this.memories.filter(m => m.autoExtracted).length,
      manual: this.memories.filter(m => !m.autoExtracted).length,
      topTags: Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }))
    };
  }

  async searchMemories(query) {
    if (!query) return this.memories;

    const searchTerms = query.toLowerCase().split(' ');
    
    return this.memories.filter(memory => {
      const searchText = `${memory.title} ${memory.content} ${memory.tags.join(' ')}`.toLowerCase();
      return searchTerms.every(term => searchText.includes(term));
    });
  }

  getRelatedMemories(currentMessage, limit = 3) {
    if (!currentMessage || this.memories.length === 0) return [];

    const messageWords = currentMessage.toLowerCase().split(' ');
    const memoryScores = [];

    this.memories.forEach(memory => {
      let score = 0;
      const memoryText = `${memory.title} ${memory.content} ${memory.tags.join(' ')}`.toLowerCase();

      messageWords.forEach(word => {
        if (memoryText.includes(word)) {
          score += 1;
        }
      });

      // Boost score for recent memories
      const daysSinceCreation = (Date.now() - new Date(memory.createdAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 7) {
        score += 0.5;
      }

      if (score > 0) {
        memoryScores.push({ memory, score });
      }
    });

    return memoryScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.memory);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async exportMemories() {
    return this.memories.map(memory => ({
      ...memory,
      // Remove sensitive data
      autoExtracted: undefined,
      updatedAt: undefined
    }));
  }

  async importMemories(importedMemories) {
    try {
      let importedCount = 0;
      
      for (const memoryData of importedMemories) {
        // Check for duplicates
        const existingMemory = this.memories.find(m => 
          m.title.toLowerCase() === memoryData.title.toLowerCase()
        );

        if (!existingMemory) {
          // Generate new ID and timestamps
          memoryData.id = this.generateMemoryId();
          memoryData.createdAt = new Date().toISOString();
          
          await window.app.storage.saveMemory(memoryData);
          this.memories.push(memoryData);
          importedCount++;
        }
      }
      
      this.filterMemories(this.currentFilter);
      window.app.ui.showSuccess(`Imported ${importedCount} memories successfully`);
      
    } catch (error) {
      console.error('Failed to import memories:', error);
      window.app.ui.showError('Failed to import memories: ' + error.message);
    }
  }

  async clearOldMemories(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const oldMemories = this.memories.filter(memory => 
      new Date(memory.createdAt) < cutoffDate && !memory.autoExtracted
    );

    for (const memory of oldMemories) {
      await window.app.storage.deleteMemory(memory.id);
    }

    this.memories = this.memories.filter(memory => 
      new Date(memory.createdAt) >= cutoffDate || memory.autoExtracted
    );

    this.filterMemories(this.currentFilter);
    
    if (oldMemories.length > 0) {
      window.app.ui.showSuccess(`Cleared ${oldMemories.length} old memories`);
    }
  }
}
