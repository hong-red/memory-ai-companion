export class VoiceManager {
  constructor() {
    this.recognition = null;
    this.isRecording = false;
    this.events = new Map();
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.selectedVoice = null;
    
    this.init();
  }

  init() {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      
      this.recognition.onstart = () => {
        this.isRecording = true;
        this.emit('start');
      };
      
      this.recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          this.emit('result', finalTranscript);
        }
        
        if (interimTranscript) {
          this.emit('interim', interimTranscript);
        }
      };
      
      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.emit('error', new Error(event.error));
        this.isRecording = false;
      };
      
      this.recognition.onend = () => {
        this.isRecording = false;
        this.emit('end');
      };
    }
    
    // Initialize speech synthesis
    this.loadVoices();
    
    // Reload voices when they change
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  loadVoices() {
    this.voices = this.synthesis.getVoices();
    
    // Select default voice
    this.selectedVoice = this.voices.find(voice => 
      voice.lang === 'en-US' && voice.name.includes('Google')
    ) || this.voices.find(voice => voice.lang === 'en-US') || this.voices[0];
  }

  async startRecording() {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported in this browser');
    }
    
    if (this.isRecording) {
      return;
    }
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.emit('error', error);
      throw error;
    }
  }

  stopRecording() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
    }
  }

  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  speak(text, options = {}) {
    if (!this.synthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }
    
    // Cancel any ongoing speech
    this.synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice
    utterance.voice = options.voice || this.selectedVoice;
    
    // Set options
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    utterance.lang = options.lang || 'en-US';
    
    // Events
    utterance.onstart = () => this.emit('speakStart');
    utterance.onend = () => this.emit('speakEnd');
    utterance.onerror = (event) => this.emit('speakError', event.error);
    
    this.synthesis.speak(utterance);
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  setLanguage(lang) {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
    
    // Update selected voice for the language
    const voice = this.voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (voice) {
      this.selectedVoice = voice;
    }
  }

  setVoice(voiceName) {
    const voice = this.voices.find(v => v.name === voiceName);
    if (voice) {
      this.selectedVoice = voice;
    }
  }

  getVoices() {
    return this.voices;
  }

  getSelectedVoice() {
    return this.selectedVoice;
  }

  isSupported() {
    return !!(this.recognition && this.synthesis);
  }

  // Event system
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }

  off(event, callback) {
    if (this.events.has(event)) {
      const callbacks = this.events.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.events.has(event)) {
      this.events.get(event).forEach(callback => callback(data));
    }
  }

  // Advanced features
  async getAudioLevel() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      source.connect(analyser);
      analyser.fftSize = 256;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const getLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        return average / 255; // Normalize to 0-1
      };
      
      // Clean up after getting initial level
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
      }, 100);
      
      return getLevel();
    } catch (error) {
      console.error('Failed to get audio level:', error);
      return 0;
    }
  }

  async testMicrophone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone test failed:', error);
      return false;
    }
  }

  getSupportedLanguages() {
    const languages = [
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'zh-CN', name: 'Chinese (Mandarin)' },
      { code: 'ja-JP', name: 'Japanese' },
      { code: 'ko-KR', name: 'Korean' },
      { code: 'es-ES', name: 'Spanish' },
      { code: 'fr-FR', name: 'French' },
      { code: 'de-DE', name: 'German' },
      { code: 'it-IT', name: 'Italian' },
      { code: 'pt-BR', name: 'Portuguese' },
      { code: 'ru-RU', name: 'Russian' },
      { code: 'ar-SA', name: 'Arabic' },
      { code: 'hi-IN', name: 'Hindi' }
    ];
    
    return languages;
  }

  async setVoiceSettings(settings) {
    if (settings.language) {
      this.setLanguage(settings.language);
    }
    
    if (settings.voice) {
      this.setVoice(settings.voice);
    }
    
    if (settings.rate !== undefined) {
      this.defaultRate = settings.rate;
    }
    
    if (settings.pitch !== undefined) {
      this.defaultPitch = settings.pitch;
    }
    
    if (settings.volume !== undefined) {
      this.defaultVolume = settings.volume;
    }
  }

  getVoiceSettings() {
    return {
      language: this.recognition ? this.recognition.lang : 'en-US',
      voice: this.selectedVoice ? this.selectedVoice.name : null,
      rate: this.defaultRate || 0.9,
      pitch: this.defaultPitch || 1,
      volume: this.defaultVolume || 1
    };
  }

  // Voice commands
  async processVoiceCommand(transcript) {
    const command = transcript.toLowerCase().trim();
    
    // Simple command patterns
    const commands = {
      'stop recording': () => this.stopRecording(),
      'start recording': () => this.startRecording(),
      'clear chat': () => this.emit('command', 'clearChat'),
      'new chat': () => this.emit('command', 'newChat'),
      'save note': () => this.emit('command', 'saveNote'),
      'help': () => this.emit('command', 'showHelp'),
      'settings': () => this.emit('command', 'openSettings')
    };
    
    for (const [pattern, action] of Object.entries(commands)) {
      if (command.includes(pattern)) {
        action();
        return true;
      }
    }
    
    return false;
  }

  // Audio visualization (for future enhancement)
  createAudioVisualizer() {
    if (!this.isRecording) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    canvas.style.cssText = `
      border: 1px solid rgba(0, 225, 255, 0.3);
      border-radius: 4px;
      background: rgba(5, 19, 23, 0.8);
    `;
    
    const ctx = canvas.getContext('2d');
    
    const draw = async () => {
      if (!this.isRecording) return;
      
      const level = await this.getAudioLevel();
      
      ctx.fillStyle = 'rgba(5, 19, 23, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = 4;
      const barSpacing = 2;
      const numBars = Math.floor(canvas.width / (barWidth + barSpacing));
      
      for (let i = 0; i < numBars; i++) {
        const height = Math.random() * canvas.height * level;
        const hue = 180 + (level * 60); // Cyan to green
        
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.8)`;
        ctx.fillRect(
          i * (barWidth + barSpacing),
          canvas.height - height,
          barWidth,
          height
        );
      }
      
      requestAnimationFrame(draw);
    };
    
    draw();
    
    return canvas;
  }

  // Cleanup
  destroy() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    
    this.events.clear();
    this.isRecording = false;
  }
}
