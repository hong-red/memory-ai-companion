// API 服务类
class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(url, options = {}) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.logout();
        throw new Error('Unauthorized');
      }
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // 认证相关
  async register(username, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.token = data.token;
    localStorage.setItem('auth_token', this.token);
    return data;
  }

  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.token = data.token;
    localStorage.setItem('auth_token', this.token);
    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  isAuthenticated() {
    return !!this.token;
  }

  // 角色相关
  async getRoles() {
    return this.request('/roles');
  }

  async createRole(roleData) {
    return this.request('/roles', {
      method: 'POST',
      body: JSON.stringify(roleData)
    });
  }

  async updateRole(roleId, roleData) {
    return this.request(`/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(roleData)
    });
  }

  async deleteRole(roleId) {
    return this.request(`/roles/${roleId}`, {
      method: 'DELETE'
    });
  }

  // 聊天记录相关
  async getChatHistory(roleId) {
    return this.request(`/chat/${roleId}`);
  }

  async addChatMessage(roleId, role, content) {
    return this.request(`/chat/${roleId}`, {
      method: 'POST',
      body: JSON.stringify({ role, content })
    });
  }

  async clearChatHistory(roleId) {
    return this.request(`/chat/${roleId}`, {
      method: 'DELETE'
    });
  }

  // 日记相关
  async getDiaries() {
    return this.request('/diaries');
  }

  async getDiary(diaryId) {
    return this.request(`/diaries/${diaryId}`);
  }

  async createDiary(diaryData) {
    return this.request('/diaries', {
      method: 'POST',
      body: JSON.stringify(diaryData)
    });
  }

  async updateDiary(diaryId, diaryData) {
    return this.request(`/diaries/${diaryId}`, {
      method: 'PUT',
      body: JSON.stringify(diaryData)
    });
  }

  async deleteDiary(diaryId) {
    return this.request(`/diaries/${diaryId}`, {
      method: 'DELETE'
    });
  }

  // 设置相关
  async getSettings() {
    return this.request('/settings');
  }

  async updateSettings(settings) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  // 文件上传
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }
}

// 创建 API 服务实例
const api = new ApiService();
