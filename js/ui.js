// UI 渲染类
class UIRenderer {
  constructor(app) {
    this.app = app;
  }

  // 首页
  getHomeTab() {
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 6 ? '夜深了' : hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';
    const dateStr = now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    const today = now.toISOString().split('T')[0];
    const todayDiaryCount = this.app.diaries.filter(d => d.date === today).length;
    const todayChatCount = this.app.chatHistory.filter(m => m.timestamp && m.timestamp.startsWith(today)).length;

    return `
      <div class="home-container" style="padding: 24px 20px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="font-size: 14px; color: #888; margin-bottom: 8px;">${dateStr} · ${timeStr}</div>
          
          <div style="display: flex; align-items: center; justify-content: center; gap: 30px; margin-bottom: 8px;">
            <div class="mascot-left" onclick="this.classList.add('waving'); setTimeout(()=>this.classList.remove('waving'), 1000);" style="cursor: pointer; filter: drop-shadow(0 6px 20px rgba(0,225,255,0.4));">
              <img src="1.png" style="width: 150px; height: 150px; object-fit: contain;">
            </div>
            
            <h1 style="font-size: 32px; font-weight: 700; margin: 0; background: linear-gradient(90deg, #00e1ff, #34ffa7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
              ${greeting}
            </h1>
            
            <div class="mascot-right" onclick="this.classList.add('waving'); setTimeout(()=>this.classList.remove('waving'), 1000);" style="cursor: pointer; filter: drop-shadow(0 6px 20px rgba(255,107,157,0.4));">
              <img src="2.png" style="width: 150px; height: 150px; object-fit: contain;">
            </div>
          </div>
          
          <p style="font-size: 15px; color: #aaa; margin: 0;">
            ${this.app.currentRole ? ` <span style="color: var(--primary); font-weight: 600;">${this.app.currentRole.name}</span> 正在陪伴你` : '今天想聊些什么？'}
          </p>
        </div>
        
        <style>
          @keyframes waveLeft {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-15deg) translateX(-5px); }
            50% { transform: rotate(0deg); }
            75% { transform: rotate(-15deg) translateX(-5px); }
          }
          @keyframes waveRight {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(15deg) translateX(5px); }
            50% { transform: rotate(0deg); }
            75% { transform: rotate(15deg) translateX(5px); }
          }
          .mascot-left.waving { animation: waveLeft 0.5s ease-in-out 2; }
          .mascot-right.waving { animation: waveRight 0.5s ease-in-out 2; }
        </style>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
          <div style="background: linear-gradient(135deg, rgba(0,225,255,0.15), rgba(0,225,255,0.05)); border: 1px solid rgba(0,225,255,0.2); border-radius: 16px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; margin-bottom: 4px;">💬</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--primary);">${todayChatCount}</div>
            <div style="font-size: 12px; color: #888;">今日对话</div>
          </div>
          <div style="background: linear-gradient(135deg, rgba(52,255,167,0.15), rgba(52,255,167,0.05)); border: 1px solid rgba(52,255,167,0.2); border-radius: 16px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; margin-bottom: 4px;">📜</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--accent);">${todayDiaryCount}</div>
            <div style="font-size: 12px; color: #888;">今日日记</div>
          </div>
          <div style="background: linear-gradient(135deg, rgba(255,107,157,0.15), rgba(255,107,157,0.05)); border: 1px solid rgba(255,107,157,0.2); border-radius: 16px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; margin-bottom: 4px;">🔥</div>
            <div style="font-size: 24px; font-weight: 700; color: #ff6b9d;">${this.app.getConsecutiveDays()}</div>
            <div style="font-size: 12px; color: #888;">连续记录</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 28px;">
          <button onclick="window.app.showTab('chat')" style="background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: #051317; border: none; border-radius: 14px; padding: 18px; cursor: pointer; font-size: 16px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s;">
            <span style="font-size: 20px;">💬</span> 开始聊天
          </button>
          <button onclick="window.app.showTab('diary')" style="background: linear-gradient(135deg, var(--accent), #00c48c); color: #051317; border: none; border-radius: 14px; padding: 18px; cursor: pointer; font-size: 16px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s;">
            <span style="font-size: 20px;">📜</span> 写日记
          </button>
        </div>

        <div style="background: var(--bg-glass); border: 1px solid rgba(0,225,255,0.15); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div id="mascot-avatar" onclick="window.app.cycleMascot()" style="width: 80px; height: 80px; cursor: pointer; position: relative;">
              <img id="mascot-img-1" src="1.png" style="width: 100%; height: 100%; object-fit: contain; position: absolute; top: 0; left: 0; transition: opacity 0.3s; opacity: 1;">
              <img id="mascot-img-2" src="2.png" style="width: 100%; height: 100%; object-fit: contain; position: absolute; top: 0; left: 0; transition: opacity 0.3s; opacity: 0;">
              <img id="mascot-img-3" src="3.png" style="width: 100%; height: 100%; object-fit: contain; position: absolute; top: 0; left: 0; transition: opacity 0.3s; opacity: 0;">
              <img id="mascot-img-4" src="4.png" style="width: 100%; height: 100%; object-fit: contain; position: absolute; top: 0; left: 0; transition: opacity 0.3s; opacity: 0;">
            </div>
            <div style="flex: 1;">
              <div style="font-size: 12px; color: #888; margin-bottom: 4px;">当前陪伴角色</div>
              <div style="font-size: 18px; font-weight: 600; color: var(--primary);">
                ${this.app.currentRole ? this.app.currentRole.name : '未选择角色'}
              </div>
              <div style="font-size: 13px; color: #aaa; margin-top: 4px;">
                ${this.app.currentRole ? this.app.currentRole.description : '点击前往角色页面选择'}
              </div>
            </div>
            <button onclick="window.app.showTab('roles')" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(0,225,255,0.3); color: var(--primary); border-radius: 8px; padding: 8px 16px; cursor: pointer; font-size: 13px;">
              切换
            </button>
          </div>
        </div>

        ${this.getAquariumHTML()}
      </div>
    `;
  }

