const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    frame: false,
    kiosk: true, // This locks the app to full screen and disables system shortcuts
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#000000',
  });

  // URL of our Next.js frontend
  const startUrl = 'http://localhost:3000';

  // Function to check if the server is ready
  const checkServer = () => {
    http.get(startUrl, (res) => {
      console.log('Frontend server is ready!');
      mainWindow.loadURL(startUrl);
    }).on('error', () => {
      console.log('Waiting for frontend server...');
      setTimeout(checkServer, 1000);
    });
  };

  checkServer();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Handle app lifecycle
app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});
