const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

// Налаштування автоматичного оновлення
if (app.isPackaged) {
  // Налаштовуємо URL для оновлень
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'D1noDen',
    repo: 'lost'
  });
}

autoUpdater.checkForUpdatesAndNotify();

// Логування для автоматичного оновлення (тільки в production)
if (!app.isPackaged) {
  // В режимі розробки використовуємо console
  autoUpdater.logger = console;
} else {
  // В production використовуємо electron-log
  try {
    const log = require('electron-log');
    autoUpdater.logger = log;
    autoUpdater.logger.transports.file.level = 'info';
  } catch (e) {
    console.log('electron-log not available, using console');
    autoUpdater.logger = console;
  }
}

// Створюємо необхідні папки в userData
function ensureDataDirectories() {
  const userDataPath = app.getPath('userData');
  const maFilesPath = path.join(userDataPath, 'maFiles');
  
  // Створюємо папку для maFiles якщо її немає
  if (!fs.existsSync(maFilesPath)) {
    fs.mkdirSync(maFilesPath, { recursive: true });
  }
  
  // Визначаємо шлях до ресурсів
  let resourcesPath;
  if (app.isPackaged) {
    // У збудованому додатку ресурси знаходяться в папці resources
    resourcesPath = process.resourcesPath || path.dirname(process.execPath);
    console.log('Packaged app resources path:', resourcesPath);
  } else {
    // У режимі розробки ресурси в корені проекту
    resourcesPath = __dirname;
    console.log('Development resources path:', resourcesPath);
  }
  
  // Копіюємо існуючі maFiles з ресурсів додатка (якщо є)
  const appMaFilesPath = path.join(resourcesPath, 'maFiles');
  console.log('Checking maFiles path:', appMaFilesPath);
  
  if (fs.existsSync(appMaFilesPath)) {
    console.log('maFiles directory found, copying files...');
    try {
      const files = fs.readdirSync(appMaFilesPath);
      console.log('Found files:', files);
      
      files.forEach(file => {
        const sourcePath = path.join(appMaFilesPath, file);
        const destPath = path.join(maFilesPath, file);
        
        if (!fs.existsSync(destPath) && fs.statSync(sourcePath).isFile()) {
          try {
            fs.copyFileSync(sourcePath, destPath);
            console.log(`Скопійовано ${file} до userData`);
          } catch (error) {
            console.error(`Помилка копіювання ${file}:`, error);
          }
        }
      });
    } catch (error) {
      console.error('Помилка читання директорії maFiles:', error);
    }
  } else {
    console.log('maFiles directory not found at:', appMaFilesPath);
  }
  
  // Копіюємо accounts.json якщо є та якщо файл ще не існує в userData
  const appAccountsPath = path.join(resourcesPath, 'accounts.json');
  const userAccountsPath = path.join(userDataPath, 'accounts.json');
  
  console.log('Checking accounts.json path:', appAccountsPath);
  
  if (fs.existsSync(appAccountsPath) && !fs.existsSync(userAccountsPath)) {
    try {
      fs.copyFileSync(appAccountsPath, userAccountsPath);
      console.log('Скопійовано accounts.json до userData');
    } catch (error) {
      console.error('Помилка копіювання accounts.json:', error);
    }
  } else if (!fs.existsSync(userAccountsPath)) {
    // Створюємо початковий accounts.json, якщо його немає
    try {
      const initialAccounts = { accounts: [] };
      fs.writeFileSync(userAccountsPath, JSON.stringify(initialAccounts, null, 2));
      console.log('Створено початковий accounts.json в userData');
    } catch (error) {
      console.error('Помилка створення accounts.json:', error);
    }
  } else {
    console.log('accounts.json вже існує в userData');
  }
  
  console.log('Директорії ініціалізовані:', { userDataPath, maFilesPath });
}

let mainWindow;

function createWindow() {
  // Створюємо необхідні директорії перед запуском
  ensureDataDirectories();
  
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
 
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile('index.html'); 
  
  // More reliable way to open DevTools
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.openDevTools();
  });

  // Перевірка оновлень після запуску вікна
  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}

app.whenReady().then(() => {
  createWindow();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Обробники подій для автоматичного оновлення
autoUpdater.on('checking-for-update', () => {
  console.log('Перевірка оновлень...');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'Перевірка оновлень...');
  }
});

autoUpdater.on('update-available', (info) => {
  console.log('Доступне оновлення:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', `Доступне оновлення v${info.version}. Завантаження...`);
  }
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Оновлення не доступні');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'Встановлена остання версія');
  }
});