  getAquariumHTML() {
    return `
      <div style="margin-bottom: 140px;">
        <h3 style="font-size: 18px; margin: 0 0 16px 0; color: #00e1ff; font-weight: 600; font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; text-shadow: 0 0 10px rgba(0,225,255,0.5), 0 0 20px rgba(0,225,255,0.3); letter-spacing: 2px;">
          水族馆 
          <span style="font-size: 13px; color: #66ccff; font-weight: 400; text-shadow: 0 0 8px rgba(102,204,255,0.4);">(鱼儿正在等待投喂)</span>
        </h3>
        <div class="aquarium" id="aquarium" style="
          position: relative;
          height: 200px;
          background: linear-gradient(180deg, rgba(0,150,200,0.3) 0%, rgba(0,80,120,0.5) 100%);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(0,225,255,0.3);
          cursor: crosshair;
        " onclick="if(window.app) window.app.feedFish(event)">
          <div class="water-ripple" style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 100%;
            background: repeating-linear-gradient(
              0deg,
              transparent,
              transparent 48%,
              rgba(0,225,255,0.03) 50%,
              transparent 52%
            );
            animation: waterWave 8s linear infinite;
          "></div>
          
          <div class="bubble" style="left: 10%; animation-delay: 0s;"></div>
          <div class="bubble" style="left: 30%; animation-delay: 2s;"></div>
          <div class="bubble" style="left: 50%; animation-delay: 4s;"></div>
          <div class="bubble" style="left: 70%; animation-delay: 1s;"></div>
          <div class="bubble" style="left: 90%; animation-delay: 3s;"></div>
          
          <div id="food-container"></div>
          
          <div class="fish fish-1" id="fish-1" data-fish-id="1" style="top: 20%;" onclick="event.stopPropagation(); window.app.talkToFish(1)">
            <div class="fish-dialogue" id="dialogue-1"></div>
            <div class="fish-body">
              <svg viewBox="0 0 100 60" width="42">
                <path d="M10 30 Q30 5, 60 20 Q85 30, 60 40 Q30 55, 10 30 Z" fill="url(#fish1)" />
                <circle cx="55" cy="25" r="2" fill="#fff"/>
                <defs><linearGradient id="fish1"><stop offset="0%" stop-color="#00f2ff"/><stop offset="100%" stop-color="#0066aa"/></linearGradient></defs>
              </svg>
            </div>
            <span class="fish-name">小蓝</span>
          </div>

          <div class="fish fish-2" id="fish-2" data-fish-id="2" style="top: 45%;" onclick="event.stopPropagation(); window.app.talkToFish(2)">
            <div class="fish-dialogue" id="dialogue-2"></div>
            <div class="fish-body">
              <svg viewBox="0 0 100 60" width="42">
                <path d="M10 30 Q30 10, 60 20 Q80 30, 60 40 Q30 50, 10 30 Z" fill="url(#fish2)" />
                <circle cx="55" cy="25" r="2" fill="#fff"/>
                <defs><linearGradient id="fish2"><stop offset="0%" stop-color="#ffd700"/><stop offset="100%" stop-color="#ff8c00"/></linearGradient></defs>
              </svg>
            </div>
            <span class="fish-name">小金</span>
          </div>

          <div class="fish fish-3" id="fish-3" data-fish-id="3" style="top: 70%;" onclick="event.stopPropagation(); window.app.talkToFish(3)">
            <div class="fish-dialogue" id="dialogue-3"></div>
            <div class="fish-body">
              <svg viewBox="0 0 100 60" width="42">
                <path d="M10 30 Q30 5, 60 25 Q80 30, 60 45 Q30 55, 10 30 Z" fill="url(#fish3)" />
                <circle cx="55" cy="25" r="2" fill="#fff"/>
                <defs><linearGradient id="fish3"><stop offset="0%" stop-color="#666"/><stop offset="100%" stop-color="#999"/></linearGradient></defs>
              </svg>
            </div>
            <span class="fish-name">小黑</span>
          </div>

          <div class="fish fish-4" id="fish-4" data-fish-id="4" style="top: 35%;" onclick="event.stopPropagation(); window.app.talkToFish(4)">
            <div class="fish-dialogue" id="dialogue-4"></div>
            <div class="fish-body">
              <svg viewBox="0 0 100 60" width="42">
                <path d="M10 30 Q30 10, 60 20 Q85 30, 60 40 Q30 50, 10 30 Z" fill="url(#fish4)" />
                <circle cx="55" cy="25" r="2" fill="#fff"/>
                <defs><linearGradient id="fish4"><stop offset="0%" stop-color="#00c896"/><stop offset="100%" stop-color="#006644"/></linearGradient></defs>
              </svg>
            </div>
            <span class="fish-name">小青</span>
          </div>
          
          <div class="seaweed" style="left: 5%;"></div>
          <div class="seaweed" style="left: 15%; animation-delay: 0.5s;"></div>
          <div class="seaweed" style="right: 10%; animation-delay: 1s;"></div>
          <div class="seaweed" style="right: 20%; animation-delay: 1.5s;"></div>
        </div>
        
        <style>
          @keyframes waterWave {
            0% { transform: translateY(0); }
            100% { transform: translateY(-20px); }
          }
          @keyframes swim {
            0% { left: -100px; }
            45% { left: calc(100% + 20px); }
            50% { left: calc(100% + 20px); }
            95% { left: -100px; }
            100% { left: -100px; }
          }
          @keyframes swimBody {
            0% { transform: scaleX(1); }
            45% { transform: scaleX(1); }
            50% { transform: scaleX(-1); }
            95% { transform: scaleX(-1); }
            100% { transform: scaleX(1); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          @keyframes bubbleRise {
            0% { transform: translateY(100%) scale(0.5); opacity: 0; }
            10% { opacity: 0.6; }
            90% { opacity: 0.6; }
            100% { transform: translateY(-100px) scale(1); opacity: 0; }
          }
          @keyframes seaweedSway {
            0%, 100% { transform: rotate(-5deg); }
            50% { transform: rotate(5deg); }
          }
          @keyframes foodFall {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(180px) rotate(360deg); opacity: 0; }
          }
          @keyframes dialoguePop {
            0% { transform: scale(0) translateY(10px); opacity: 0; }
            50% { transform: scale(1.1) translateY(-5px); opacity: 1; }
            100% { transform: scale(1) translateY(-10px); opacity: 1; }
          }
          .aquarium .fish {
            position: absolute;
            display: flex;
            align-items: center;
            gap: 6px;
            animation: swim 20s linear infinite;
            white-space: nowrap;
            cursor: pointer;
            transition: all 0.2s;
          }
          .aquarium .fish:hover { filter: brightness(1.2); }
          .aquarium .fish:active { transform: scale(0.95); }
          .aquarium .fish-1 { animation-duration: 18s; animation-delay: 0s; }
          .aquarium .fish-2 { animation-duration: 22s; animation-delay: -5s; }
          .aquarium .fish-3 { animation-duration: 25s; animation-delay: -10s; }
          .aquarium .fish-4 { animation-duration: 20s; animation-delay: -15s; }
          .aquarium .fish-body {
            animation: swimBody 20s linear infinite, float 2s ease-in-out infinite;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          }
          .aquarium .fish-1 .fish-body { animation-duration: 18s, 2s; animation-delay: 0s, 0s; }
          .aquarium .fish-2 .fish-body { animation-duration: 22s, 2s; animation-delay: -5s, 0.3s; }
          .aquarium .fish-3 .fish-body { animation-duration: 25s, 2s; animation-delay: -10s, 0.6s; }
          .aquarium .fish-4 .fish-body { animation-duration: 20s, 2s; animation-delay: -15s, 0.9s; }
          .aquarium .fish-name {
            font-size: 11px;
            color: rgba(255,255,255,0.8);
            background: rgba(0,0,0,0.3);
            padding: 2px 8px;
            border-radius: 10px;
            backdrop-filter: blur(4px);
          }
          .aquarium .fish-dialogue {
            position: absolute;
            top: -35px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255,255,255,0.95);
            color: #333;
            padding: 6px 12px;
            border-radius: 12px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 100;
          }
          .aquarium .fish-dialogue::after {
            content: '';
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            border: 6px solid transparent;
            border-top-color: rgba(255,255,255,0.95);
          }
          .aquarium .fish-dialogue.show {
            animation: dialoguePop 0.3s ease forwards;
          }
          .aquarium .bubble {
            position: absolute;
            bottom: 0;
            width: 8px;
            height: 8px;
            background: rgba(255,255,255,0.4);
            border-radius: 50%;
            animation: bubbleRise 4s ease-in infinite;
          }
          .aquarium .seaweed {
            position: absolute;
            bottom: 0;
            width: 8px;
            height: 60px;
            background: linear-gradient(to top, #2d5016, #4a7c2a);
            border-radius: 4px 4px 0 0;
            transform-origin: bottom center;
            animation: seaweedSway 3s ease-in-out infinite;
          }
          .aquarium .food {
            position: absolute;
            width: 8px;
            height: 8px;
            background: #8b4513;
            border-radius: 50%;
            animation: foodFall 2s ease-in forwards;
          }
        </style>
      </div>
    `;
  }

