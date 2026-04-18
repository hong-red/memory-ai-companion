const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// 中间件 - CORS配置
app.use(cors({
  origin: '*',  // 允许所有来源，生产环境建议指定具体域名
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 确保上传目录存在
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 数据库连接
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  console.log('Connected to SQLite database');
  
  // 初始化数据库表
  initializeDatabase();
});

// 初始化数据库表
function initializeDatabase() {
  db.serialize(() => {
    // 用户表
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating users table:', err);
      else console.log('Users table ready');
    });

    // 角色表
    db.run(`CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      system_prompt TEXT,
      is_builtin INTEGER DEFAULT 0,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`, (err) => {
      if (err) console.error('Error creating roles table:', err);
      else console.log('Roles table ready');
    });

    // 聊天记录表
    db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`, (err) => {
      if (err) console.error('Error creating chat_messages table:', err);
      else console.log('Chat messages table ready');
    });

    // 日记表
    db.run(`CREATE TABLE IF NOT EXISTS diaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      mood TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`, (err) => {
      if (err) console.error('Error creating diaries table:', err);
      else console.log('Diaries table ready');
    });

    // 用户设置表
    db.run(`CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      api_key TEXT,
      api_url TEXT DEFAULT 'https://api.moonshot.cn/v1/chat/completions',
      model TEXT DEFAULT 'moonshot-v1-8k',
      current_role_id INTEGER,
      chat_background TEXT,
      user_avatar TEXT,
      bot_avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`, (err) => {
      if (err) console.error('Error creating user_settings table:', err);
      else console.log('User settings table ready');
    });

    // 插入默认内置角色（如果不存在）
    db.get("SELECT COUNT(*) as count FROM roles WHERE is_builtin = 1", (err, row) => {
      if (err) {
        console.error('Error checking builtin roles:', err);
        return;
      }
      
      if (row.count === 0) {
        const defaultRoles = [
          {
            name: '叶修',
            description: '一个冷静、理性、温和，带着微妙幽默感的AI同伴',
            system_prompt: '你是叶修，一个冷静、理性、温和的AI同伴。你说话简洁有力，偶尔带有一点幽默感。你善于倾听，会在对方需要的时候给出建议，但不会强加自己的观点。你尊重每个人的选择，用平和的语气与人交流。重要：你必须始终以"叶修"自称，在回复中如果提到自己，必须使用"叶修"这个名字，不能使用其他名字或称呼。'
          },
          {
            name: 'helpful助手',
            description: '一个友好高效的日常任务AI助手',
            system_prompt: '你是一个 helpful 的AI助手。你高效、准确、友好，善于解决各种实际问题。你会尽可能提供详细且实用的信息，帮助用户完成任务。重要：在回复中如果提到自己，请使用"我"或"助手"，不要使用其他角色名字。'
          }
        ];

        const stmt = db.prepare(`INSERT INTO roles (user_id, name, description, system_prompt, is_builtin, is_default) VALUES (NULL, ?, ?, ?, 1, ?)`);
        
        defaultRoles.forEach((role, index) => {
          stmt.run(role.name, role.description, role.system_prompt, index === 0 ? 1 : 0, (err) => {
            if (err) console.error('Error inserting default role:', err);
          });
        });
        
        stmt.finalize();
        console.log('Default builtin roles created');
      }
    });
  });
}

// JWT验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB限制
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ==================== 认证相关 API ====================

// 注册
app.post('/api/auth/register', async (req, res) => {
  const { username, password, email } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // 验证用户名长度
  if (username.length < 2 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be between 2 and 20 characters' });
  }

  // 验证密码长度
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // 验证邮箱格式
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email || null],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: err.message });
        }
        
        const userId = this.lastID;
        
        // 创建默认设置
        db.run(
          'INSERT INTO user_settings (user_id) VALUES (?)',
          [userId],
          (err) => {
            if (err) {
              console.error('Error creating user settings:', err);
            }
          }
        );
        
        const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: userId, username, email: email || null } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 登录
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({ token, user: { id: user.id, username: user.username } });
    }
  );
});

// 获取当前用户信息
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ==================== 角色相关 API ====================

// 获取所有角色（包括内置和用户自定义）
app.get('/api/roles', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  db.all(
    `SELECT r.*, 
      CASE WHEN r.is_builtin = 1 THEN 'builtin' ELSE 'custom' END as type
     FROM roles r 
     WHERE r.is_builtin = 1 OR r.user_id = ?
     ORDER BY r.is_builtin DESC, r.created_at ASC`,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// 创建角色
app.post('/api/roles', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { name, description, system_prompt } = req.body;
  
  if (!name || !system_prompt) {
    return res.status(400).json({ error: 'Name and system prompt are required' });
  }

  db.run(
    'INSERT INTO roles (user_id, name, description, system_prompt) VALUES (?, ?, ?, ?)',
    [userId, name, description || '', system_prompt],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT *, "custom" as type FROM roles WHERE id = ?',
        [this.lastID],
        (err, row) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json(row);
        }
      );
    }
  );
});

// 更新角色
app.put('/api/roles/:id', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const roleId = req.params.id;
  const { name, description, system_prompt } = req.body;
  
  db.run(
    `UPDATE roles 
     SET name = ?, description = ?, system_prompt = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND (user_id = ? OR is_builtin = 0)`,
    [name, description, system_prompt, roleId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Role not found or cannot be modified' });
      }
      
      db.get(
        'SELECT *, CASE WHEN is_builtin = 1 THEN "builtin" ELSE "custom" END as type FROM roles WHERE id = ?',
        [roleId],
        (err, row) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json(row);
        }
      );
    }
  );
});

// 删除角色
app.delete('/api/roles/:id', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const roleId = req.params.id;
  
  db.run(
    'DELETE FROM roles WHERE id = ? AND user_id = ? AND is_builtin = 0',
    [roleId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Role not found or cannot be deleted' });
      }
      
      res.json({ message: 'Role deleted successfully' });
    }
  );
});

// ==================== 聊天记录相关 API ====================

// 获取角色的聊天记录
app.get('/api/chat/:roleId', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const roleId = req.params.roleId;
  
  db.all(
    `SELECT id, role, content, timestamp 
     FROM chat_messages 
     WHERE user_id = ? AND role_id = ?
     ORDER BY timestamp ASC`,
    [userId, roleId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// 添加聊天记录
app.post('/api/chat/:roleId', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const roleId = req.params.roleId;
  const { role, content } = req.body;
  
  if (!role || !content) {
    return res.status(400).json({ error: 'Role and content are required' });
  }

  db.run(
    'INSERT INTO chat_messages (user_id, role_id, role, content) VALUES (?, ?, ?, ?)',
    [userId, roleId, role, content],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM chat_messages WHERE id = ?',
        [this.lastID],
        (err, row) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json(row);
        }
      );
    }
  );
});

// 清空角色的聊天记录
app.delete('/api/chat/:roleId', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const roleId = req.params.roleId;
  
  db.run(
    'DELETE FROM chat_messages WHERE user_id = ? AND role_id = ?',
    [userId, roleId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ message: 'Chat history cleared', deletedCount: this.changes });
    }
  );
});

// ==================== 日记相关 API ====================

// 获取所有日记
app.get('/api/diaries', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  db.all(
    `SELECT id, date, title, content, mood, created_at, updated_at
     FROM diaries 
     WHERE user_id = ?
     ORDER BY date DESC, created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// 获取单篇日记
app.get('/api/diaries/:id', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const diaryId = req.params.id;
  
  db.get(
    'SELECT * FROM diaries WHERE id = ? AND user_id = ?',
    [diaryId, userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Diary not found' });
      }
      
      res.json(row);
    }
  );
});