autoUpdater.on('error', (err) => {
  console.error('Помилка автоматичного оновлення:', err);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'Помилка перевірки оновлень');
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Швидкість завантаження: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Завантажено ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  console.log(log_message);
  
  if (mainWindow) {
    mainWindow.webContents.send('update-progress', {
      percent: Math.round(progressObj.percent),
      transferred: progressObj.transferred,
      total: progressObj.total
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Оновлення завантажено');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'Оновлення завантажено. Перезапуск через 5 секунд...');
  }
  
  // Показуємо діалог користувачу
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Оновлення готове',
    message: 'Оновлення завантажено. Перезапустити додаток зараз?',
    buttons: ['Перезапустити', 'Пізніше']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

// IPC обробники для ручної перевірки оновлень
ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return result;
  } catch (error) {
    console.error('Помилка перевірки оновлень:', error);
    throw error;
  }
});

ipcMain.handle('quit-and-install', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// IPC обробники для отримання шляхів
ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('get-accounts-file-path', () => {
  return path.join(app.getPath('userData'), 'accounts.json');
});

ipcMain.handle('get-mafiles-path', () => {
  return path.join(app.getPath('userData'), 'maFiles');
});

ipcMain.handle('ensure-mafiles-directory', () => {
  const maFilesPath = path.join(app.getPath('userData'), 'maFiles');
  if (!fs.existsSync(maFilesPath)) {
    fs.mkdirSync(maFilesPath, { recursive: true });
  }
  return maFilesPath;
});

// IPC обробник для копіювання файлів
ipcMain.handle('copy-mafile', async (event, fileData, fileName) => {
  try {
    console.log('IPC: copy-mafile called');
    console.log('IPC: fileName:', fileName);
    console.log('IPC: fileData length:', fileData.length);
    
    const maFilesPath = path.join(app.getPath('userData'), 'maFiles');
    console.log('IPC: maFilesPath:', maFilesPath);
    
    // Створюємо папку якщо не існує
    if (!fs.existsSync(maFilesPath)) {
      console.log('IPC: Creating maFiles directory...');
      fs.mkdirSync(maFilesPath, { recursive: true });
    } else {
      console.log('IPC: maFiles directory already exists');
    }
    
    const destinationPath = path.join(maFilesPath, fileName);
    console.log('IPC: destinationPath:', destinationPath);
    
    // Конвертуємо данные в Buffer и записуємо
    const buffer = Buffer.from(fileData);
    console.log('IPC: Buffer created, size:', buffer.length);
    
    fs.writeFileSync(destinationPath, buffer);
    console.log('IPC: File written successfully');
    
    // Перевіряємо, що файл дійсно створився
    if (fs.existsSync(destinationPath)) {
      const stats = fs.statSync(destinationPath);
      console.log('IPC: File verification - exists, size:', stats.size);
    } else {
      console.error('IPC: File verification failed - file does not exist');
    }
    
    console.log(`IPC: Файл ${fileName} скопійовано до ${destinationPath}`);
    return destinationPath;
    
  } catch (error) {
    console.error('IPC: Помилка копіювання файлу:', error);
    throw error;
  }
});

// IPC обробники для auth.json
ipcMain.handle('get-auth-file-path', () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'auth.json');
});

ipcMain.handle('read-auth-file', () => {
  try {
    const userDataPath = app.getPath('userData');
    const authPath = path.join(userDataPath, 'auth.json');
    
    if (fs.existsSync(authPath)) {
      const data = fs.readFileSync(authPath, 'utf8');
      return JSON.parse(data);
    } else {
      // Створюємо auth.json з дефолтним паролем, якщо його немає
      const defaultAuth = { password: 'admin' };
      fs.writeFileSync(authPath, JSON.stringify(defaultAuth, null, 2));
      console.log('Створено auth.json з дефолтним паролем');
      return defaultAuth;
    }
  } catch (error) {
    console.error('Помилка читання auth.json:', error);
    throw error;
  }
});

ipcMain.handle('write-auth-file', (event, authData) => {
  try {
    const userDataPath = app.getPath('userData');
    const authPath = path.join(userDataPath, 'auth.json');
    
    fs.writeFileSync(authPath, JSON.stringify(authData, null, 2));
    console.log('auth.json збережено');
    return true;
  } catch (error) {
    console.error('Помилка запису auth.json:', error);
    throw error;
  }
});