  // 聊天页面
  getChatTab() {
    const messagesHtml = this.app.chatHistory.map(msg => this.renderMessage(msg)).join('');
    const backgroundStyle = this.app.chatBackground ? `background-image: url('${this.app.chatBackground}');` : '';

    return `
      <div id="chat" style="${backgroundStyle}">
        <div class="chat-container" id="chat-container">
          ${messagesHtml}
          <div class="typing-indicator" id="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
        <div class="input-area">
          <input type="text" id="input" placeholder="输入消息..." />
          <div class="btn-group">
            <button id="voice-btn" class="action-btn">♪</button>
            <button id="send-btn" class="action-btn">发送</button>
          </div>
        </div>
      </div>
    `;
  }

  renderMessage(msg) {
    const isUser = msg.role === 'user';
    const avatar = isUser
      ? (this.app.userAvatar || 'https://files.catbox.moe/abc123.png')
      : (this.app.botAvatar || 'https://files.catbox.moe/abc123.png');

    return `
      <div class="message-row ${isUser ? 'user' : 'bot'}">
        <div class="avatar">
          <img src="${avatar}" alt="${isUser ? 'User' : 'Bot'}">
        </div>
        <div class="message ${isUser ? 'user' : 'bot'}">${this.escapeHtml(msg.content)}</div>
      </div>
    `;
  }

