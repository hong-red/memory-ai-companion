export class ChatAPI {
  constructor() {
    this.baseURL = 'https://api.moonshot.cn/v1';
    this.model = 'moonshot-v1-8k';
    this.maxTokens = 2000;
    this.temperature = 0.7;
  }

  async getApiKey() {
    // Try to get from localStorage first
    const apiKey = localStorage.getItem('moonshot_api_key');
    if (apiKey) return apiKey;

    // Try to get from IndexedDB
    try {
      const request = indexedDB.open('AICompanionDB', 1);
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction('settings', 'readonly');
          const store = transaction.objectStore('settings');
          const getRequest = store.get('moonshot_api_key');
          
          getRequest.onsuccess = () => {
            const setting = getRequest.result;
            resolve(setting ? setting.value : null);
          };
          
          getRequest.onerror = () => resolve(null);
        };
        
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.warn('Failed to get API key from IndexedDB:', error);
      return null;
    }
  }

  async makeRequest(endpoint, payload) {
    const apiKey = await this.getApiKey();
    
    if (!apiKey) {
      throw new Error('API key not configured. Please set your Moonshot API key in settings.');
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async sendMessage(message, role, chatHistory = []) {
    // Build conversation history
    const messages = [
      {
        role: 'system',
        content: role.systemPrompt || `You are ${role.name}. ${role.description || ''}`
      }
    ];

    // Add recent chat history (last 10 messages)
    const recentHistory = chatHistory.slice(-10);
    recentHistory.forEach(msg => {
      if (msg.role === 'user') {
        messages.push({
          role: 'user',
          content: msg.content
        });
      } else if (msg.role === 'bot') {
        messages.push({
          role: 'assistant',
          content: msg.content
        });
      }
    });

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    try {
      const response = await this.makeRequest('/chat/completions', {
        model: this.model,
        messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        stream: false
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Chat API error:', error);
      throw error;
    }
  }

  async sendImageMessage(imageData, role, chatHistory = []) {
    // For vision models, we need to include the image in the message
    const messages = [
      {
        role: 'system',
        content: role.systemPrompt || `You are ${role.name}. ${role.description || ''} You can see and analyze images.`
      }
    ];

    // Add recent chat history
    const recentHistory = chatHistory.slice(-10);
    recentHistory.forEach(msg => {
      if (msg.role === 'user') {
        messages.push({
          role: 'user',
          content: msg.content
        });
      } else if (msg.role === 'bot') {
        messages.push({
          role: 'assistant',
          content: msg.content
        });
      }
    });

    // Add message with image
    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'What do you see in this image?'
        },
        {
          type: 'image_url',
          image_url: {
            url: imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`
          }
        }
      ]
    });

    try {
      // Use vision-capable model
      const visionModel = 'moonshot-v1-vision';
      
      const response = await this.makeRequest('/chat/completions', {
        model: visionModel,
        messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        stream: false
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Vision API error:', error);
      
      // Fallback to regular model if vision fails
      try {
        const fallbackResponse = await this.makeRequest('/chat/completions', {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: role.systemPrompt || `You are ${role.name}. ${role.description || ''}`
            },
            {
              role: 'user',
              content: 'I sent you an image, but you cannot see it. Please respond that you cannot process images and suggest describing it instead.'
            }
          ],
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          stream: false
        });

        return fallbackResponse.choices[0].message.content;
      } catch (fallbackError) {
        throw fallbackError;
      }
    }
  }

  async generateSummary(chatHistory) {
    if (chatHistory.length < 6) {
      throw new Error('Need at least 6 messages to generate summary');
    }

    // Create a summary prompt
    const summaryPrompt = `Please analyze the following conversation and provide a thoughtful summary that captures:
1. The main topics discussed
2. Key insights or important points
3. The overall emotional tone
4. Any significant patterns or themes

Conversation:
${chatHistory.slice(-12).map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}

Please provide a warm, reflective summary in the style of a personal diary entry.`;

    try {
      const response = await this.makeRequest('/chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a thoughtful companion who helps users reflect on their conversations and create meaningful diary entries.'
          },
          {
            role: 'user',
            content: summaryPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.8,
        stream: false
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Summary API error:', error);
      throw error;
    }
  }

  async extractMemories(chatHistory) {
    if (chatHistory.length < 4) {
      return [];
    }

    const memoryPrompt = `Analyze the following conversation and extract important information that should be remembered for future conversations. Look for:
1. Personal preferences
2. Important facts about the user
3. Significant events or experiences
4. Goals or aspirations
5. Emotional states or patterns

For each important piece of information, create a memory card with:
- A clear title
- The content/fact
- Relevant tags

Conversation:
${chatHistory.slice(-8).map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}

Respond in JSON format with an array of memory cards:
[
  {
    "title": "Memory title",
    "content": "Memory content",
    "tags": ["tag1", "tag2"]
  }
]`;

    try {
      const response = await this.makeRequest('/chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a memory extraction assistant. Respond only with valid JSON arrays.'
          },
          {
            role: 'user',
            content: memoryPrompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3,
        stream: false
      });

      const content = response.choices[0].message.content;
      
      try {
        // Parse JSON response
        const memories = JSON.parse(content);
        return Array.isArray(memories) ? memories : [];
      } catch (parseError) {
        console.warn('Failed to parse memory extraction response:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Memory extraction API error:', error);
      return [];
    }
  }

  async generateRoleSuggestion(description) {
    const prompt = `Based on this description: "${description}", create a detailed AI companion role with:
1. A suitable name
2. A brief personality description
3. A comprehensive system prompt that defines their character, speaking style, and behavior

Respond in JSON format:
{
  "name": "Role Name",
  "description": "Brief description",
  "systemPrompt": "Detailed system prompt defining the character"
}`;

    try {
      const response = await this.makeRequest('/chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI character designer. Create engaging and well-defined companion roles. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 600,
        temperature: 0.7,
        stream: false
      });

      const content = response.choices[0].message.content;
      
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.warn('Failed to parse role suggestion:', parseError);
        throw new Error('Invalid role suggestion format');
      }
    } catch (error) {
      console.error('Role suggestion API error:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const response = await this.makeRequest('/chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: 'Hello! Can you respond with "Connection successful"?'
          }
        ],
        max_tokens: 50,
        temperature: 0.1,
        stream: false
      });

      return response.choices[0].message.content.includes('Connection successful');
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async getModelInfo() {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${await this.getApiKey()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get model info:', error);
      throw error;
    }
  }

  // Stream response for real-time typing effect
  async sendMessageStream(message, role, chatHistory = [], onChunk) {
    const apiKey = await this.getApiKey();
    
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    // Build conversation history
    const messages = [
      {
        role: 'system',
        content: role.systemPrompt || `You are ${role.name}. ${role.description || ''}`
      }
    ];

    // Add recent chat history
    const recentHistory = chatHistory.slice(-10);
    recentHistory.forEach(msg => {
      if (msg.role === 'user') {
        messages.push({
          role: 'user',
          content: msg.content
        });
      } else if (msg.role === 'bot') {
        messages.push({
          role: 'assistant',
          content: msg.content
        });
      }
    });

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          stream: true
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return fullContent;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              
              if (content) {
                fullContent += content;
                if (onChunk) {
                  onChunk(content);
                }
              }
            } catch (parseError) {
              // Ignore parsing errors for streaming chunks
            }
          }
        }
      }

      return fullContent;
    } catch (error) {
      console.error('Stream API error:', error);
      throw error;
    }
  }
}
