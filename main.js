const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const LicenseManager = require('./license_manager.js');

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

// Ініціалізація ліцензійного менеджера
let licenseManager;

// Перевірка ліцензії при запуску
async function checkLicenseOnStartup() {
  try {
    licenseManager = new LicenseManager();
    
    // Спочатку перевіряємо чи HWID вже є в базі даних GitHub
    console.log('🔍 Перевіряємо автоматичну ліцензію по HWID...');
    const hwidCheck = await licenseManager.checkHWIDInDatabase();
    
    if (hwidCheck.found) {
      console.log('✅ Ліцензія автоматично знайдена по HWID');
      console.log('📋 Ключ ліцензії:', hwidCheck.license.key);
      return true;
    }
    
    // Якщо HWID не знайдено в базі, перевіряємо локальну ліцензію
    console.log('🔍 HWID не знайдено в базі, перевіряємо локальну ліцензію...');
    const isLicensed = await licenseManager.isLicensed();
    
    if (!isLicensed) {
      console.log('❌ Ліцензія не активована або недійсна');
      return false;
    }
    
    console.log('✅ Локальна ліцензія активна');
    return true;
  } catch (error) {
    console.error('❌ Помилка перевірки ліцензії:', error);
    return false;
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
let licenseWindow;

// Функція для показу вікна активації ліцензії
function showLicenseWindow() {
  // Перевіряємо, чи вже існує вікно ліцензування
  if (licenseWindow) {
    // Якщо вікно вже існує, просто фокусуємо на ньому
    licenseWindow.focus();
    return;
  }

  licenseWindow = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'LOST_icon.ico'),
    title: 'Активація ліцензії - Lost Account Manager',
    resizable: false,
    autoHideMenuBar: true
  });

  licenseWindow.loadFile('license.html');

  licenseWindow.on('closed', () => {
    licenseWindow = null;
    // Якщо головне вікно не створене і вікно ліцензування закрито, виходимо з додатка
    if (!mainWindow) {
      app.quit();
    }
  });
}

async function createWindow() {
  // Перевіряємо ліцензію перед створенням головного вікна
  const isLicensed = await checkLicenseOnStartup();
  
  if (!isLicensed) {
    // Якщо ліцензія не активована, показуємо тільки вікно ліцензування
    showLicenseWindow();
    return;
  }

  // Якщо ліцензія активна, створюємо головне вікно
  createMainWindow();
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
  console.log('Доступне оновлення:', info ? info.version : 'невідома версія');
  if (mainWindow) {
    const version = info && info.version ? info.version : 'невідома';
    mainWindow.webContents.send('update-status', `Доступне оновлення v${version}. Завантаження...`);
  }
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Оновлення не доступні');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'Встановлена остання версія');
  }
});

