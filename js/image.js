export class ImageManager {
  constructor() {
    this.events = new Map();
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  }

  init() {
    // Initialize image handling
    this.setupDragAndDrop();
  }

  setupDragAndDrop() {
    const chatContainer = document.querySelector('.chat-container');
    if (!chatContainer) return;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      chatContainer.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // Highlight drop area when dragging
    ['dragenter', 'dragover'].forEach(eventName => {
      chatContainer.addEventListener(eventName, () => {
        chatContainer.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      chatContainer.addEventListener(eventName, () => {
        chatContainer.classList.remove('drag-over');
      });
    });

    // Handle dropped files
    chatContainer.addEventListener('drop', (e) => {
      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter(file => this.supportedFormats.includes(file.type));
      
      if (imageFiles.length > 0) {
        this.handleImageUpload(imageFiles[0]);
      }
    });
  }

  async handleImageUpload(file) {
    if (!file) {
      this.emit('error', new Error('No file selected'));
      return;
    }

    // Validate file type
    if (!this.supportedFormats.includes(file.type)) {
      this.emit('error', new Error('Unsupported file format. Please use JPEG, PNG, GIF, or WebP.'));
      return;
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      this.emit('error', new Error('File too large. Maximum size is 10MB.'));
      return;
    }

    try {
      const imageData = await this.processImage(file);
      
      // Save to gallery
      await this.saveToGallery(imageData, file);
      
      this.emit('uploaded', imageData);
      
    } catch (error) {
      console.error('Image upload failed:', error);
      this.emit('error', error);
    }
  }

  async processImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const imageData = e.target.result;
        
        // Validate that it's actually an image
        const img = new Image();
        img.onload = () => {
          resolve(imageData);
        };
        img.onerror = () => {
          reject(new Error('Invalid image file'));
        };
        img.src = imageData;
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  async saveToGallery(imageData, file) {
    try {
      const galleryItem = {
        id: this.generateImageId(),
        imageData,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        timestamp: new Date().toISOString(),
        width: 0,
        height: 0
      };

      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        galleryItem.width = img.width;
        galleryItem.height = img.height;
        window.app.storage.saveGalleryItem(galleryItem);
      };
      img.src = imageData;

      return galleryItem;
    } catch (error) {
      console.error('Failed to save to gallery:', error);
      throw error;
    }
  }

  generateImageId() {
    return 'image_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async captureFromCamera() {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });

      // Create video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;

      // Create modal for camera interface
      const modal = window.app.ui.showModal(`
        <div style="text-align: center;">
          <video id="camera-preview" style="max-width: 100%; border-radius: 8px; background: black;"></video>
          <div style="margin-top: 16px;">
            <button id="capture-btn" class="action-btn" style="margin-right: 8px;">Capture</button>
            <button id="cancel-camera-btn" class="cancel-btn">Cancel</button>
          </div>
        </div>
      `, 'Camera');

      // Setup video preview
      const preview = modal.querySelector('#camera-preview');
      preview.srcObject = stream;

      // Handle capture
      return new Promise((resolve, reject) => {
        const captureBtn = modal.querySelector('#capture-btn');
        const cancelBtn = modal.querySelector('#cancel-camera-btn');

        captureBtn.addEventListener('click', () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);
          
          // Convert to blob and process
          canvas.toBlob(async (blob) => {
            try {
              const file = new File([blob], 'camera_capture.jpg', { type: 'image/jpeg' });
              const imageData = await this.processImage(file);
              
              // Stop camera
              stream.getTracks().forEach(track => track.stop());
              
              // Save to gallery
              await this.saveToGallery(imageData, file);
              
              window.app.ui.closeModal(modal);
              this.emit('uploaded', imageData);
              resolve(imageData);
            } catch (error) {
              reject(error);
            }
          }, 'image/jpeg', 0.9);
        });

        cancelBtn.addEventListener('click', () => {
          stream.getTracks().forEach(track => track.stop());
          window.app.ui.closeModal(modal);
          reject(new Error('Camera capture cancelled'));
        });

        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            stream.getTracks().forEach(track => track.stop());
            window.app.ui.closeModal(modal);
            reject(new Error('Camera capture cancelled'));
          }
        });
      });

    } catch (error) {
      console.error('Camera access failed:', error);
      this.emit('error', new Error('Camera access denied or not available'));
      throw error;
    }
  }

  async analyzeImage(imageData, prompt = 'What do you see in this image?') {
    try {
      // This would call the vision API
      const response = await window.app.api.sendImageMessage(imageData, window.app.currentRole, []);
      return response;
    } catch (error) {
      console.error('Image analysis failed:', error);
      throw error;
    }
  }

  async editImage(imageData, edits = {}) {
    // Basic image editing capabilities
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Apply filters
        if (edits.brightness !== undefined) {
          ctx.filter = `brightness(${edits.brightness})`;
        }
        
        if (edits.contrast !== undefined) {
          ctx.filter += ` contrast(${edits.contrast})`;
        }
        
        if (edits.blur !== undefined) {
          ctx.filter += ` blur(${edits.blur}px)`;
        }
        
        if (edits.grayscale) {
          ctx.filter += ' grayscale(100%)';
        }
        
        if (edits.sepia) {
          ctx.filter += ' sepia(100%)';
        }
        
        ctx.drawImage(img, 0, 0);
        
        // Convert back to data URL
        const editedImageData = canvas.toDataURL('image/jpeg', 0.9);
        resolve(editedImageData);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for editing'));
      };
      
      img.src = imageData;
    });
  }

  async resizeImage(imageData, maxWidth, maxHeight) {
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (maxHeight / height) * width;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        const resizedImageData = canvas.toDataURL('image/jpeg', 0.9);
        resolve(resizedImageData);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for resizing'));
      };
      
      img.src = imageData;
    });
  }

  async generateThumbnail(imageData, size = 150) {
    return this.resizeImage(imageData, size, size);
  }

  getImageInfo(imageData) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
          size: Math.round(imageData.length * 0.75 / 1024) // Approximate size in KB
        });
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = imageData;
    });
  }

  async createImageCollage(images, cols = 2, rows = 2) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const cellWidth = 400 / cols;
    const cellHeight = 400 / rows;
    
    canvas.width = cellWidth * cols;
    canvas.height = cellHeight * rows;
    
    // Fill background
    ctx.fillStyle = '#051317';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Load and draw images
    const loadedImages = [];
    
    for (let i = 0; i < Math.min(images.length, cols * rows); i++) {
      const img = new Image();
      
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = images[i];
      });
      
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * cellWidth;
      const y = row * cellHeight;
      
      // Calculate aspect ratio to fit image in cell
      const scale = Math.min(cellWidth / img.width, cellHeight / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (cellWidth - scaledWidth) / 2;
      const offsetY = (cellHeight - scaledHeight) / 2;
      
      ctx.drawImage(img, x + offsetX, y + offsetY, scaledWidth, scaledHeight);
    }
    
    return canvas.toDataURL('image/jpeg', 0.9);
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

  // Utility methods
  isImageFile(file) {
    return this.supportedFormats.includes(file.type);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getSupportedFormats() {
    return [...this.supportedFormats];
  }

  getMaxFileSize() {
    return this.maxFileSize;
  }

  // Cleanup
  destroy() {
    this.events.clear();
  }
}