  // 日记页面
  getDiaryTab() {
    const diariesHtml = this.app.diaries.map(diary => {
      const moodEmoji = MOOD_OPTIONS.find(m => m.value === diary.mood)?.label.split(' ')[0] || '😊';
      return `
        <div class="diary-card" onclick="window.app.viewDiary(${diary.id})" style="
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 12px; color: #888;">${diary.date}</span>
            <span style="font-size: 20px;">${moodEmoji}</span>
          </div>
          <h4 style="margin: 0 0 8px 0; color: #00e1ff;">${diary.title}</h4>
          <p style="margin: 0; font-size: 14px; opacity: 0.8; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${diary.content}</p>
        </div>
      `;
    }).join('');

    return `
      <div class="diary-container" style="max-width: 800px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: #00e1ff;">我的日记</h3>
          <div style="display: flex; gap: 10px;">
            <button onclick="window.app.generateDiaryFromChat()" style="background: linear-gradient(135deg, #34ffa7, #00e1ff); color: #051317; border: none; border-radius: 8px; padding: 10px 16px; cursor: pointer; font-weight: 600;">
              ✨ 从聊天生成
            </button>
            <button onclick="window.app.showDiaryModal()" style="background: linear-gradient(135deg, #00e1ff, #00a8c7); color: #051317; border: none; border-radius: 8px; padding: 10px 16px; cursor: pointer; font-weight: 600;">
              + 新建日记
            </button>
          </div>
        </div>
        ${diariesHtml || '<div style="text-align: center; padding: 40px; opacity: 0.6;">还没有日记，开始记录吧~</div>'}
      </div>
    `;
  }

