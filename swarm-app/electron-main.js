const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

const PORT = 49152;
let localServer;

// Start a lightweight, native, zero-dependency Node HTTP server to serve the 'dist' build
function startLocalServer() {
  localServer = http.createServer((req, res) => {
    // Resolve clean files path, ignore queries/hashes
    let reqUrl = req.url.split('?')[0].split('#')[0];
    let filePath = path.join(__dirname, 'dist', reqUrl === '/' ? 'index.html' : reqUrl);
    
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
        contentType = 'image/jpg';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
      case '.ico':
        contentType = 'image/x-icon';
        break;
    }

    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          // Fallback to index.html for SPA router support
          fs.readFile(path.join(__dirname, 'dist', 'index.html'), (err, indexContent) => {
            if (err) {
              res.writeHead(500);
              res.end('Error loading index.html');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(indexContent, 'utf-8');
            }
          });
        } else {
          res.writeHead(500);
          res.end(`Server Error: ${error.code}`);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });

  localServer.listen(PORT, '127.0.0.1', () => {
    console.log(`Local static server running on http://localhost:${PORT}`);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 18, y: 18 },
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Attempt to check if Metro Dev Server (expo start) is running on 8081
  const devServerUrl = 'http://localhost:8081';
  
  const checkReq = http.get(devServerUrl, (res) => {
    // Dev server is running! Load it directly for Live Reloading & developer logs
    console.log('Expo Dev server detected! Loading dev environment...');
    win.loadURL(devServerUrl);
  });

  checkReq.on('error', () => {
    // Dev server not active, load compiled production build via local HTTP server
    console.log('Dev server not running. Loading compiled app from local static server...');
    win.loadURL(`http://localhost:${PORT}`);
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  startLocalServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (localServer) {
    localServer.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});