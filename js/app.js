// 主应用类
class SmallWorldApp {
  constructor() {
    this.currentTab = 'home';
    this.currentRole = null;
    this.chatHistory = [];
    this.diaries = [];
    this.roles = [];
    this.apiKey = '';
    this.apiUrl = DEFAULT_CONFIG.apiUrl;
    this.model = DEFAULT_CONFIG.model;
    this.isRecording = false;
    this.recognition = null;
    this.isProcessing = false;
    this.currentDiary = null;
    this.chatBackground = '';
    this.userAvatar = '';
    this.botAvatar = '';
    this.settings = {};
    this.voiceInput = false;
    this.voiceOutput = false;
    this.user = null;
    this.ui = new UIRenderer(this);
    this.init();
  }

  async init() {
    if (!api.isAuthenticated()) {
      this.showLoginModal();
      return;
    }

    try {
      await this.loadUserData();
      this.setupEventListeners();
      this.initSpeechRecognition();
      this.showTab('home');
    } catch (error) {
      console.error('Initialization error:', error);
      this.showNotification('加载数据失败，请重新登录', 'error');
      this.logout();
    }
  }

  async loadUserData() {
    const [roles, diaries, settings] = await Promise.all([
      api.getRoles(),
      api.getDiaries(),
      api.getSettings()
    ]);

    this.roles = roles;
    this.diaries = diaries;
    this.settings = settings || {};

    this.apiKey = this.settings.api_key || '';
    this.apiUrl = this.settings.api_url || DEFAULT_CONFIG.apiUrl;
    this.model = this.settings.model || DEFAULT_CONFIG.model;
    this.voiceInput = this.settings.voice_input || false;
    this.voiceOutput = this.settings.voice_output || false;
    this.chatBackground = this.settings.chat_background || '';
    this.userAvatar = this.settings.user_avatar || '';
    this.botAvatar = this.settings.bot_avatar || '';

    if (this.settings.current_role_id) {
      this.currentRole = this.roles.find(r => r.id === this.settings.current_role_id);
    }

    if (!this.currentRole) {
      this.currentRole = this.roles.find(r => r.is_default) || this.roles[0];
    }

    if (this.currentRole) {
      await this.loadChatHistory(this.currentRole.id);
    }
  }

  async loadChatHistory(roleId) {
    try {
      this.chatHistory = await api.getChatHistory(roleId);
    } catch (error) {
      console.error('Error loading chat history:', error);
      this.chatHistory = [];
    }
  }