autoUpdater.on('error', (err) => {
  const errorMessage = err && err.message ? err.message : 'Невідома помилка';
  console.error('Помилка автоматичного оновлення:', errorMessage);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'Помилка перевірки оновлень');
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  const percent = progressObj && progressObj.percent ? Math.round(progressObj.percent) : 0;
  const bytesPerSecond = progressObj && progressObj.bytesPerSecond ? progressObj.bytesPerSecond : 0;
  const transferred = progressObj && progressObj.transferred ? progressObj.transferred : 0;
  const total = progressObj && progressObj.total ? progressObj.total : 0;
  
  let log_message = "Швидкість завантаження: " + bytesPerSecond;
  log_message = log_message + ' - Завантажено ' + percent + '%';
  log_message = log_message + ' (' + transferred + "/" + total + ')';
  console.log(log_message);
  
  if (mainWindow) {
    mainWindow.webContents.send('update-progress', {
      percent: percent,
      transferred: transferred,
      total: total
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
    // Повертаємо тільки необхідні дані, щоб уникнути проблем з клонуванням
    if (result) {
      return {
        updateInfo: result.updateInfo ? {
          version: result.updateInfo.version,
          releaseDate: result.updateInfo.releaseDate,
          releaseName: result.updateInfo.releaseName,
          releaseNotes: result.updateInfo.releaseNotes
        } : null,
        cancelled: result.cancelled || false
      };
    }
    return null;
  } catch (error) {
    console.error('Помилка перевірки оновлень:', error);
    // Повертаємо серіалізовану помилку
    return {
      error: true,
      message: error.message || 'Невідома помилка',
      code: error.code || 'UNKNOWN_ERROR'
    };
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

// IPC обробник для отримання даних акаунтів
ipcMain.handle('get-accounts-data', () => {
  const accountsPath = path.join(app.getPath('userData'), 'accounts.json');
  
  if (!fs.existsSync(accountsPath)) {
    return { accounts: [] };
  }
  
  try {
    const fileContent = fs.readFileSync(accountsPath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Помилка читання accounts.json:', error);
    return { accounts: [] };
  }
});

// IPC обробник для збереження даних акаунтів
ipcMain.handle('save-accounts-data', (event, data) => {
  const accountsPath = path.join(app.getPath('userData'), 'accounts.json');
  
  try {
    fs.writeFileSync(accountsPath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Помилка збереження accounts.json:', error);
    return { success: false, error: error.message };
  }
});

// IPC обробник для читання .maFile
ipcMain.handle('read-mafile', (event, accountLogin) => {
  const maFilesPath = path.join(app.getPath('userData'), 'maFiles');
  const maFilePath = path.join(maFilesPath, `${accountLogin}.maFile`);
  
  try {
    if (!fs.existsSync(maFilePath)) {
      return { success: false, error: `maFile не знайдено для акаунта ${accountLogin}` };
    }
    
    const fileContent = fs.readFileSync(maFilePath, 'utf8');
    const maFileData = JSON.parse(fileContent);
    
    return { 
      success: true, 
      sharedSecret: maFileData.shared_secret,
      identitySecret: maFileData.identity_secret
    };
  } catch (error) {
    console.error(`Помилка читання maFile для ${accountLogin}:`, error);
    return { success: false, error: error.message };
  }
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

// Функція для автоматичного зв'язування maFiles з акаунтами
async function autoLinkMaFiles() {
  try {
    const userDataPath = app.getPath('userData');
    const userAccountsPath = path.join(userDataPath, 'accounts.json');
    const maFilesPath = path.join(userDataPath, 'maFiles');
    
    if (!fs.existsSync(userAccountsPath) || !fs.existsSync(maFilesPath)) {
      return { success: false, linkedCount: 0, notFoundCount: 0, alreadyLinkedCount: 0 };
    }

    const accountsData = JSON.parse(fs.readFileSync(userAccountsPath, 'utf8'));
    const maFiles = fs.readdirSync(maFilesPath).filter(file => file.endsWith('.maFile'));
    
    let linkedCount = 0, notFoundCount = 0, alreadyLinkedCount = 0;

    accountsData.accounts.forEach(account => {
      if (!account.login) return;
      
      if (account.maFilePath && fs.existsSync(account.maFilePath)) {
        alreadyLinkedCount++;
        return;
      }
      
      function calculateSimilarity(str1, str2) {
        const s1 = str1.toLowerCase();
        const s2 = str2.toLowerCase();
        if (s1 === s2) return 100;
        if (s1.includes(s2) || s2.includes(s1)) return 80;
        
        const maxLength = Math.max(s1.length, s2.length);
        let matches = 0;
        for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
          if (s1[i] === s2[i]) matches++;
        }
        return (matches / maxLength) * 60;
      }
      
      let bestMatch = null;
      let bestSimilarity = 0;
      
      maFiles.forEach(maFile => {
        const fileNameWithoutExt = maFile.replace('.maFile', '');
        const similarity = calculateSimilarity(account.login, fileNameWithoutExt);
        
        if (similarity > bestSimilarity && similarity >= 50) {
          bestMatch = maFile;
          bestSimilarity = similarity;
        }
      });
      
      if (bestMatch) {
        account.maFilePath = path.join(maFilesPath, bestMatch);
        linkedCount++;
        console.log(`✓ Автоматично пов'язано "${account.login}" з "${bestMatch}"`);
      } else {
        notFoundCount++;
      }
    });

    fs.writeFileSync(userAccountsPath, JSON.stringify(accountsData, null, 2));
    return { success: true, linkedCount, notFoundCount, alreadyLinkedCount };
  } catch (error) {
    console.log('Помилка автоматичного зв\'язування:', error);
    return { success: false, linkedCount: 0, notFoundCount: 0, alreadyLinkedCount: 0 };
  }
}

// IPC обробники для імпорту/експорту
ipcMain.handle('import-accounts', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Імпорт акаунтів',
      filters: [
        { name: 'JSON файли', extensions: ['json'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled) {
      return { success: false, message: 'Імпорт скасовано' };
    }

    const filePath = result.filePaths[0];
    const importData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Перевіряємо структуру файлу
    if (!importData.accounts || !Array.isArray(importData.accounts)) {
      return { success: false, message: 'Некоректний формат файлу акаунтів' };
    }

    const userAccountsPath = path.join(app.getPath('userData'), 'accounts.json');
    let currentData = { accounts: [] };
    
    // Читаємо поточні акаунти якщо є
    if (fs.existsSync(userAccountsPath)) {
      currentData = JSON.parse(fs.readFileSync(userAccountsPath, 'utf8'));
    }

    // Додаємо імпортовані акаунти (уникаємо дублікатів по логіну)
    const existingLogins = new Set(currentData.accounts.map(acc => acc.login));
    let addedCount = 0;
    
    importData.accounts.forEach(account => {
      if (!existingLogins.has(account.login)) {
        currentData.accounts.push(account);
        addedCount++;
      }
    });

    // Зберігаємо оновлені дані
    fs.writeFileSync(userAccountsPath, JSON.stringify(currentData, null, 2));
    
    // Автоматично пов'язуємо .maFile файли після імпорту акаунтів
    let linkResult = { linkedCount: 0, notFoundCount: 0, alreadyLinkedCount: 0 };
    try {
      const autoLinkResult = await autoLinkMaFiles();
      if (autoLinkResult && autoLinkResult.success) {
        linkResult = autoLinkResult;
      }
    } catch (linkError) {
      console.log('Помилка автоматичного зв\'язування:', linkError);
    }
    
    return { 
      success: true, 
      message: `Імпортовано ${addedCount} акаунтів. Дублікати пропущено: ${importData.accounts.length - addedCount}. Автоматично пов'язано ${linkResult.linkedCount} .maFile файлів.`,
      addedCount,
      duplicatesCount: importData.accounts.length - addedCount,
      linkedCount: linkResult.linkedCount,
      notLinkedCount: linkResult.notFoundCount
    };

  } catch (error) {
    console.error('Помилка імпорту акаунтів:', error);
    return { success: false, message: 'Помилка імпорту акаунтів: ' + error.message };
  }
});

ipcMain.handle('import-trade-history', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Імпорт історії торгівлі',
      filters: [
        { name: 'JSON файли', extensions: ['json'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled) {
      return { success: false, message: 'Імпорт скасовано' };
    }

    const filePath = result.filePaths[0];
    const importData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const userHistoryPath = path.join(app.getPath('userData'), 'trade_history.json');
    
    // Зберігаємо історію (перезаписуємо)
    fs.writeFileSync(userHistoryPath, JSON.stringify(importData, null, 2));
    
    return { success: true, message: 'Історію торгівлі успішно імпортовано' };

  } catch (error) {
    console.error('Помилка імпорту історії:', error);
    return { success: false, message: 'Помилка імпорту історії: ' + error.message };
  }
});

ipcMain.handle('import-mafiles-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Виберіть папку з .maFile файлами',
      properties: ['openDirectory']
    });

    if (result.canceled) {
      return { success: false, message: 'Імпорт скасовано' };
    }

    const selectedFolderPath = result.filePaths[0];
    const userMaFilesPath = path.join(app.getPath('userData'), 'maFiles');
    
    // Створюємо папку maFiles якщо не існує
    if (!fs.existsSync(userMaFilesPath)) {
      fs.mkdirSync(userMaFilesPath, { recursive: true });
    }

    // Читаємо файли з вибраної папки
    const files = fs.readdirSync(selectedFolderPath);
    const maFiles = files.filter(file => file.endsWith('.maFile'));
    
    if (maFiles.length === 0) {
      return { success: false, message: 'У вибраній папці не знайдено .maFile файлів' };
    }

    let copiedCount = 0;
    let skippedCount = 0;

    // Копіюємо кожен .maFile
    maFiles.forEach(file => {
      const sourcePath = path.join(selectedFolderPath, file);
      const destPath = path.join(userMaFilesPath, file);
      
      try {
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(sourcePath, destPath);
          copiedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`Помилка копіювання ${file}:`, error);
      }
    });

    // Автоматично пов'язуємо .maFile файли після імпорту
    let linkResult = { linkedCount: 0, notFoundCount: 0, alreadyLinkedCount: 0 };
    try {
      const autoLinkResult = await autoLinkMaFiles();
      if (autoLinkResult && autoLinkResult.success) {
        linkResult = autoLinkResult;
      }
    } catch (linkError) {
      console.log('Помилка автоматичного зв\'язування після імпорту maFiles:', linkError);
    }

    return { 
      success: true, 
      message: `Імпортовано ${copiedCount} .maFile файлів. Пропущено (вже існують): ${skippedCount}. Автоматично пов'язано ${linkResult.linkedCount} з акаунтами.`,
      copiedCount,
      skippedCount,
      totalFound: maFiles.length,
      linkedCount: linkResult.linkedCount
    };

  } catch (error) {
    console.error('Помилка імпорту maFiles:', error);
    return { success: false, message: 'Помилка імпорту maFiles: ' + error.message };
  }
});

// Новий обробник для автоматичного зіставлення .maFile файлів з акаунтами
ipcMain.handle('auto-link-mafiles', async () => {
  try {
    const result = await autoLinkMaFiles();
    
    const message = `Результат автоматичного зв'язування:
• Пов'язано: ${result.linkedCount} акаунтів
• Вже були пов'язані: ${result.alreadyLinkedCount} акаунтів  
• Не знайдено .maFile: ${result.notFoundCount} акаунтів`;

    console.log(message);
    
    return {
      success: result.success,
      message,
      linkedCount: result.linkedCount,
      notFoundCount: result.notFoundCount,
      alreadyLinkedCount: result.alreadyLinkedCount
    };

  } catch (error) {
    console.error('Помилка автоматичного зв\'язування maFiles:', error);
    return { success: false, message: 'Помилка автоматичного зв\'язування: ' + error.message };
  }
});

// Обробник для ручного зіставлення .maFile з акаунтом
ipcMain.handle('manual-link-mafile', async (event, accountLogin) => {
  try {
    const userDataPath = app.getPath('userData');
    const userAccountsPath = path.join(userDataPath, 'accounts.json');
    const maFilesPath = path.join(userDataPath, 'maFiles');
    
    if (!fs.existsSync(userAccountsPath)) {
      return { success: false, message: 'Файл акаунтів не знайдено' };
    }
    
    if (!fs.existsSync(maFilesPath)) {
      return { success: false, message: 'Папка maFiles не знайдена' };
    }

    // Показуємо діалог вибору файлу
    const result = await dialog.showOpenDialog({
      title: `Виберіть .maFile для акаунта "${accountLogin}"`,
      defaultPath: maFilesPath,
      filters: [
        { name: 'maFile файли', extensions: ['maFile'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || !result.filePaths.length) {
      return { success: false, message: 'Вибір скасовано' };
    }

    const selectedFilePath = result.filePaths[0];
    
    // Перевіряємо, що вибраний файл знаходиться в папці maFiles
    if (!selectedFilePath.startsWith(maFilesPath)) {
      return { success: false, message: 'Вибраний файл має знаходитися в папці maFiles' };
    }

    // Читаємо акаунти
    const accountsData = JSON.parse(fs.readFileSync(userAccountsPath, 'utf8'));
    
    if (!accountsData.accounts || !Array.isArray(accountsData.accounts)) {
      return { success: false, message: 'Некоректна структура файлу акаунтів' };
    }

    // Знаходимо акаунт і оновлюємо його maFilePath
    const account = accountsData.accounts.find(acc => acc.login === accountLogin);
    
    if (!account) {
      return { success: false, message: `Акаунт "${accountLogin}" не знайдено` };
    }

    account.maFilePath = selectedFilePath;

    // Зберігаємо оновлені дані
    fs.writeFileSync(userAccountsPath, JSON.stringify(accountsData, null, 2));
    
    const fileName = path.basename(selectedFilePath);
    console.log(`Вручну пов'язано "${accountLogin}" з "${fileName}"`);
    
    return {
      success: true,
      message: `Акаунт "${accountLogin}" успішно пов'язано з "${fileName}"`,
      filePath: selectedFilePath
    };

  } catch (error) {
    console.error('Помилка ручного зв\'язування maFile:', error);
    return { success: false, message: 'Помилка ручного зв\'язування: ' + error.message };
  }
});

// IPC обробник для імпорту окремих .maFile файлів
ipcMain.handle('import-mafiles-individual', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Виберіть .maFile файли для імпорту',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'maFile файли', extensions: ['maFile'] },
        { name: 'Всі файли', extensions: ['*'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, message: 'Імпорт скасовано' };
    }

    const userMaFilesPath = path.join(app.getPath('userData'), 'maFiles');
    
    // Створюємо папку maFiles якщо не існує
    if (!fs.existsSync(userMaFilesPath)) {
      fs.mkdirSync(userMaFilesPath, { recursive: true });
    }

    let copiedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errorFiles = [];

    // Копіюємо кожен вибраний файл
    result.filePaths.forEach(filePath => {
      try {
        const fileName = path.basename(filePath);
        
        // Перевіряємо, що це дійсно .maFile
        if (!fileName.endsWith('.maFile')) {
          errorFiles.push(`${fileName} (не .maFile)`);
          errorCount++;
          return;
        }

        const destPath = path.join(userMaFilesPath, fileName);
        
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(filePath, destPath);
          copiedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`Помилка копіювання ${filePath}:`, error);
        errorFiles.push(path.basename(filePath));
        errorCount++;
      }
    });

    // Автоматично пов'язуємо .maFile файли після імпорту
    let linkResult = { linkedCount: 0, notFoundCount: 0, alreadyLinkedCount: 0 };
    try {
      const autoLinkResult = await autoLinkMaFiles();
      if (autoLinkResult && autoLinkResult.success) {
        linkResult = autoLinkResult;
      }
    } catch (linkError) {
      console.log('Помилка автоматичного зв\'язування після імпорту окремих maFiles:', linkError);
    }

    let message = `Імпорт файлів завершено:
• Скопійовано: ${copiedCount} файлів
• Пропущено (вже існують): ${skippedCount} файлів`;

    if (errorCount > 0) {
      message += `
• Помилки: ${errorCount} файлів (${errorFiles.join(', ')})`;
    }

    message += `
• Автоматично пов'язано: ${linkResult.linkedCount} акаунтів`;

    return { 
      success: true, 
      message,
      copiedCount,
      skippedCount,
      errorCount,
      linkResult
    };

  } catch (error) {
    console.error('Помилка імпорту окремих maFiles:', error);
    return { success: false, message: 'Помилка імпорту: ' + error.message };
  }
});

ipcMain.handle('export-accounts', async () => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Експорт акаунтів',
      defaultPath: 'accounts-backup.json',
      filters: [
        { name: 'JSON файли', extensions: ['json'] }
      ]
    });

    if (result.canceled) {
      return { success: false, message: 'Експорт скасовано' };
    }

    const userAccountsPath = path.join(app.getPath('userData'), 'accounts.json');
    
    if (!fs.existsSync(userAccountsPath)) {
      return { success: false, message: 'Файл акаунтів не знайдено' };
    }

    const accountsData = fs.readFileSync(userAccountsPath, 'utf8');
    fs.writeFileSync(result.filePath, accountsData);
    
    return { success: true, message: 'Акаунти успішно експортовано' };

  } catch (error) {
    console.error('Помилка експорту акаунтів:', error);
    return { success: false, message: 'Помилка експорту акаунтів: ' + error.message };
  }
});

