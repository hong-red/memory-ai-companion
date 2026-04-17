const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  console.log('Connected to SQLite database');
});

db.serialize(() => {
  // 用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 角色表
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      system_prompt TEXT NOT NULL,
      is_default BOOLEAN DEFAULT 0,
      is_builtin BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 聊天记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      role_id INTEGER,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    )
  `);

  // 日记表
  db.run(`
    CREATE TABLE IF NOT EXISTS diaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      mood TEXT DEFAULT 'happy',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 用户设置表
  db.run(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      api_key TEXT,
      api_url TEXT DEFAULT 'https://api.moonshot.cn/v1/chat/completions',
      model TEXT DEFAULT 'moonshot-v1-8k',
      voice_input BOOLEAN DEFAULT 0,
      voice_output BOOLEAN DEFAULT 0,
      chat_background TEXT,
      user_avatar TEXT,
      bot_avatar TEXT,
      current_role_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (current_role_id) REFERENCES roles(id) ON DELETE SET NULL
    )
  `);

  // 插入默认内置角色
  const defaultRoles = [
    {
      name: '叶修',
      description: '全职高手中的角色，性格沉稳，游戏技术高超',
      system_prompt: '你是叶修，来自《全职高手》的角色。你性格沉稳内敛，游戏技术高超，说话简洁有力，偶尔会展现出幽默的一面。你对游戏有着极深的理解，喜欢帮助新人成长。回答问题时保持冷静、专业的态度。'
    },
    {
      name: '温柔助手',
      description: '一个温柔体贴的AI助手，善于倾听和安慰',
      system_prompt: '你是一个温柔体贴的AI助手，善于倾听和安慰。你的语气柔和，充满同理心，总是能给用户带来温暖和支持。你会认真倾听用户的烦恼，给予建设性的建议和情感支持。'
    },
    {
      name: '知识导师',
      description: '博学多才的导师，喜欢分享知识和见解',
      system_prompt: '你是一位博学多才的知识导师，对各种领域都有深入的了解。你喜欢分享知识，回答问题时会给出详细而有条理的解释。你鼓励用户保持好奇心，引导他们深入思考。'
    }
  ];

  // 检查是否已有内置角色
  db.get("SELECT COUNT(*) as count FROM roles WHERE is_builtin = 1", (err, row) => {
    if (err) {
      console.error('Error checking builtin roles:', err);
      return;
    }
    
    if (row.count === 0) {
      const stmt = db.prepare(`
        INSERT INTO roles (name, description, system_prompt, is_builtin, is_default)
        VALUES (?, ?, ?, 1, ?)
      `);
      
      defaultRoles.forEach((role, index) => {
        stmt.run(role.name, role.description, role.system_prompt, index === 0 ? 1 : 0);
      });
      
      stmt.finalize();
      console.log('Default roles inserted');
    }
  });

  console.log('Database initialized successfully');
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err);
    return;
  }
  console.log('Database connection closed');
});