  showLoginModal() {
    const modalHtml = this.ui.getLoginModal();
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    let isLogin = true;
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const authForm = document.getElementById('auth-form');
    const authError = document.getElementById('auth-error');

    const updateTabs = () => {
      if (isLogin) {
        loginTab.classList.add('submit-btn');
        loginTab.classList.remove('cancel-btn');
        registerTab.classList.add('cancel-btn');
        registerTab.classList.remove('submit-btn');
      } else {
        registerTab.classList.add('submit-btn');
        registerTab.classList.remove('cancel-btn');
        loginTab.classList.add('cancel-btn');
        loginTab.classList.remove('submit-btn');
      }
    };

    loginTab.addEventListener('click', () => {
      isLogin = true;
      updateTabs();
    });

    registerTab.addEventListener('click', () => {
      isLogin = false;
      updateTabs();
    });

    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('auth-username').value;
      const password = document.getElementById('auth-password').value;

      try {
        if (isLogin) {
          await api.login(username, password);
        } else {
          await api.register(username, password);
        }
        document.getElementById('auth-modal').remove();
        await this.init();
      } catch (error) {
        authError.textContent = error.message;
        authError.style.display = 'block';
      }
    });
  }

  logout() {
    api.logout();
    location.reload();
  }

  setupEventListeners() {
    document.getElementById('nav').addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        this.showTab(e.target.dataset.tab);
      }
    });

    document.querySelectorAll('.close-btn, .cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeModal('role-modal');
      });
    });

    document.getElementById('role-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveRole();
    });
  }

  initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'zh-CN';

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const input = document.getElementById('input');
        if (input) {
          input.value = transcript;
          this.showNotification('语音识别完成，请按发送', 'success');
        }
      };

      this.recognition.onerror = (event) => {
        console.error('语音识别错误:', event.error);
        this.showNotification('语音识别失败: ' + event.error, 'error');
        this.stopRecording();
      };

      this.recognition.onend = () => {
        this.stopRecording();
      };
    }
  }

  showTab(tabName) {
    document.querySelectorAll('#nav button').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      }
    });

    const tabContent = document.getElementById('tab-content');

    switch(tabName) {
      case 'home':
        tabContent.innerHTML = this.ui.getHomeTab();
        break;
      case 'chat':
        tabContent.innerHTML = this.ui.getChatTab();
        this.setupChatEvents();
        break;
      case 'diary':
        tabContent.innerHTML = this.ui.getDiaryTab();
        break;
      case 'roles':
        tabContent.innerHTML = this.ui.getRolesTab();
        break;
      case 'settings':
        tabContent.innerHTML = this.ui.getSettingsTab();
        this.setupSettingsEvents();
        break;
    }

    this.currentTab = tabName;
  }

  setupChatEvents() {
    const input = document.getElementById('input');
    const sendBtn = document.getElementById('send-btn');
    const voiceBtn = document.getElementById('voice-btn');

    sendBtn.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    voiceBtn.onclick = () => {
      this.toggleVoiceRecording(voiceBtn);
    };
  }

  toggleVoiceRecording(button) {
    if (!this.recognition) {
      this.showNotification('您的浏览器不支持语音识别', 'error');
      return;
    }

    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording(button);
    }
  }

  startRecording(button) {
    try {
      this.recognition.start();
      this.isRecording = true;
      button.classList.add('recording');
      button.textContent = '停止';
      this.showNotification('正在录音...', 'info');
    } catch (e) {
      console.error('启动录音失败:', e);
      this.showNotification('无法启动录音', 'error');
    }
  }

  stopRecording() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
      const voiceBtn = document.getElementById('voice-btn');
      if (voiceBtn) {
        voiceBtn.classList.remove('recording');
        voiceBtn.textContent = '♪';
      }
    }
  }

  async sendMessage() {
    const input = document.getElementById('input');
    const message = input.value.trim();

    if (!message) return;

    this.addMessage('user', message);
    input.value = '';
    this.showTypingIndicator();

    try {
      await api.addChatMessage(this.currentRole.id, 'user', message);
    } catch (error) {
      console.error('Failed to save message:', error);
    }

    await this.getAIResponse(message);
  }

  addMessage(role, content) {
    const messageData = { role, content, timestamp: new Date().toISOString() };
    this.chatHistory.push(messageData);

    const container = document.getElementById('chat-container');
    if (container) {
      const messageHtml = this.ui.renderMessage(messageData);
      const indicator = document.getElementById('typing-indicator');
      indicator.insertAdjacentHTML('beforebegin', messageHtml);
      container.scrollTop = container.scrollHeight;
    }
  }

  showTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.classList.add('active');
    }
  }

  hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.classList.remove('active');
    }
  }

  async getAIResponse(userMessage) {
    if (!this.apiKey) {
      this.hideTypingIndicator();
      this.addMessage('bot', '请先设置API密钥才能开始对话。点击"设置"标签页添加您的Moonshot API密钥。');
      return;
    }

    try {
      const messages = this.buildAPIMessages(userMessage);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('请求太频繁，请稍后再试');
        }
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || '抱歉，我暂时无法回复。';

      this.hideTypingIndicator();
      this.addMessage('bot', aiResponse);

      try {
        await api.addChatMessage(this.currentRole.id, 'bot', aiResponse);
      } catch (error) {
        console.error('Failed to save AI response:', error);
      }

      if (this.voiceOutput) {
        this.speakText(aiResponse);
      }

    } catch (error) {
      console.error('API调用错误:', error);
      this.hideTypingIndicator();
      this.addMessage('bot', `抱歉，发生了错误：${error.message}`);
    }
  }

  buildAPIMessages(userMessage) {
    const messages = [];

    if (this.currentRole) {
      messages.push({
        role: 'system',
        content: this.currentRole.system_prompt
      });
    }

    const recentHistory = this.chatHistory.slice(-10);
    recentHistory.forEach(msg => {
      if (msg.role !== 'timestamp') {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    });

    messages.push({
      role: 'user',
      content: userMessage || '你好'
    });

    return messages;
  }

  speakText(text) {
    if ('speechSynthesis' in window) {
      const cleanText = text.replace(/[#*_`\[\]]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  }

  setupSettingsEvents() {
    const apiKeyInput = document.getElementById('api-key');
    const apiUrlInput = document.getElementById('api-url');
    const modelInput = document.getElementById('model-select');
    const testBtn = document.getElementById('test-api-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const voiceInputCheck = document.getElementById('voice-input');
    const voiceOutputCheck = document.getElementById('voice-output');

    apiKeyInput?.addEventListener('change', async (e) => {
      this.apiKey = e.target.value;
      await this.saveSettings();
    });

    apiUrlInput?.addEventListener('change', async (e) => {
      this.apiUrl = e.target.value;
      await this.saveSettings();
    });

    modelInput?.addEventListener('change', async (e) => {
      this.model = e.target.value;
      await this.saveSettings();
    });

    voiceInputCheck?.addEventListener('change', async (e) => {
      this.voiceInput = e.target.checked;
      await this.saveSettings();
    });

    voiceOutputCheck?.addEventListener('change', async (e) => {
      this.voiceOutput = e.target.checked;
      await this.saveSettings();
    });

    testBtn?.addEventListener('click', async () => {
      if (!this.apiKey) {
        this.showNotification('请先输入API密钥', 'error');
        return;
      }

      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: [{ role: 'user', content: '你好' }],
            max_tokens: 10
          })
        });

        if (response.ok) {
          this.showNotification('API连接测试成功！', 'success');
        } else {
          throw new Error(`状态码: ${response.status}`);
        }
      } catch (error) {
        this.showNotification('API测试失败: ' + error.message, 'error');
      }
    });

    clearHistoryBtn?.addEventListener('click', async () => {
      const roleName = this.currentRole?.name || '默认';
      if (confirm(`确定要清空 ${roleName} 的聊天记录吗？`)) {
        try {
          await api.clearChatHistory(this.currentRole.id);
          this.chatHistory = [];
          this.showNotification(`${roleName} 的聊天记录已清空`, 'success');
          if (this.currentTab === 'chat') {
            this.showTab('chat');
          }
        } catch (error) {
          this.showNotification('清空失败: ' + error.message, 'error');
        }
      }
    });

    const backgroundUpload = document.getElementById('background-upload');
    backgroundUpload?.addEventListener('change', (e) => {
      this.handleFileUpload(e, 'chat_background');
    });

    const avatarUpload = document.getElementById('avatar-upload');
    avatarUpload?.addEventListener('change', (e) => {
      this.handleFileUpload(e, 'user_avatar');
    });

    const botAvatarUpload = document.getElementById('bot-avatar-upload');
    botAvatarUpload?.addEventListener('change', (e) => {
      this.handleFileUpload(e, 'bot_avatar');
    });
  }

  async saveSettings() {
    try {
      await api.updateSettings({
        api_key: this.apiKey,
        api_url: this.apiUrl,
        model: this.model,
        voice_input: this.voiceInput,
        voice_output: this.voiceOutput,
        chat_background: this.chatBackground,
        user_avatar: this.userAvatar,
        bot_avatar: this.botAvatar,
        current_role_id: this.currentRole?.id
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async handleFileUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showNotification('请上传图片文件', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.showNotification('图片大小不能超过2MB', 'error');
      return;
    }

    try {
      const result = await api.uploadFile(file);
      const url = result.url;

      if (type === 'chat_background') {
        this.chatBackground = url;
      } else if (type === 'user_avatar') {
        this.userAvatar = url;
      } else if (type === 'bot_avatar') {
        this.botAvatar = url;
      }

      await this.saveSettings();
      this.showNotification('上传成功', 'success');
      this.showTab('settings');
    } catch (error) {
      this.showNotification('上传失败: ' + error.message, 'error');
    }
  }

  async clearBackground() {
    this.chatBackground = '';
    await this.saveSettings();
    this.showNotification('背景已清除', 'success');
    this.showTab('settings');
  }

  async clearUserAvatar() {
    this.userAvatar = '';
    await this.saveSettings();
    this.showNotification('头像已清除', 'success');
    this.showTab('settings');
  }

  async clearBotAvatar() {
    this.botAvatar = '';
    await this.saveSettings();
    this.showNotification('AI头像已清除', 'success');
    this.showTab('settings');
  }

  // 角色相关方法
  async selectRole(roleId) {
    const role = this.roles.find(r => r.id === roleId);
    if (!role) return;

    this.currentRole = role;
    await this.saveSettings();
    await this.loadChatHistory(roleId);

    this.showNotification(`已切换到角色: ${role.name}`, 'success');
    this.showTab('roles');
  }

  showRoleModal(roleId = null) {
    const isEdit = !!roleId;
    const role = isEdit ? this.roles.find(r => r.id === roleId) : null;

    document.getElementById('role-modal-title').textContent = isEdit ? '编辑角色' : '创建新角色';
    document.getElementById('role-name').value = role?.name || '';
    document.getElementById('role-description').value = role?.description || '';
    document.getElementById('role-system-prompt').value = role?.system_prompt || '';
    document.getElementById('role-id').value = roleId || '';

    document.getElementById('role-modal').classList.add('active');
  }

  closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
  }

  async saveRole() {
    const roleId = document.getElementById('role-id').value;
    const name = document.getElementById('role-name').value;
    const description = document.getElementById('role-description').value;
    const systemPrompt = document.getElementById('role-system-prompt').value;

    try {
      if (roleId) {
        await api.updateRole(roleId, { name, description, system_prompt: systemPrompt });
        this.showNotification('角色更新成功', 'success');
      } else {
        await api.createRole({ name, description, system_prompt: systemPrompt });
        this.showNotification('角色创建成功', 'success');
      }

      this.roles = await api.getRoles();
      this.closeModal('role-modal');
      this.showTab('roles');
    } catch (error) {
      this.showNotification('保存失败: ' + error.message, 'error');
    }
  }

  editRole(roleId) {
    this.showRoleModal(roleId);
  }

  async deleteRole(roleId) {
    if (!confirm('确定要删除这个角色吗？')) return;

    try {
      await api.deleteRole(roleId);
      this.roles = await api.getRoles();

      if (this.currentRole?.id === roleId) {
        this.currentRole = this.roles[0];
        await this.saveSettings();
      }

      this.showNotification('角色已删除', 'success');
      this.showTab('roles');
    } catch (error) {
      this.showNotification('删除失败: ' + error.message, 'error');
    }
  }

  // 日记相关方法
  showDiaryModal(diaryId = null) {
    const isEdit = !!diaryId;
    const diary = isEdit ? this.diaries.find(d => d.id === diaryId) : null;

    document.getElementById('diary-modal-title').textContent = isEdit ? '编辑日记' : '新建日记';
    document.getElementById('diary-id').value = diaryId || '';
    document.getElementById('diary-date').value = diary?.date || new Date().toISOString().split('T')[0];
    document.getElementById('diary-title').value = diary?.title || '';
    document.getElementById('diary-content').value = diary?.content || '';
    document.getElementById('diary-mood').value = diary?.mood || 'happy';

    document.getElementById('diary-form').style.display = 'block';
    document.getElementById('diary-view-content').style.display = 'none';
    document.getElementById('diary-modal').classList.add('active');
  }

  viewDiary(diaryId) {
    const diary = this.diaries.find(d => d.id === diaryId);
    if (!diary) return;

    this.currentDiary = diary;

    document.getElementById('diary-modal-title').textContent = diary.title;
    document.getElementById('diary-view-date').textContent = `${diary.date} ${MOOD_OPTIONS.find(m => m.value === diary.mood)?.label || ''}`;
    document.getElementById('diary-view-text').textContent = diary.content;

    document.getElementById('diary-form').style.display = 'none';
    document.getElementById('diary-view-content').style.display = 'block';
    document.getElementById('diary-modal').classList.add('active');
  }

  editCurrentDiary() {
    if (this.currentDiary) {
      this.showDiaryModal(this.currentDiary.id);
    }
  }

  async saveDiary() {
    const diaryId = document.getElementById('diary-id').value;
    const date = document.getElementById('diary-date').value;
    const title = document.getElementById('diary-title').value;
    const content = document.getElementById('diary-content').value;
    const mood = document.getElementById('diary-mood').value;

    try {
      if (diaryId) {
        await api.updateDiary(diaryId, { date, title, content, mood });
        this.showNotification('日记更新成功', 'success');
      } else {
        await api.createDiary({ date, title, content, mood });
        this.showNotification('日记创建成功', 'success');
      }

      this.diaries = await api.getDiaries();
      this.closeModal('diary-modal');
      this.showTab('diary');
    } catch (error) {
      this.showNotification('保存失败: ' + error.message, 'error');
    }
  }

  async deleteDiary(diaryId) {
    if (!confirm('确定要删除这篇日记吗？')) return;

    try {
      await api.deleteDiary(diaryId);
      this.diaries = await api.getDiaries();
      this.showNotification('日记已删除', 'success');
      this.showTab('diary');
    } catch (error) {
      this.showNotification('删除失败: ' + error.message, 'error');
    }
  }

  async generateDiaryFromChat() {
    if (!this.apiKey) {
      this.showNotification('请先设置API密钥', 'error');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const todayMessages = this.chatHistory.filter(m =>
      m.timestamp && m.timestamp.startsWith(today) && m.role !== 'timestamp'
    );

    if (todayMessages.length === 0) {
      this.showNotification('今天还没有聊天记录', 'error');
      return;
    }

    this.showNotification('正在生成日记...', 'info');

    try {
      const chatContent = todayMessages.map(m =>
        `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`
      ).join('\n');

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '你是一个日记助手。根据提供的聊天记录，生成一篇日记。日记应该包含标题和正文，反映用户的情绪和经历。'
            },
            {
              role: 'user',
              content: `请根据以下聊天记录生成一篇日记：\n\n${chatContent}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      const generatedContent = data.choices?.[0]?.message?.content || '';

      const lines = generatedContent.split('\n');
      let title = '今天的心情';
      let content = generatedContent;

      const titleMatch = generatedContent.match(/^[#\s]*(.+?)[\n#]/);
      if (titleMatch) {
        title = titleMatch[1].replace(/^#+\s*/, '').trim();
        content = generatedContent.replace(/^[#\s]*(.+?)[\n#]/, '').trim();
      }

      document.getElementById('diary-modal-title').textContent = '从聊天记录生成日记';
      document.getElementById('diary-id').value = '';
      document.getElementById('diary-date').value = today;
      document.getElementById('diary-title').value = title;
      document.getElementById('diary-content').value = content;

      const moodKeywords = {
        happy: ['开心', '快乐', '高兴', '愉快', '棒', '好'],
        calm: ['平静', '安静', '放松', '舒适'],
        excited: ['兴奋', '激动', '期待', '惊喜'],
        tired: ['累', '疲惫', '困', '疲倦'],
        sad: ['难过', '伤心', '悲伤', '失落'],
        angry: ['生气', '愤怒', '不满', '烦躁'],
        grateful: ['感谢', '感恩', '感激', '幸福'],
        anxious: ['焦虑', '担心', '紧张', '不安']
      };

      let detectedMood = 'happy';
      for (const [mood, keywords] of Object.entries(moodKeywords)) {
        if (keywords.some(kw => content.includes(kw))) {
          detectedMood = mood;
          break;
        }
      }
      document.getElementById('diary-mood').value = detectedMood;

      document.getElementById('diary-form').style.display = 'block';
      document.getElementById('diary-view-content').style.display = 'none';
      document.getElementById('diary-modal').classList.add('active');

    } catch (error) {
      console.error('生成日记失败:', error);
      this.showNotification('生成日记失败: ' + error.message, 'error');
    }
  }

  // 水族馆相关方法
  feedFish(event) {
    const aquarium = document.getElementById('aquarium');
    if (!aquarium) return;

    const rect = aquarium.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const food = document.createElement('div');
    food.className = 'food';
    food.style.left = x + 'px';
    food.style.top = y + 'px';

    const foodContainer = document.getElementById('food-container');
    if (!foodContainer) return;

    foodContainer.appendChild(food);

    let hasEaten = false;
    const checkInterval = setInterval(() => {
      if (hasEaten) {
        clearInterval(checkInterval);
        return;
      }

      const foodRect = food.getBoundingClientRect();
      const aquariumRect = aquarium.getBoundingClientRect();

      const foodY = foodRect.top - aquariumRect.top + foodRect.height / 2;
      const foodX = foodRect.left - aquariumRect.left + foodRect.width / 2;

      for (let i = 1; i <= 4; i++) {
        const fish = document.getElementById(`fish-${i}`);
        if (!fish) continue;

        const fishRect = fish.getBoundingClientRect();
        const fishY = fishRect.top - aquariumRect.top + fishRect.height / 2;
        const fishX = fishRect.left - aquariumRect.left + fishRect.width / 2;

        const distance = Math.sqrt(
          Math.pow(foodX - fishX, 2) + Math.pow(foodY - fishY, 2)
        );

        if (distance < 50) {
          hasEaten = true;
          clearInterval(checkInterval);
          this.talkToFish(i, true);
          food.style.opacity = '0';
          setTimeout(() => food.remove(), 100);
          break;
        }
      }
    }, 50);

    setTimeout(() => {
      clearInterval(checkInterval);
      if (!hasEaten) {
        food.remove();
      }
    }, 2000);
  }

  talkToFish(fishId, isEating = false) {
    const hour = new Date().getHours();

    let timeOfDay;
    if (hour < 6) timeOfDay = 'night';
    else if (hour < 11) timeOfDay = 'morning';
    else if (hour < 14) timeOfDay = 'noon';
    else if (hour < 18) timeOfDay = 'afternoon';
    else if (hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';

    const fishDialogues = FISH_DIALOGUES[fishId];
    let dialogue;

    if (isEating && Math.random() > 0.5) {
      dialogue = fishDialogues.eating[Math.floor(Math.random() * fishDialogues.eating.length)];
    } else {
      dialogue = fishDialogues[timeOfDay][Math.floor(Math.random() * fishDialogues[timeOfDay].length)];
    }

    const dialogueEl = document.getElementById(`dialogue-${fishId}`);
    if (dialogueEl) {
      [1, 2, 3, 4].forEach(id => {
        const el = document.getElementById(`dialogue-${id}`);
        if (el && id !== fishId) {
          el.classList.remove('show');
          el.textContent = '';
        }
      });

      dialogueEl.textContent = dialogue;
      dialogueEl.classList.add('show');

      setTimeout(() => {
        dialogueEl.classList.remove('show');
      }, 3000);
    }
  }

  cycleMascot() {
    const images = [
      document.getElementById('mascot-img-1'),
      document.getElementById('mascot-img-2'),
      document.getElementById('mascot-img-3'),
      document.getElementById('mascot-img-4')
    ];

    let currentIndex = images.findIndex(img => img.style.opacity === '1');
    if (currentIndex === -1) currentIndex = 0;

    images[currentIndex].style.opacity = '0';
    const nextIndex = (currentIndex + 1) % images.length;
    images[nextIndex].style.opacity = '1';
  }

  getConsecutiveDays() {
    if (this.diaries.length === 0) return 0;

    const dates = [...new Set(this.diaries.map(d => d.date))].sort().reverse();
    const today = new Date().toISOString().split('T')[0];

    let consecutive = 0;
    let checkDate = new Date();

    for (const dateStr of dates) {
      const date = checkDate.toISOString().split('T')[0];
      if (dateStr === date) {
        consecutive++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateStr < date) {
        break;
      }
    }

    return consecutive;
  }

  showNotification(message, type = 'info') {
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 8px;
      `;
      document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      padding: 12px 16px;
      border-radius: 8px;
      backdrop-filter: blur(6px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-size: 14px;
      max-width: 300px;
      pointer-events: auto;
      cursor: pointer;
      transition: all 0.3s ease;
      ${type === 'error' ? 'background: rgba(255, 68, 68, 0.9); color: white;' : ''}
      ${type === 'success' ? 'background: rgba(52, 255, 167, 0.9); color: #051317;' : ''}
      ${type === 'info' ? 'background: rgba(0, 225, 255, 0.9); color: #051317;' : ''}
    `;

    notification.addEventListener('click', () => {
      notification.remove();
    });

    container.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// 初始化应用
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new SmallWorldApp();
  window.app = app;
});
