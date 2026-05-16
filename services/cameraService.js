const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class CameraService {
  constructor() {
    this.isLiveViewRunning = false;
    this.liveViewProcess = null;
    // Use absolute paths relative to project root
    const rootDir = process.cwd();
    this.photoDir = path.resolve(rootDir, process.env.RAW_PHOTOS_DIR || './photos/raw');
    
    if (!fs.existsSync(this.photoDir)) {
      fs.mkdirSync(this.photoDir, { recursive: true });
    }
  }

  async checkConnection() {
    return new Promise((resolve) => {
      exec('gphoto2 --auto-detect', (error, stdout) => {
        if (error) return resolve({ connected: false });
        const lines = stdout.trim().split('\n');
        if (lines.length > 2) {
          const model = lines[2].split(/\s{2,}/)[0];
          resolve({ connected: true, model });
        } else {
          resolve({ connected: false });
        }
      });
    });
  }

  async startLiveView(onFrame) {
    if (this.isLiveViewRunning) return;
    this.isLiveViewRunning = true;
    console.log('Starting Live View...');

    const captureFrame = () => {
      if (!this.isLiveViewRunning) return;

      this.liveViewProcess = spawn('gphoto2', ['--capture-preview', '--stdout']);
      
      let chunks = [];
      this.liveViewProcess.stdout.on('data', (data) => {
        chunks.push(data);
      });

      this.liveViewProcess.on('close', (code) => {
        this.liveViewProcess = null;
        if (code === 0 && chunks.length > 0) {
          const buffer = Buffer.concat(chunks);
          const base64 = buffer.toString('base64');
          onFrame(`data:image/jpeg;base64,${base64}`);
        }
        
        if (this.isLiveViewRunning) {
          setTimeout(captureFrame, 50);
        }
      });

      this.liveViewProcess.on('error', (err) => {
        console.error('LiveView Process Error:', err);
        this.liveViewProcess = null;
      });
    };

    captureFrame();
  }

  stopLiveView() {
    console.log('Stopping Live View...');
    this.isLiveViewRunning = false;
    if (this.liveViewProcess) {
      this.liveViewProcess.kill('SIGKILL');
      this.liveViewProcess = null;
    }
  }

  async takePicture() {
    const filename = `photo_${Date.now()}.jpg`;
    const filePath = path.join(this.photoDir, filename);
    const wasLiveViewRunning = this.isLiveViewRunning;

    if (wasLiveViewRunning) {
      this.stopLiveView();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return new Promise((resolve, reject) => {
      console.log('Capture request received');
      const cmd = `gphoto2 --capture-image-and-download --filename=${filePath}`;
      
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error('GPhoto2 Error:', stderr);
          let userMessage = stderr || error.message;
          
          if (userMessage.includes('Could not claim the USB device') || userMessage.includes('busy')) {
            userMessage = "KAMERA SIBUK. Pastikan gvfs-gphoto2-volume-monitor sudah dimatikan atau tunggu sebentar.";
          }
          
          return reject(new Error(userMessage));
        }
        
        if (fs.existsSync(filePath)) {
          resolve({
            filename,
            path: `/photos/raw/${filename}`,
            fullPath: filePath
          });
        } else {
          reject(new Error('Photo not found after capture'));
        }
      });
    });
  }
}

module.exports = new CameraService();
