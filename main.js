const { app, BrowserWindow , ipcMain ,dialog  } = require('electron');
const path = require('path');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
 
  win.setMenuBarVisibility(false);
  win.loadFile('index.html'); 
  
  // More reliable way to open DevTools
  win.webContents.on('did-finish-load', () => {
    win.webContents.openDevTools();
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});