  // 角色页面
  getRolesTab() {
    const rolesHtml = this.app.roles.map(role => {
      const isActive = this.app.currentRole && this.app.currentRole.id === role.id;
      return `
        <div class="role-card ${isActive ? 'active' : ''}" onclick="window.app.selectRole(${role.id})" style="
          background: ${isActive ? 'rgba(0,225,255,0.25)' : 'rgba(255,255,255,0.08)'};
          border: 1px solid ${isActive ? 'rgba(0,225,255,0.4)' : 'rgba(255,255,255,0.15)'};
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          text-align: center;
          margin-bottom: 12px;
        ">
          <h4 style="margin: 0 0 8px 0; color: #00e1ff; font-size: 16px;">${role.name}</h4>
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">${role.description || '暂无描述'}</p>
          ${role.type === 'custom' ? `
            <div style="margin-top: 10px;">
              <button onclick="event.stopPropagation(); window.app.editRole(${role.id})" style="background: rgba(255,255,255,0.1); border: none; color: #00e1ff; padding: 4px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px;">编辑</button>
              <button onclick="event.stopPropagation(); window.app.deleteRole(${role.id})" style="background: rgba(255,68,68,0.3); border: none; color: #ff4444; padding: 4px 12px; border-radius: 4px; cursor: pointer;">删除</button>
            </div>
          ` : '<span style="font-size: 12px; color: #888;">内置角色</span>'}
        </div>
      `;
    }).join('');

    return `
      <div class="roles-container" style="max-width: 800px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: #00e1ff;">选择角色</h3>
          <button onclick="window.app.showRoleModal()" style="background: linear-gradient(135deg, #34ffa7, #00e1ff); color: #051317; border: none; border-radius: 12px; padding: 12px 24px; cursor: pointer; font-weight: bold;">
            + 创建角色
          </button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
          ${rolesHtml}
        </div>
      </div>
    `;
  }

