export class Storage {
  constructor() {
    this.dbName = 'AICompanionDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('roles')) {
          const roleStore = db.createObjectStore('roles', { keyPath: 'id' });
          roleStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('chatHistory')) {
          const chatStore = db.createObjectStore('chatHistory', { keyPath: 'id' });
          chatStore.createIndex('timestamp', 'timestamp', { unique: false });
          chatStore.createIndex('roleId', 'roleId', { unique: false });
        }

        if (!db.objectStoreNames.contains('memories')) {
          const memoryStore = db.createObjectStore('memories', { keyPath: 'id' });
          memoryStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          memoryStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('diary')) {
          const diaryStore = db.createObjectStore('diary', { keyPath: 'id' });
          diaryStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains('gallery')) {
          const galleryStore = db.createObjectStore('gallery', { keyPath: 'id' });
          galleryStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('music')) {
          const musicStore = db.createObjectStore('music', { keyPath: 'id' });
          musicStore.createIndex('title', 'title', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  // Generic methods
  async save(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName, indexName = null, value = null) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      
      let request;
      if (indexName && value !== null) {
        const index = store.index(indexName);
        request = index.getAll(value);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Role methods
  async saveRole(role) {
    return this.save('roles', role);
  }

  async getRole(id) {
    return this.get('roles', id);
  }

  async getAllRoles() {
    return this.getAll('roles');
  }

  async deleteRole(id) {
    return this.delete('roles', id);
  }

  async getCurrentRole() {
    return this.get('settings', 'currentRole');
  }

  async setCurrentRole(roleId) {
    return this.save('settings', { key: 'currentRole', value: roleId });
  }

  // Chat history methods
  async saveChatHistory(messages) {
    const transaction = this.db.transaction('chatHistory', 'readwrite');
    const store = transaction.objectStore('chatHistory');
    
    // Clear existing messages
    await this.clear('chatHistory');
    
    // Save new messages
    for (const message of messages) {
      store.put(message);
    }
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getChatHistory() {
    return this.getAll('chatHistory', 'timestamp');
  }

  async addChatMessage(message) {
    return this.save('chatHistory', message);
  }

  async clearChatHistory() {
    return this.clear('chatHistory');
  }

  // Memory methods
  async saveMemory(memory) {
    return this.save('memories', memory);
  }

  async getMemory(id) {
    return this.get('memories', id);
  }

  async getAllMemories() {
    return this.getAll('memories', 'timestamp');
  }

  async getMemoriesByTag(tag) {
    return this.getAll('memories', 'tags', tag);
  }

  async deleteMemory(id) {
    return this.delete('memories', id);
  }

  // Diary methods
  async saveDiaryEntry(entry) {
    return this.save('diary', entry);
  }

  async getDiaryEntry(id) {
    return this.get('diary', id);
  }

  async getAllDiaryEntries() {
    return this.getAll('diary', 'date');
  }

  async deleteDiaryEntry(id) {
    return this.delete('diary', id);
  }

  // Gallery methods
  async saveGalleryItem(item) {
    return this.save('gallery', item);
  }

  async getGalleryItem(id) {
    return this.get('gallery', id);
  }

  async getAllGalleryItems() {
    return this.getAll('gallery', 'timestamp');
  }

  async deleteGalleryItem(id) {
    return this.delete('gallery', id);
  }

  // Notes methods
  async saveNote(note) {
    return this.save('notes', note);
  }

  async getNote(id) {
    return this.get('notes', id);
  }

  async getAllNotes() {
    return this.getAll('notes', 'timestamp');
  }

  async deleteNote(id) {
    return this.delete('notes', id);
  }

  // Music methods
  async saveMusicTrack(track) {
    return this.save('music', track);
  }

  async getMusicTrack(id) {
    return this.get('music', id);
  }

  async getAllMusicTracks() {
    return this.getAll('music', 'title');
  }

  async deleteMusicTrack(id) {
    return this.delete('music', id);
  }

  // Settings methods
  async saveSetting(key, value) {
    return this.save('settings', { key, value });
  }

  async getSetting(key) {
    const setting = await this.get('settings', key);
    return setting ? setting.value : null;
  }

  async getAllSettings() {
    const settings = await this.getAll('settings');
    const result = {};
    settings.forEach(setting => {
      result[setting.key] = setting.value;
    });
    return result;
  }

  // Utility methods
  async exportData() {
    const data = {
      roles: await this.getAllRoles(),
      chatHistory: await this.getChatHistory(),
      memories: await this.getAllMemories(),
      diary: await this.getAllDiaryEntries(),
      gallery: await this.getAllGalleryItems(),
      notes: await this.getAllNotes(),
      music: await this.getAllMusicTracks(),
      settings: await this.getAllSettings(),
      exportDate: new Date().toISOString()
    };
    return data;
  }

  async importData(data) {
    try {
      // Clear existing data
      await this.clear('roles');
      await this.clear('chatHistory');
      await this.clear('memories');
      await this.clear('diary');
      await this.clear('gallery');
      await this.clear('notes');
      await this.clear('music');
      await this.clear('settings');

      // Import new data
      if (data.roles) {
        for (const role of data.roles) {
          await this.saveRole(role);
        }
      }

      if (data.chatHistory) {
        for (const message of data.chatHistory) {
          await this.addChatMessage(message);
        }
      }

      if (data.memories) {
        for (const memory of data.memories) {
          await this.saveMemory(memory);
        }
      }

      if (data.diary) {
        for (const entry of data.diary) {
          await this.saveDiaryEntry(entry);
        }
      }

      if (data.gallery) {
        for (const item of data.gallery) {
          await this.saveGalleryItem(item);
        }
      }

      if (data.notes) {
        for (const note of data.notes) {
          await this.saveNote(note);
        }
      }

      if (data.music) {
        for (const track of data.music) {
          await this.saveMusicTrack(track);
        }
      }

      if (data.settings) {
        for (const [key, value] of Object.entries(data.settings)) {
          await this.saveSetting(key, value);
        }
      }

      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }

  // LocalStorage fallback for simple settings
  setLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('LocalStorage not available:', error);
    }
  }

  getLocalStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('LocalStorage not available:', error);
      return defaultValue;
    }
  }

  removeLocalStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('LocalStorage not available:', error);
    }
  }
}