// 创建日记
app.post('/api/diaries', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { date, title, content, mood } = req.body;
  
  if (!date || !title || !content) {
    return res.status(400).json({ error: 'Date, title and content are required' });
  }

  db.run(
    'INSERT INTO diaries (user_id, date, title, content, mood) VALUES (?, ?, ?, ?, ?)',
    [userId, date, title, content, mood || 'happy'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM diaries WHERE id = ?',
        [this.lastID],
        (err, row) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json(row);
        }
      );
    }
  );
});

// 更新日记
app.put('/api/diaries/:id', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const diaryId = req.params.id;
  const { date, title, content, mood } = req.body;
  
  db.run(
    `UPDATE diaries 
     SET date = ?, title = ?, content = ?, mood = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [date, title, content, mood, diaryId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Diary not found' });
      }
      
      db.get(
        'SELECT * FROM diaries WHERE id = ?',
        [diaryId],
        (err, row) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json(row);
        }
      );
    }
  );
});

// 删除日记
app.delete('/api/diaries/:id', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const diaryId = req.params.id;
  
  db.run(
    'DELETE FROM diaries WHERE id = ? AND user_id = ?',
    [diaryId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Diary not found' });
      }
      
      res.json({ message: 'Diary deleted successfully' });
    }
  );
});

// ==================== 设置相关 API ====================

// 获取用户设置
app.get('/api/settings', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  db.get(
    `SELECT s.*, r.name as current_role_name, r.description as current_role_description
     FROM user_settings s
     LEFT JOIN roles r ON s.current_role_id = r.id
     WHERE s.user_id = ?`,
    [userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!row) {
        // 创建设置
        db.run(
          'INSERT INTO user_settings (user_id) VALUES (?)',
          [userId],
          function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            db.get(
              `SELECT s.*, r.name as current_role_name, r.description as current_role_description
               FROM user_settings s
               LEFT JOIN roles r ON s.current_role_id = r.id
               WHERE s.user_id = ?`,
              [userId],
              (err, newRow) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                res.json(newRow || {});
              }
            );
          }
        );
      } else {
        res.json(row);
      }
    }
  );
});

// 更新设置
app.put('/api/settings', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const {
    api_key,
    api_url,
    model,
    voice_input,
    voice_output,
    chat_background,
    user_avatar,
    bot_avatar,
    current_role_id
  } = req.body;
  
  db.run(
    `UPDATE user_settings 
     SET api_key = ?, api_url = ?, model = ?, voice_input = ?, voice_output = ?,
         chat_background = ?, user_avatar = ?, bot_avatar = ?, current_role_id = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [api_key, api_url, model, voice_input, voice_output, 
     chat_background, user_avatar, bot_avatar, current_role_id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        `SELECT s.*, r.name as current_role_name, r.description as current_role_description
         FROM user_settings s
         LEFT JOIN roles r ON s.current_role_id = r.id
         WHERE s.user_id = ?`,
        [userId],
        (err, row) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json(row);
        }
      );
    }
  );
});

// ==================== 文件上传 API ====================

// 上传图片
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, filename: req.file.filename });
});

// ==================== 健康检查 ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`API documentation available at http://0.0.0.0:${PORT}/api/health`);
});

module.exports = app;
