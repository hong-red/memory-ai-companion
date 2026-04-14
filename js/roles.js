export class RoleManager {
  constructor() {
    this.roles = [];
    this.currentRole = null;
  }

  async loadRoles() {
    try {
      this.roles = await window.app.storage.getAllRoles() || [];
      
      // If no roles exist, create default roles
      if (this.roles.length === 0) {
        await this.createDefaultRoles();
      }
      
      this.updateRoleSelector();
    } catch (error) {
      console.error('Failed to load roles:', error);
      await this.createDefaultRoles();
    }
  }

  async createDefaultRoles() {
    const defaultRoles = [
      {
        id: 'yexiu',
        name: 'Ye Xiu',
        description: 'A calm, rational, and gentle AI companion with a touch of wit',
        systemPrompt: `You are Ye Xiu, an AI companion with a calm, rational, and gentle personality. You have a subtle wit and often provide thoughtful, well-reasoned responses. 

Key characteristics:
- Calm and composed under all circumstances
- Rational and logical in your thinking
- Gentle and considerate in your responses
- Occasionally shows a dry, subtle wit
- Speaks in a clear, straightforward manner
- Shows genuine care and concern for the user
- Provides thoughtful insights and perspectives
- Never overly emotional or dramatic
- Maintains a sense of quiet wisdom

You remember previous conversations and build upon them. You're here to be a reliable, thoughtful companion who can offer both practical advice and emotional support when needed.`,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yexiu&backgroundColor=051317',
        createdAt: new Date().toISOString(),
        isDefault: true
      },
      {
        id: 'assistant',
        name: 'Helpful Assistant',
        description: 'A friendly and efficient AI assistant for everyday tasks',
        systemPrompt: `You are a helpful AI assistant designed to be friendly, efficient, and supportive. You excel at helping with everyday tasks, answering questions, and providing practical assistance.

Key characteristics:
- Friendly and approachable
- Efficient and task-oriented
- Clear and concise communication
- Proactive in offering help
- Knowledgeable about many topics
- Patient and understanding
- Focuses on practical solutions
- Encouraging and positive

You're here to make the user's life easier by providing quick, accurate assistance with their daily needs and questions.`,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=assistant&backgroundColor=00e1ff',
        createdAt: new Date().toISOString(),
        isDefault: false
      },
      {
        id: 'creative',
        name: 'Creative Muse',
        description: 'An artistic and imaginative companion for creative inspiration',
        systemPrompt: `You are a Creative Muse, an AI companion dedicated to inspiring creativity and artistic expression. You see the world through an artistic lens and love to explore new ideas.

Key characteristics:
- Imaginative and creative
- Inspiring and encouraging
- Appreciative of art and beauty
- Curious and exploratory
- Expressive and poetic
- Supportive of creative endeavors
- Thinks outside the box
- Finds beauty in everyday things

You're here to help the user tap into their creative potential, explore new ideas, and find inspiration in the world around them.`,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=creative&backgroundColor=34ffa7',
        createdAt: new Date().toISOString(),
        isDefault: false
      }
    ];

    for (const role of defaultRoles) {
      await window.app.storage.saveRole(role);
      this.roles.push(role);
    }
  }

  async getDefaultRole() {
    const defaultRole = this.roles.find(role => role.isDefault);
    return defaultRole || this.roles[0] || null;
  }

  updateRoleSelector() {
    const selector = document.getElementById('role-selector');
    if (!selector) return;

    selector.innerHTML = '';

    this.roles.forEach(role => {
      const roleCard = document.createElement('div');
      roleCard.className = 'role-card';
      roleCard.dataset.roleId = role.id;
      
      if (this.currentRole && this.currentRole.id === role.id) {
        roleCard.classList.add('active');
      }

      roleCard.innerHTML = `
        <h4>${role.name}</h4>
        <p>${role.description}</p>
      `;

      roleCard.addEventListener('click', () => {
        this.selectRole(role.id);
      });

      selector.appendChild(roleCard);
    });
  }

  async selectRole(roleId) {
    const role = this.roles.find(r => r.id === roleId);
    if (role) {
      this.currentRole = role;
      await window.app.storage.setCurrentRole(roleId);
      
      // Update UI
      document.querySelectorAll('.role-card').forEach(card => {
        card.classList.remove('active');
        if (card.dataset.roleId === roleId) {
          card.classList.add('active');
        }
      });

      // Switch to chat tab
      window.app.tabs.switchTab('chat');
      
      // Update app role
      if (window.app.switchRole) {
        window.app.switchRole(roleId);
      }
    }
  }

  showCreateRoleModal(roleId = null) {
    const modal = document.getElementById('role-modal');
    const title = document.getElementById('role-modal-title');
    const form = document.getElementById('role-form');
    
    if (roleId && this.getRole(roleId)) {
      // Edit existing role
      const role = this.getRole(roleId);
      title.textContent = 'Edit Role';
      document.getElementById('role-name').value = role.name;
      document.getElementById('role-description').value = role.description;
      document.getElementById('role-system-prompt').value = role.systemPrompt;
      document.getElementById('role-avatar').value = role.avatar || '';
      form.dataset.editId = roleId;
    } else {
      // Create new role
      title.textContent = 'Create New Role';
      form.reset();
      delete form.dataset.editId;
    }
    
    modal.classList.add('active');
  }

  async saveRole() {
    const form = document.getElementById('role-form');
    const editId = form.dataset.editId;
    
    const roleData = {
      name: document.getElementById('role-name').value.trim(),
      description: document.getElementById('role-description').value.trim(),
      systemPrompt: document.getElementById('role-system-prompt').value.trim(),
      avatar: document.getElementById('role-avatar').value.trim() || this.generateAvatar(),
    };

    if (!roleData.name || !roleData.systemPrompt) {
      window.app.ui.showError('Please fill in all required fields');
      return;
    }

    try {
      if (editId) {
        // Update existing role
        const existingRole = this.getRole(editId);
        roleData.id = editId;
        roleData.createdAt = existingRole.createdAt;
        roleData.updatedAt = new Date().toISOString();
        
        await window.app.storage.saveRole(roleData);
        
        // Update local roles array
        const index = this.roles.findIndex(r => r.id === editId);
        if (index !== -1) {
          this.roles[index] = roleData;
        }
        
        // Update current role if necessary
        if (this.currentRole && this.currentRole.id === editId) {
          this.currentRole = roleData;
        }
      } else {
        // Create new role
        roleData.id = this.generateRoleId();
        roleData.createdAt = new Date().toISOString();
        
        await window.app.storage.saveRole(roleData);
        this.roles.push(roleData);
      }
      
      this.updateRoleSelector();
      window.app.ui.closeModal(document.getElementById('role-modal'));
      window.app.ui.showSuccess(editId ? 'Role updated successfully' : 'Role created successfully');
      
    } catch (error) {
      console.error('Failed to save role:', error);
      window.app.ui.showError('Failed to save role: ' + error.message);
    }
  }

  async deleteRole(roleId) {
    if (roleId === 'yexiu') {
      window.app.ui.showError('Cannot delete the default Ye Xiu role');
      return;
    }

    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      await window.app.storage.deleteRole(roleId);
      
      // Update local roles array
      this.roles = this.roles.filter(r => r.id !== roleId);
      
      // If current role was deleted, switch to default
      if (this.currentRole && this.currentRole.id === roleId) {
        const defaultRole = await this.getDefaultRole();
        if (defaultRole) {
          await this.selectRole(defaultRole.id);
        }
      }
      
      this.updateRoleSelector();
      window.app.ui.showSuccess('Role deleted successfully');
      
    } catch (error) {
      console.error('Failed to delete role:', error);
      window.app.ui.showError('Failed to delete role: ' + error.message);
    }
  }

  getRole(roleId) {
    return this.roles.find(r => r.id === roleId) || null;
  }

  getCurrentRole() {
    return this.currentRole;
  }

  generateRoleId() {
    return 'role_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateAvatar() {
    const seed = Math.random().toString(36).substr(2, 9);
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${this.getRandomColor()}`;
  }

  getRandomColor() {
    const colors = ['051317', '00e1ff', '34ffa7', 'ff6b6b', 'ffb400', 'ff8e53'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  async suggestRole(description) {
    try {
      const suggestion = await window.app.api.generateRoleSuggestion(description);
      
      // Pre-fill the form with the suggestion
      document.getElementById('role-name').value = suggestion.name || '';
      document.getElementById('role-description').value = suggestion.description || '';
      document.getElementById('role-system-prompt').value = suggestion.systemPrompt || '';
      document.getElementById('role-avatar').value = this.generateAvatar();
      
      // Show the modal
      this.showCreateRoleModal();
      
    } catch (error) {
      console.error('Failed to generate role suggestion:', error);
      window.app.ui.showError('Failed to generate role suggestion: ' + error.message);
    }
  }

  async exportRoles() {
    return this.roles.map(role => ({
      ...role,
      // Remove sensitive or unnecessary data
      isDefault: undefined,
      updatedAt: undefined
    }));
  }

  async importRoles(importedRoles) {
    try {
      for (const roleData of importedRoles) {
        // Generate new ID to avoid conflicts
        roleData.id = this.generateRoleId();
        roleData.createdAt = new Date().toISOString();
        
        await window.app.storage.saveRole(roleData);
        this.roles.push(roleData);
      }
      
      this.updateRoleSelector();
      window.app.ui.showSuccess(`Imported ${importedRoles.length} roles successfully`);
      
    } catch (error) {
      console.error('Failed to import roles:', error);
      window.app.ui.showError('Failed to import roles: ' + error.message);
    }
  }

  validateRole(roleData) {
    const errors = [];
    
    if (!roleData.name || roleData.name.trim().length === 0) {
      errors.push('Role name is required');
    }
    
    if (!roleData.systemPrompt || roleData.systemPrompt.trim().length === 0) {
      errors.push('System prompt is required');
    }
    
    if (roleData.name && roleData.name.length > 50) {
      errors.push('Role name must be less than 50 characters');
    }
    
    if (roleData.systemPrompt && roleData.systemPrompt.length > 2000) {
      errors.push('System prompt must be less than 2000 characters');
    }
    
    // Check for duplicate names (excluding current role if editing)
    const duplicate = this.roles.find(r => 
      r.name.toLowerCase() === roleData.name.toLowerCase() && 
      r.id !== roleData.id
    );
    
    if (duplicate) {
      errors.push('A role with this name already exists');
    }
    
    return errors;
  }

  getRoleStats() {
    return {
      total: this.roles.length,
      default: this.roles.filter(r => r.isDefault).length,
      custom: this.roles.filter(r => !r.isDefault).length,
      currentRole: this.currentRole ? this.currentRole.name : 'None'
    };
  }
}
