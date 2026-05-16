require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

const cameraService = require('./services/cameraService');
const imageProcessor = require('./services/imageProcessor');
const QRCode = require('qrcode');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Helper to get Local IP
const getLocalIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

const LOCAL_IP = getLocalIp();

// Ensure directories exist
const dirs = [
  process.env.RAW_PHOTOS_DIR,
  process.env.READY_PHOTOS_DIR,
  process.env.TEMP_DIR
];
dirs.forEach(dir => fs.ensureDirSync(dir));

app.use(cors());
app.use(express.json());
app.use('/photos', express.static(path.join(__dirname, 'photos')));

// Download Route
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, process.env.READY_PHOTOS_DIR, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('camera:status', async () => {
    const status = await cameraService.checkConnection();
    socket.emit('camera:status', status);
  });

  socket.on('photo:take', async () => {
    try {
      console.log('Capture request received');
      socket.emit('photo:capturing');
      
      // 1. Capture Raw Photo
      const rawPhoto = await cameraService.takePicture();
      console.log('Raw captured:', rawPhoto.fullPath);
      
      // 2. Process with Overlay
      socket.emit('photo:processing');
      const readyPath = await imageProcessor.processPhoto(rawPhoto.fullPath);
      const filename = path.basename(readyPath);
      console.log('Processed:', readyPath);

      // 3. Generate QR Code
      const downloadUrl = `http://${LOCAL_IP}:${PORT}/download/${filename}`;
      const qrCodeDataUrl = await QRCode.toDataURL(downloadUrl);

      // Return paths relative to static serve
      const result = {
        raw: `/photos/raw/${rawPhoto.filename}`,
        ready: `/photos/ready/${filename}`,
        qr: qrCodeDataUrl,
        downloadUrl: downloadUrl
      };

      socket.emit('photo:success', result);
    } catch (error) {
      console.error('Capture/Process Error:', error);
      socket.emit('photo:error', { message: error.message });
    }
  });

  socket.on('photo:finalize', async (data) => {
    try {
      const { photos, layout } = data;
      console.log(`Finalizing session with layout: ${layout}`);
      
      // Extract full paths for processing
      const fullPaths = photos.map(p => path.join(__dirname, p.ready));
      
      socket.emit('photo:processing');
      const finalPath = await imageProcessor.createLayout(fullPaths, layout);
      const filename = path.basename(finalPath);
      
      const downloadUrl = `http://${LOCAL_IP}:${PORT}/download/${filename}`;
      const qrCodeDataUrl = await QRCode.toDataURL(downloadUrl);

      const result = {
        ready: `/photos/ready/${filename}`,
        qr: qrCodeDataUrl,
        downloadUrl: downloadUrl
      };

      socket.emit('photo:finalized', result);
    } catch (error) {
      console.error('Finalize Error:', error);
      socket.emit('photo:error', { message: "Gagal membuat layout akhir." });
    }
  });

  socket.on('liveview:start', () => {
    cameraService.startLiveView((frame) => {
      socket.emit('liveview:frame', frame);
    });
  });

  socket.on('liveview:stop', () => {
    cameraService.stopLiveView();
  });

  socket.on('disconnect', () => {
    cameraService.stopLiveView();
    console.log('Client disconnected');
  });
});

// Start Server
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initial camera check
  try {
    const status = await cameraService.checkConnection();
    console.log('Camera Status:', status.connected ? `Connected (${status.model})` : 'Not Detected');
  } catch (err) {
    console.error('Initial Camera Check failed:', err.message);
  }
});