// Обробники для налаштувань
ipcMain.handle('get-settings', async () => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    
    if (!fs.existsSync(settingsPath)) {
      // Створюємо дефолтні налаштування
      const defaultSettings = {
        language: 'uk',
        currency: 'uah'
      };
      fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }
    
    const settingsData = fs.readFileSync(settingsPath, 'utf8');
    return JSON.parse(settingsData);
  } catch (error) {
    console.error('Помилка завантаження налаштувань:', error);
    return { language: 'uk', currency: 'uah' };
  }
});

ipcMain.handle('save-settings', async (event, settings) => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return { success: true, message: 'Налаштування збережено' };
  } catch (error) {
    console.error('Помилка збереження налаштувань:', error);
    return { success: false, message: 'Помилка збереження налаштувань: ' + error.message };
  }
});

// === IPC обробники для ліцензування ===

// Отримання HWID
ipcMain.handle('get-hwid', async () => {
  try {
    if (!licenseManager) {
      licenseManager = new LicenseManager();
    }
    return licenseManager.getHWID();
  } catch (error) {
    console.error('Помилка отримання HWID:', error);
    throw error;
  }
});

// Активація ліцензії
ipcMain.handle('activate-license', async (event, licenseKey) => {
  try {
    if (!licenseManager) {
      licenseManager = new LicenseManager();
    }
    
    const result = await licenseManager.activateLicense(licenseKey);
    
    if (result.success) {
      // Якщо ліцензія активована успішно і головне вікно ще не створене, створюємо його
      if (!mainWindow) {
        setTimeout(() => {
          createMainWindow();
        }, 1000);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Помилка активації ліцензії:', error);
    return { success: false, error: error.message };
  }
});

// Перевірка ліцензії
ipcMain.handle('check-license', async () => {
  try {
    if (!licenseManager) {
      licenseManager = new LicenseManager();
    }
    
    const validation = await licenseManager.validateLicense();
    
    if (validation.valid) {
      const licenseInfo = licenseManager.getLicenseInfo();
      return {
        valid: true,
        license: licenseInfo
      };
    } else {
      return validation;
    }
  } catch (error) {
    console.error('Помилка перевірки ліцензії:', error);
    return { valid: false, error: error.message };
  }
});

// Видалення ліцензії
ipcMain.handle('remove-license', async () => {
  try {
    if (!licenseManager) {
      licenseManager = new LicenseManager();
    }
    
    const result = await licenseManager.removeLicense();
    
    if (result && mainWindow) {
      // Закриваємо головне вікно після видалення ліцензії
      mainWindow.close();
      mainWindow = null;
    }
    
    return result;
  } catch (error) {
    console.error('Помилка видалення ліцензії:', error);
    return false;
  }
});

// Відкриття вікна ліцензування з головного інтерфейсу
ipcMain.handle('open-license-window', async () => {
  try {
    showLicenseWindow();
    return true;
  } catch (error) {
    console.error('Помилка відкриття вікна ліцензування:', error);
    return false;
  }
});

// === IPC обробники для оновлень у вікні ліцензування ===

// Ручна перевірка оновлень
ipcMain.handle('check-for-updates-manual', async () => {
  try {
    console.log('Manual update check requested from license window');
    
    if (!app.isPackaged) {
      return {
        available: false,
        currentVersion: require('./package.json').version,
        message: 'Оновлення доступні тільки для збудованих версій'
      };
    }
    
    const result = await autoUpdater.checkForUpdates();
    const currentVersion = require('./package.json').version;
    
    if (result && result.updateInfo) {
      const newVersion = result.updateInfo.version;
      const isNewerVersion = newVersion !== currentVersion;
      
      return {
        available: isNewerVersion,
        currentVersion: currentVersion,
        newVersion: newVersion,
        size: result.updateInfo.files?.[0]?.size ? 
              `${Math.round(result.updateInfo.files[0].size / 1024 / 1024)} MB` : 
              'Невідомо'
      };
    }
    
    return {
      available: false,
      currentVersion: currentVersion
    };
  } catch (error) {
    console.error('Помилка перевірки оновлень:', error);
    throw new Error('Не вдалося перевірити оновлення: ' + error.message);
  }
});

// Ручне завантаження оновлення
ipcMain.handle('download-update-manual', async () => {
  try {
    console.log('Manual update download requested from license window');
    
    if (!app.isPackaged) {
      throw new Error('Завантаження оновлень доступне тільки для збудованих версій');
    }
    
    // Спочатку перевіряємо оновлення
    const updateCheck = await autoUpdater.checkForUpdates();
    
    if (!updateCheck || !updateCheck.updateInfo) {
      throw new Error('Оновлення не знайдено');
    }
    
    // Завантажуємо оновлення
    await autoUpdater.downloadUpdate();
    
    return {
      success: true,
      message: 'Оновлення завантажено успішно'
    };
  } catch (error) {
    console.error('Помилка завантаження оновлення:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Функція для створення головного вікна після успішної активації ліцензії
function createMainWindow() {
  // Створюємо необхідні директорії перед запуском
  ensureDataDirectories();
  
  // Визначаємо шлях до іконки більш надійно
  let iconPath;
  if (app.isPackaged) {
    // У збудованому додатку спробуємо різні шляхи
    const possiblePaths = [
      path.join(process.resourcesPath, 'LOST_icon.ico'),
      path.join(process.resourcesPath, 'app.asar.unpacked', 'LOST_icon.ico'),
      path.join(__dirname, 'LOST_icon.ico'),
      path.join(path.dirname(process.execPath), 'resources', 'LOST_icon.ico')
    ];
    
    console.log('=== ICON PATH DEBUGGING ===');
    console.log('process.resourcesPath:', process.resourcesPath);
    console.log('__dirname:', __dirname);
    console.log('process.execPath:', process.execPath);
    console.log('process.cwd():', process.cwd());
    
    iconPath = possiblePaths.find(p => {
      const exists = fs.existsSync(p);
      console.log(`Checking icon path: ${p} - ${exists ? 'EXISTS' : 'NOT FOUND'}`);
      return exists;
    });
    
    console.log('Final selected icon path:', iconPath);
    console.log('=== END ICON DEBUGGING ===');
  } else {
    iconPath = path.join(__dirname, 'LOST_icon.ico');
    console.log('Development icon path:', iconPath);
  }
  
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
 
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile('index.html'); 
  
  // Перевірка оновлень після запуску вікна
  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
  
  // Закриваємо вікно ліцензування якщо воно відкрите
  if (licenseWindow) {
    licenseWindow.close();
    licenseWindow = null;
  }
}