  // 设置页面
  getSettingsTab() {
    return `
      <div class="settings-container" style="max-width: 600px; margin: 0 auto;">
        <div class="settings-section" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 16px 0; color: #00e1ff; font-size: 18px;">API 设置</h3>
          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <span class="setting-label">API Key</span>
            <div class="setting-control">
              <input type="password" id="api-key" value="${this.app.apiKey}" placeholder="输入 Moonshot API Key" style="padding: 8px 12px; border: 1px solid rgba(0,225,255,0.3); border-radius: 6px; background: rgba(255,255,255,0.08); color: white; font-size: 14px; width: 250px;">
            </div>
          </div>
          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <span class="setting-label">API URL</span>
            <div class="setting-control">
              <input type="text" id="api-url" value="${this.app.apiUrl}" style="padding: 8px 12px; border: 1px solid rgba(0,225,255,0.3); border-radius: 6px; background: rgba(255,255,255,0.08); color: white; font-size: 14px; width: 250px;">
            </div>
          </div>
          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <span class="setting-label">模型</span>
            <div class="setting-control">
              <select id="model-select" style="padding: 8px 12px; border: 1px solid rgba(0,225,255,0.3); border-radius: 6px; background: rgba(255,255,255,0.08); color: white; font-size: 14px; width: 250px;">
                <option value="moonshot-v1-8k" ${this.app.model === 'moonshot-v1-8k' ? 'selected' : ''}>moonshot-v1-8k</option>
                <option value="moonshot-v1-32k" ${this.app.model === 'moonshot-v1-32k' ? 'selected' : ''}>moonshot-v1-32k</option>
                <option value="moonshot-v1-128k" ${this.app.model === 'moonshot-v1-128k' ? 'selected' : ''}>moonshot-v1-128k</option>
              </select>
            </div>
          </div>
          <button id="test-api-btn" class="test-btn" style="padding: 8px 16px; background: linear-gradient(135deg, #00e1ff, #00a8c7); color: #051317; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">测试连接</button>
        </div>

        <div class="settings-section" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 16px 0; color: #00e1ff; font-size: 18px;">语音设置</h3>
          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <span class="setting-label">语音输入</span>
            <div class="setting-control">
              <input type="checkbox" id="voice-input" ${this.app.voiceInput ? 'checked' : ''} style="width: 20px; height: 20px;">
            </div>
          </div>
          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <span class="setting-label">语音回复</span>
            <div class="setting-control">
              <input type="checkbox" id="voice-output" ${this.app.voiceOutput ? 'checked' : ''} style="width: 20px; height: 20px;">
            </div>
          </div>
        </div>

        <div class="settings-section" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 16px 0; color: #00e1ff; font-size: 18px;">个性化</h3>
          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <span class="setting-label">聊天背景</span>
            <div class="setting-control">
              <input type="file" id="background-upload" accept="image/*" style="display: none;">
              <button onclick="document.getElementById('background-upload').click()" style="padding: 6px 12px; background: rgba(0,225,255,0.2); border: 1px solid rgba(0,225,255,0.3); color: #00e1ff; border-radius: 4px; cursor: pointer;">上传</button>
              ${this.app.chatBackground ? `<button onclick="window.app.clearBackground()" style="padding: 6px 12px; background: rgba(255,68,68,0.2); border: 1px solid rgba(255,68,68,0.3); color: #ff4444; border-radius: 4px; cursor: pointer; margin-left: 5px;">清除</button>` : ''}
            </div>
          </div>
          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <span class="setting-label">用户头像</span>
            <div class="setting-control">
              <input type="file" id="avatar-upload" accept="image/*" style="display: none;">
              <button onclick="document.getElementById('avatar-upload').click()" style="padding: 6px 12px; background: rgba(0,225,255,0.2); border: 1px solid rgba(0,225,255,0.3); color: #00e1ff; border-radius: 4px; cursor: pointer;">上传</button>
              ${this.app.userAvatar ? `<button onclick="window.app.clearUserAvatar()" style="padding: 6px 12px; background: rgba(255,68,68,0.2); border: 1px solid rgba(255,68,68,0.3); color: #ff4444; border-radius: 4px; cursor: pointer; margin-left: 5px;">清除</button>` : ''}
            </div>
          </div>
          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <span class="setting-label">AI头像</span>
            <div class="setting-control">
              <input type="file" id="bot-avatar-upload" accept="image/*" style="display: none;">
              <button onclick="document.getElementById('bot-avatar-upload').click()" style="padding: 6px 12px; background: rgba(0,225,255,0.2); border: 1px solid rgba(0,225,255,0.3); color: #00e1ff; border-radius: 4px; cursor: pointer;">上传</button>
              ${this.app.botAvatar ? `<button onclick="window.app.clearBotAvatar()" style="padding: 6px 12px; background: rgba(255,68,68,0.2); border: 1px solid rgba(255,68,68,0.3); color: #ff4444; border-radius: 4px; cursor: pointer; margin-left: 5px;">清除</button>` : ''}
            </div>
          </div>
        </div>

        <div class="settings-section" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 16px 0; color: #00e1ff; font-size: 18px;">数据管理</h3>
          <button id="clear-history-btn" style="padding: 10px 20px; background: rgba(255,68,68,0.2); border: 1px solid rgba(255,68,68,0.3); color: #ff4444; border-radius: 6px; cursor: pointer; font-weight: bold;">清空当前角色聊天记录</button>
        </div>

        <div class="settings-section" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 20px;">
          <h3 style="margin: 0 0 16px 0; color: #00e1ff; font-size: 18px;">账号</h3>
          <button onclick="window.app.logout()" style="padding: 10px 20px; background: rgba(255,68,68,0.2); border: 1px solid rgba(255,68,68,0.3); color: #ff4444; border-radius: 6px; cursor: pointer; font-weight: bold;">退出登录</button>
        </div>
      </div>
    `;
  }

  // 登录模态框
  getLoginModal() {
    return `
      <div id="auth-modal" class="modal active">
        <div class="modal-content" style="max-width: 400px;">
          <div class="modal-header">
            <h3>欢迎回来</h3>
          </div>
          <div class="modal-body">
            <div id="auth-tabs" style="display: flex; gap: 10px; margin-bottom: 20px;">
              <button id="login-tab" class="submit-btn" style="flex: 1;">登录</button>
              <button id="register-tab" class="cancel-btn" style="flex: 1;">注册</button>
            </div>
            <form id="auth-form">
              <div class="form-group">
                <label for="auth-username">用户名</label>
                <input type="text" id="auth-username" required placeholder="请输入用户名">
              </div>
              <div class="form-group">
                <label for="auth-password">密码</label>
                <input type="password" id="auth-password" required placeholder="请输入密码">
              </div>
              <div id="auth-error" style="color: #ff6b6b; margin-bottom: 10px; display: none;"></div>
              <button type="submit" class="submit-btn" style="width: 100%;">继续</button>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
