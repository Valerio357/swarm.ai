const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hidden', // Give it a gorgeous native macOS hidden title bar
    trafficLightPosition: { x: 15, y: 15 }, // Align macOS close/minimize/maximize buttons
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Load our compiled static Expo build
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));

  // Open external links in default browser (like settings, help, etc.)
  win.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});