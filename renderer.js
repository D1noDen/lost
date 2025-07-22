let globalTradeLink = localStorage.getItem('globalTradeLink') || '';
const fs = require('fs');
const path = require('path');
const { ipcRenderer, clipboard } = require('electron');
const SteamTotp = require('steam-totp');
const TradeManager = require('./trade_manager.js');

let accounts = [];
let tradeManager = null;
let filteredAccounts = []; // Для збереження відфільтрованих акаунтів
let searchQuery = ''; // Поточний запит пошуку
let starFilter = 'all'; // Фільтр по стану відфармлення: all | starred | unstarred

// Глобальні шляхи (будуть отримані від main процесу)
let accountsFilePath = '';
let maFilesPath = '';

// Курс USD до UAH (можна оновлювати або отримувати з API)
const USD_TO_UAH_RATE = 41.5;

// Функції для автоматичного оновлення
async function initUpdater() {
  // Отримання версії додатка
  ipcRenderer.invoke('get-app-version').then(version => {
    const versionEl = document.getElementById('app-version');
    if (versionEl) {
      versionEl.textContent = `v${version}`;
    }
  });

  // Отримання шляхів від main процесу
  try {
    accountsFilePath = await ipcRenderer.invoke('get-accounts-file-path');
    maFilesPath = await ipcRenderer.invoke('get-mafiles-path');
    
    console.log('Шляхи ініціалізовані:', { accountsFilePath, maFilesPath });
    
    // Забезпечуємо існування директорії maFiles
    await ipcRenderer.invoke('ensure-mafiles-directory');
  } catch (error) {
    console.error('Помилка ініціалізації шляхів:', error);
  }

  // Обробка статусу оновлення
  ipcRenderer.on('update-status', (event, message) => {
    showUpdateNotification(message, 'info');
  });

  // Обробка прогресу завантаження
  ipcRenderer.on('update-progress', (event, progress) => {
    showUpdateProgress(progress);
  });
}

function checkForUpdates() {
  ipcRenderer.invoke('check-for-updates').then(() => {
    showUpdateNotification('Перевірка оновлень...', 'info');
  }).catch(error => {
    showUpdateNotification('Помилка перевірки оновлень: ' + error.message, 'error');
  });
}

function showUpdateNotification(message, type = 'info') {
  // Створюємо або оновлюємо елемент статусу оновлення
  let updateStatus = document.getElementById('update-status');
  if (!updateStatus) {
    updateStatus = document.createElement('div');
    updateStatus.id = 'update-status';
    updateStatus.className = 'update-notification';
    document.body.appendChild(updateStatus);
  }
  
  updateStatus.className = `update-notification ${type}`;
  updateStatus.textContent = message;
  updateStatus.style.display = 'block';
  
  // Автоматично ховаємо через 10 секунд для звичайних повідомлень
  if (type === 'info' && !message.includes('Завантаження') && !message.includes('завантажено')) {
    setTimeout(() => {
      updateStatus.style.display = 'none';
    }, 10000);
  }
}

function showUpdateProgress(progress) {
  let progressBar = document.getElementById('update-progress');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.id = 'update-progress';
    progressBar.className = 'update-progress';
    progressBar.innerHTML = `
      <div class="progress-label">Завантаження оновлення...</div>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
      <div class="progress-text">0%</div>
    `;
    document.body.appendChild(progressBar);
  }
  
  const progressFill = progressBar.querySelector('.progress-fill');
  const progressText = progressBar.querySelector('.progress-text');
  
  progressFill.style.width = `${progress.percent}%`;
  progressText.textContent = `${progress.percent}%`;
  progressBar.style.display = 'block';
  
  if (progress.percent >= 100) {
    setTimeout(() => {
      progressBar.style.display = 'none';
    }, 2000);
  }
}

function convertUsdToUah(usdPrice) {
  // Видаляємо символ $ та конвертуємо в число
  const cleanPrice = parseFloat(usdPrice.replace('$', ''));
  if (isNaN(cleanPrice)) return 0;
  return (cleanPrice * USD_TO_UAH_RATE).toFixed(2);
}

// Функції для показу індикатора завантаження
function showLoadingIndicator(message = 'Завантаження...') {
  let loadingIndicator = document.getElementById('global-loading-indicator');
  
  if (!loadingIndicator) {
    loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'global-loading-indicator';
    loadingIndicator.className = 'global-loading';
    document.body.appendChild(loadingIndicator);
  }
  
  loadingIndicator.innerHTML = `
    <div class="loading-backdrop">
      <div class="loading-content">
        <div class="loading-spinner">⏳</div>
        <div class="loading-text">${message}</div>
      </div>
    </div>
  `;
  
  loadingIndicator.style.display = 'flex';
}

function hideLoadingIndicator() {
  const loadingIndicator = document.getElementById('global-loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
  }
}

function updateLoadingMessage(message) {
  const loadingIndicator = document.getElementById('global-loading-indicator');
  if (loadingIndicator) {
    const textElement = loadingIndicator.querySelector('.loading-text');
    if (textElement) {
      textElement.textContent = message;
    }
  }
}

function loadAccounts() {
  if (!accountsFilePath) {
    console.error('Шлях до файлу акаунтів ще не ініціалізований');
    return;
  }
  
  if (fs.existsSync(accountsFilePath)) {
    const raw = fs.readFileSync(accountsFilePath);
    try {
      const loaded = JSON.parse(raw).accounts || [];
      accounts = loaded.map((acc, index) => {
        // Встановлюємо ID як порядковий номер (починаючи з 1)
        acc.id = index + 1;
        return {
          ...acc,
          open: acc.open || false,
          lastDrop: acc.lastDrop || '',
          lastDropPrice: acc.lastDropPrice || 0,
          lastDropImageUrl: acc.lastDropImageUrl || '',
          tradeUrl: acc.tradeUrl || '', // Додаємо трейд-лінк
          // Додаємо підтримку двох останніх дропів
          lastDrops: acc.lastDrops || []
        };
      });
      // Зберігаємо оновлені дані з ID
      saveAccounts();
    } catch {
      accounts = [];
    }
  }
  
  // Ініціалізуємо відфільтровані акаунти
  filteredAccounts = [...accounts];
  render();
  renderHistory(); // Рендеримо історію при завантаженні
}

function updateField(index, key, value) {
  if (["income", "expenses", "weeklyIncome", "lastDropPrice"].includes(key)) {
    accounts[index][key] = parseFloat(value) || 0;
  } else {
    accounts[index][key] = value;
  }
  saveAccounts();
  // Оновлюємо відфільтровані акаунти після зміни
  if (searchQuery && searchQuery !== '') {
    searchAccounts(searchQuery);
  } else {
    filteredAccounts = [...accounts];
    render();
  }
  renderHistory(); // Оновлюємо історію при зміні полів
}

function addWeeklyIncome(index) {
  const acc = accounts[index];
  const weekly = parseFloat(acc.weeklyIncome) || 0;
  if (weekly <= 0) return;

  acc.income = (parseFloat(acc.income) || 0) + weekly;
  acc.weeklyIncome = 0;

  // Зберігаємо дату в ISO форматі для коректного сортування
  const date = new Date().toISOString();
  acc.history = acc.history || [];
  acc.history.unshift({ date, amount: weekly });

  saveAccounts();
  
  // Показуємо сповіщення
  showNotification(`💰 Додано ${weekly} грн до ${acc.name || acc.login}`, 'success');
  
  // Оновлюємо відфільтровані акаунти після зміни
  if (searchQuery && searchQuery !== '') {
    searchAccounts(searchQuery);
  } else {
    filteredAccounts = [...accounts];
    render();
  }
  
  // Оновлюємо історію
  renderHistory();
}

function deleteAccount(index) {
  if (confirm('Видалити акаунт?')) {
    accounts.splice(index, 1);
    
    // Перенумеровуємо ID всіх акаунтів після видалення
    accounts.forEach((acc, i) => {
      acc.id = i + 1;
    });
    
    saveAccounts();
    // Оновлюємо відфільтровані акаунти
    if (searchQuery && searchQuery !== '') {
      searchAccounts(searchQuery);
    } else {
      filteredAccounts = [...accounts];
      render();
    }
  }
}

function addAccount() {
  // Визначаємо наступний ID як максимальний існуючий ID + 1
  const nextId = accounts.length > 0 ? Math.max(...accounts.map(acc => acc.id || 0)) + 1 : 1;
  
  accounts.push({
    id: nextId,
    login: '',
    password: '',
    name: '',
    income: 0,
    weeklyIncome: 0,
    expenses: 0,
    starred: false,
    history: [],
    prime: false,
    unlockDate: new Date().toISOString().split('T')[0],
    maFilePath: '',
    tradeUrl: '', // Трейд-лінка
    lastDrop: '',
    lastDropPrice: 0,
    lastDropImageUrl: '',
    lastDrops: [], // Масив для двох останніх дропів
    open: false,
    farming: true
  });
  saveAccounts();
  // Оновлюємо відфільтровані акаунти
  if (searchQuery && searchQuery !== '') {
    searchAccounts(searchQuery);
  } else {
    filteredAccounts = [...accounts];
    render();
  }
}

function daysUntil(dateString) {
  const today = new Date();
  const target = new Date(dateString);
  const diffTime = target - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function updateUnlockDate(index, newDate) {
  accounts[index].unlockDate = newDate;
  saveAccounts();
  // Оновлюємо відфільтровані акаунти після зміни
  if (searchQuery && searchQuery !== '') {
    searchAccounts(searchQuery);
  } else {
    filteredAccounts = [...accounts];
    render();
  }
}

function togglePrime(index) {
  accounts[index].prime = !accounts[index].prime;
  saveAccounts();
  // Оновлюємо відфільтровані акаунти після зміни
  if (searchQuery && searchQuery !== '') {
    searchAccounts(searchQuery);
  } else {
    filteredAccounts = [...accounts];
    render();
  }
}

function selectMaFile(event, index) {
  console.log('selectMaFile called with event:', event);
  const file = event.target.files[0];
  console.log('Selected file object:', file);
  console.log('File properties:', file ? {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    path: file.path, // Це може бути undefined в production
    webkitRelativePath: file.webkitRelativePath
  } : 'No file selected');
  
  if (file && maFilesPath) {
    console.log('Selected file:', file.name, 'Size:', file.size);
    console.log('maFilesPath:', maFilesPath);
    
    // Копіюємо файл в папку maFiles в userData
    const fileName = file.name;
    const destinationPath = path.join(maFilesPath, fileName);
    console.log('Destination path will be:', destinationPath);
    
    // Використовуємо FileReader для читання файлу
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        console.log('FileReader успішно прочитав файл, size:', e.target.result.byteLength);
        
        // Отримуємо дані файлу як ArrayBuffer
        const arrayBuffer = e.target.result;
        const buffer = Buffer.from(arrayBuffer);
        
        console.log('Trying to write file to:', destinationPath);
        
        // Зберігаємо файл в userData/maFiles
        fs.writeFileSync(destinationPath, buffer);
        
        console.log('File successfully written via fs.writeFileSync');
        
        // Зберігаємо правильний шлях
        updateField(index, 'maFilePath', destinationPath);
        console.log(`Файл ${fileName} скопійовано до ${destinationPath}`);
        
        // Показуємо повідомлення про успіх
        showNotification(`✅ Файл ${fileName} успішно завантажено`, 'success');
        
        // Автоматично перейменовуємо файл після завантаження
        setTimeout(async () => {
          console.log('[selectMaFile] Запускаємо автоматичне перейменування...');
          await renameMaFilesToAccountNames();
        }, 500);
        
      } catch (error) {
        console.error('Помилка копіювання файлу через fs:', error);
        console.log('Fallback: trying to copy via IPC...');
        
        // Спробуємо через IPC як fallback
        copyMaFileViaIPC(arrayBuffer, fileName, index);
      }
    };
    
    reader.onerror = function(error) {
      console.error('Помилка читання файлу:', error);
      alert('Помилка читання файлу: ' + error.message);
    };
    
    // Читаємо файл як ArrayBuffer
    reader.readAsArrayBuffer(file);
    
  } else if (!file) {
    alert('Файл не обрано.');
  } else if (!maFilesPath) {
    alert('Папка maFiles не ініціалізована. Спробуйте перезапустити додаток.');
  }
}

// Альтернативна функція через IPC
async function copyMaFileViaIPC(arrayBuffer, fileName, index) {
  try {
    console.log('Спроба копіювання через IPC...');
    console.log('arrayBuffer size:', arrayBuffer.byteLength);
    console.log('fileName:', fileName);
    console.log('index:', index);
    
    // Конвертуємо ArrayBuffer в масив для передачі через IPC
    const uint8Array = new Uint8Array(arrayBuffer);
    const fileData = Array.from(uint8Array);
    
    console.log('Converted to array, length:', fileData.length);
    
    // Копіюємо файл через main процес
    console.log('Invoking IPC copy-mafile...');
    const destinationPath = await ipcRenderer.invoke('copy-mafile', fileData, fileName);
    
    console.log('IPC returned destination path:', destinationPath);
    
    // Зберігаємо правильний шлях
    updateField(index, 'maFilePath', destinationPath);
    console.log(`IPC: Файл ${fileName} скопійовано до ${destinationPath}`);
    
    // Показуємо повідомлення про успіх
    showNotification(`✅ Файл ${fileName} успішно завантажено через IPC`, 'success');
    
    // Автоматично перейменовуємо файл після завантаження через IPC
    setTimeout(async () => {
      console.log('[copyMaFileViaIPC] Запускаємо автоматичне перейменування...');
      await renameMaFilesToAccountNames();
    }, 500);
    
  } catch (error) {
    console.error('Помилка копіювання через IPC:', error);
    alert('Помилка копіювання файлу: ' + error.message);
  }
}

function togglePasswordVisibility(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

function toggleStar(index) {
  accounts[index].starred = !accounts[index].starred;
  const button = document.getElementById(`${index}Button`);

  if (accounts[index].starred) {
    button.classList.remove('unFarm');
    button.classList.add('farm');
  } else {
    button.classList.remove('farm');
    button.classList.add('unFarm');
  }

  saveAccounts();
  // Оновлюємо відфільтровані акаунти після зміни
  if (searchQuery && searchQuery !== '') {
    searchAccounts(searchQuery);
  } else {
    filteredAccounts = applyStarFilter([...accounts]);
    render();
    updateSearchResultCount();
  }
}

function generate2FA(index) {
  const maPath = accounts[index].maFilePath;
  if (!fs.existsSync(maPath)) {
    alert("maFile не знайдено!");
    return;
  }

  try {
    const maData = JSON.parse(fs.readFileSync(maPath));
    const sharedSecret = maData.shared_secret;

    const code = SteamTotp.generateAuthCode(sharedSecret);
    copyToClipboard(code, `🔐 2FA код скопійовано: ${code}`);
  } catch (e) {
    alert("Помилка при зчитуванні maFile: " + e.message);
  }
}

function copyToClipboard(text, message = null) {
  try {
    if (clipboard && typeof clipboard.writeText === 'function') {
      clipboard.writeText(String(text));
    } else if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(String(text));
    } else {
      console.warn('Clipboard API not available');
    }
  } catch (e) {
    console.error('Clipboard write failed:', e);
  }

  // Повідомлення
  if (message) {
    showNotification(message, 'success');
  } else if (text && text.toString().trim() !== '') {
    showNotification('📋 Скопійовано в буфер обміну', 'success');
  } else {
    showNotification('❌ Нічого копіювати', 'warning');
  }
}

// Функція для копіювання загальної суми дропів
function copyTotalDropPrice(index) {
  const acc = accounts[index];
  if (acc.lastDrops && acc.lastDrops.length > 0) {
    const totalPrice = acc.lastDrops.reduce((sum, drop) => sum + parseFloat(drop.priceUAH || 0), 0);
    const formattedTotal = totalPrice.toFixed(2);
    copyToClipboard(formattedTotal, `💰 Загальна сума дропів скопійована: ${formattedTotal} грн`);
  } else {
    showNotification('❌ Немає дропів для копіювання', 'error');
  }
}

// Функція пошуку акаунтів
function searchAccounts(query) {
  searchQuery = query.toLowerCase().trim();

  if (!searchQuery) {
    filteredAccounts = [...accounts];
  } else {
    filteredAccounts = accounts.filter(acc => {
      const login = (acc.login || '').toLowerCase();
      const name = (acc.name || '').toLowerCase();
      const lastDrop = (acc.lastDrop || '').toLowerCase();
      const id = (acc.id || '').toString().toLowerCase();
      return login.includes(searchQuery) || name.includes(searchQuery) || lastDrop.includes(searchQuery) || id.includes(searchQuery);
    });
  }

  filteredAccounts = applyStarFilter(filteredAccounts);

  render();
  updateSearchResultCount();
}

// Обробник введення в поле пошуку
function handleSearchInput(event) {
  const query = event.target.value;
  searchAccounts(query);
}

// Оновлення лічильника результатів пошуку
function updateSearchResultCount() {
  const searchInfo = document.getElementById('search-info');
  if (!searchInfo) return;

  const currentList = applyStarFilter((!searchQuery ? accounts : filteredAccounts));
  if (searchQuery || starFilter !== 'all') {
    searchInfo.textContent = `Знайдено ${currentList.length} з ${accounts.length} акаунтів`;
    searchInfo.style.display = 'block';
  } else {
    searchInfo.style.display = 'none';
  }
}

// Очищення пошуку
function clearSearch() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.value = '';
  }
  searchQuery = '';
  filteredAccounts = [...accounts];
  render();
  updateSearchResultCount();
}

// Функція для оновлення стану завантаження дропів в інтерфейсі
function updateDropLoadingState(index, isLoading) {
  const acc = accounts[index];
  
  // Знаходимо всі елементи, що стосуються цього акаунту
  const accountCard = document.querySelector(`[data-account-index="${index}"]`);
  if (accountCard) {
    if (isLoading) {
      accountCard.classList.add('loading-drop');
    } else {
      accountCard.classList.remove('loading-drop');
    }
  }
  
  // Оновлюємо кнопки в інтерфейсі
  const buttons = [
    document.getElementById(`fetch-drop-${index}`),
    document.querySelector(`[onclick="fetchLastDrop(${index})"]`),
    document.querySelector(`[onclick*="fetchLastDrop(${index})"]`)
  ];
  
  buttons.forEach(button => {
    if (button) {
      if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
        if (button.classList.contains('btn-refresh-drop')) {
          button.innerHTML = '<span class="spinner">🔄</span>';
        } else if (button.classList.contains('btn-fetch-drop-mini')) {
          button.innerHTML = '<span class="spinner">🔄</span>';
        } else {
          button.innerHTML = '<span class="spinner">🔄</span> Завантаження...';
        }
      } else {
        button.classList.remove('loading');
        button.disabled = false;
        if (button.classList.contains('btn-refresh-drop')) {
          button.innerHTML = '🔄';
        } else if (button.classList.contains('btn-fetch-drop-mini')) {
          button.innerHTML = '🎁';
        } else {
          button.innerHTML = '🎁 Отримати дропи зі Steam';
        }
      }
    }
  });
  
  // Додаємо індикатор завантаження поруч з дропами
  const dropSection = document.querySelector(`.account:nth-child(${index + 1}) .drop-info`);
  if (dropSection) {
    let loadingIndicator = dropSection.querySelector('.drop-loading-indicator');
    
    if (isLoading && !loadingIndicator) {
      loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'drop-loading-indicator';
      loadingIndicator.innerHTML = `
        <div class="loading-drop-spinner">
          <span class="spinner-icon">🔄</span>
          <span class="loading-text">Завантаження дропів...</span>
        </div>
      `;
      dropSection.appendChild(loadingIndicator);
    } else if (!isLoading && loadingIndicator) {
      loadingIndicator.remove();
    }
  }
}

async function fetchLastDrop(index) {
  const acc = accounts[index];
  console.log(`[fetchLastDrop] Початок для акаунту ${acc.login}, index: ${index}`);
  
  if (!acc.login || !acc.password) {
    showNotification('Потрібно вказати логін та пароль для акаунту', 'warning');
    return;
  }

  // Спочатку перевіряємо, чи є maFile в заданому шляху
  let maFilePath = acc.maFilePath;
  if (!maFilePath || !fs.existsSync(maFilePath)) {
    // Якщо шлях не вказаний або файл не існує, шукаємо в папці userData
    if (maFilesPath) {
      maFilePath = path.join(maFilesPath, `${acc.login}.maFile`);
    }
    if (!maFilePath || !fs.existsSync(maFilePath)) {
      showNotification(`maFile не знайдено для акаунту ${acc.login}.<br>Перевірено:<br>- ${acc.maFilePath}<br>- ${maFilePath}`, 'error');
      return;
    }
  }

  // Встановлюємо стан завантаження
  accounts[index].loadingDrop = true;
  
  // Оновлюємо інтерфейс з індикатором завантаження
  updateDropLoadingState(index, true);

  try {
    console.log(`[fetchLastDrop] Читаємо maFile: ${maFilePath}`);
    const maFile = JSON.parse(fs.readFileSync(maFilePath));
    const identitySecret = maFile.identity_secret;
    const sharedSecret = maFile.shared_secret;

    if (!identitySecret || !sharedSecret) {
      throw new Error('maFile не містить необхідних секретів');
    }

    // Створюємо новий instance TradeManager для цього акаунту
    tradeManager = new TradeManager();
    
    // Показуємо статус завантаження на всіх можливих кнопках
    const buttons = [
      document.getElementById(`fetch-drop-${index}`),
      document.querySelector(`[onclick="fetchLastDrop(${index})"]`),
      document.querySelector(`[onclick*="fetchLastDrop(${index})"]`)
    ];
    
    // Зберігаємо оригінальний текст кнопок
    const originalTexts = [];
    buttons.forEach((button, i) => {
      if (button) {
        originalTexts[i] = button.innerHTML;
        button.innerHTML = '<span class="spinner">🔄</span> Завантаження дропів...';
        button.disabled = true;
        button.style.opacity = '0.7';
        button.classList.add('loading');
      }
    });

    // Показуємо глобальний індикатор завантаження
    showLoadingIndicator(`Отримання дропів для ${acc.login}...`);

    console.log(`[fetchLastDrop] Намагаємося увійти в акаунт ${acc.login}...`);
    updateLoadingMessage(`Вхід в акаунт ${acc.login}...`);
    await tradeManager.login(acc.login, acc.password, SteamTotp.generateAuthCode(sharedSecret), identitySecret);
    console.log(`[fetchLastDrop] Увійшли в акаунт ${acc.login}`);

    console.log(`[fetchLastDrop] Отримуємо інформацію про дропи...`);
    updateLoadingMessage(`Завантаження інвентаря ${acc.login}...`);
    const dropsInfo = await tradeManager.getLastDrops(acc.login, 2); // Отримуємо 2 останні дропи
    console.log(`[fetchLastDrop] Результат getLastDrops:`, dropsInfo);
    
    updateLoadingMessage(`Обробка даних для ${acc.login}...`);
    
    if (dropsInfo && dropsInfo.length > 0) {
      console.log('[fetchLastDrop] Отримано інформацію про дропи:', dropsInfo);
      
      updateLoadingMessage(`Конвертація цін для ${acc.login}...`);
      // Конвертуємо ціни в гривні та оновлюємо дані
      const convertedDrops = dropsInfo.map(drop => ({
        ...drop,
        priceUAH: convertUsdToUah(drop.price),
        originalPrice: drop.price
      }));
      
      // Оновлюємо дані акаунту
      accounts[index].lastDrops = convertedDrops;
      
      // Для зворотної сумісності зберігаємо перший дроп в старих полях
      if (convertedDrops.length > 0) {
        accounts[index].lastDrop = convertedDrops[0].name;
        accounts[index].lastDropImageUrl = convertedDrops[0].imageUrl;
        accounts[index].lastDropPrice = convertedDrops[0].priceUAH;
      }
      
      console.log('[fetchLastDrop] Оновлені дропи:', convertedDrops);
      
      // Зберігаємо та перерендеруємо
      console.log('[fetchLastDrop] Зберігаємо дані...');
      updateLoadingMessage(`Збереження даних для ${acc.login}...`);
      saveAccounts();
      console.log('[fetchLastDrop] Перерендеруємо...');
      // Оновлюємо відфільтровані акаунти після зміни
      if (searchQuery && searchQuery !== '') {
        searchAccounts(searchQuery);
      } else {
        filteredAccounts = [...accounts];
        render();
      }
      
      const dropsText = convertedDrops.map((drop, i) => 
        `${i + 1}. ${drop.name} - ${drop.priceUAH} грн (${drop.originalPrice})`
      ).join('<br>');
      
      showNotification(`✅ Дропи оновлено для ${acc.login}!<br><br>${dropsText}`, 'success');
    } else {
      console.log('[fetchLastDrop] dropsInfo is null, undefined або порожній');
      showNotification('Не вдалося знайти інформацію про дропи або інвентар порожній', 'warning');
    }

    tradeManager.disconnect();
    
  } catch (e) {
    console.error(`[fetchLastDrop] Помилка при отриманні дропу для ${acc.login}:`, e);
    showNotification(`❌ Помилка для ${acc.login}: ${e.message}`, 'error');
  } finally {
    // Знімаємо стан завантаження
    accounts[index].loadingDrop = false;
    
    // Ховаємо глобальний індикатор завантаження
    hideLoadingIndicator();
    
    // Відновлюємо кнопки
    const buttons = [
      document.getElementById(`fetch-drop-${index}`),
      document.querySelector(`[onclick="fetchLastDrop(${index})"]`),
      document.querySelector(`[onclick*="fetchLastDrop(${index})"]`)
    ];
    
    buttons.forEach((button, i) => {
      if (button) {
        // Відновлюємо оригінальний текст або встановлюємо стандартний
        if (button.id && button.id.includes('fetch-drop')) {
          button.innerHTML = '🎁 Отримати дропи зі Steam';
        } else if (button.classList.contains('btn-refresh-drop')) {
          button.innerHTML = '🔄';
        } else if (button.classList.contains('btn-fetch-drop-mini')) {
          button.innerHTML = '🎁';
        } else {
          button.innerHTML = '🎁';
        }
        button.disabled = false;
        button.style.opacity = '1';
        button.classList.remove('loading');
      }
    });
    
    // Оновлюємо інтерфейс після завершення завантаження
    updateDropLoadingState(index, false);
    
    console.log(`[fetchLastDrop] Завершено для акаунту ${acc.login}`);
  }
}

// Нова функція для отримання повного інвентарю
async function fetchFullInventory(index) {
  const acc = accounts[index];
  console.log(`[fetchFullInventory] Початок для акаунту ${acc.login}, index: ${index}`);
  
  if (!acc.login || !acc.password) {
    showNotification('Потрібно вказати логін та пароль для акаунту', 'warning');
    return;
  }

  // Спочатку перевіряємо, чи є maFile в заданому шляху
  let maFilePath = acc.maFilePath;
  if (!maFilePath || !fs.existsSync(maFilePath)) {
    // Якщо шлях не вказаний або файл не існує, шукаємо в папці userData
    if (maFilesPath) {
      maFilePath = path.join(maFilesPath, `${acc.login}.maFile`);
    }
    if (!maFilePath || !fs.existsSync(maFilePath)) {
      showNotification(`maFile не знайдено для акаунту ${acc.login}.<br>Перевірено:<br>- ${acc.maFilePath}<br>- ${maFilePath}`, 'error');
      return;
    }
  }

  try {
    console.log(`[fetchFullInventory] Читаємо maFile: ${maFilePath}`);
    const maFile = JSON.parse(fs.readFileSync(maFilePath));
    const identitySecret = maFile.identity_secret;
    const sharedSecret = maFile.shared_secret;

    if (!identitySecret || !sharedSecret) {
      throw new Error('maFile не містить необхідних секретів');
    }

    // Створюємо новий instance TradeManager для цього акаунту
    tradeManager = new TradeManager();
    
    // Показуємо статус завантаження на всіх можливих кнопках
    const buttons = [
      document.getElementById(`fetch-inventory-${index}`),
      document.querySelector(`[onclick="fetchFullInventory(${index})"]`)
    ];
    
    // Зберігаємо оригінальний текст кнопок
    const originalTexts = [];
    buttons.forEach((button, i) => {
      if (button) {
        originalTexts[i] = button.textContent;
        button.innerHTML = '<span class="spinner">⏳</span> Завантаження інвентарю...';
        button.disabled = true;
        button.style.opacity = '0.7';
      }
    });

    // Показуємо глобальний індикатор завантаження
    showLoadingIndicator(`Отримання повного інвентарю для ${acc.login}...`);

    console.log(`[fetchFullInventory] Намагаємося увійти в акаунт ${acc.login}...`);
    updateLoadingMessage(`Вхід в акаунт ${acc.login}...`);
    await tradeManager.login(acc.login, acc.password, SteamTotp.generateAuthCode(sharedSecret), identitySecret);
    console.log(`[fetchFullInventory] Увійшли в акаунт ${acc.login}`);

    console.log(`[fetchFullInventory] Отримуємо повний інвентар...`);
    updateLoadingMessage(`Завантаження повного інвентарю ${acc.login}...`);
    const inventoryInfo = await tradeManager.getFullInventory(acc.login, 50); // Максимум 50 предметів
    console.log(`[fetchFullInventory] Результат getFullInventory:`, inventoryInfo);
    
    if (inventoryInfo && inventoryInfo.length > 0) {
      console.log('[fetchFullInventory] Отримано інформацію про інвентар:', inventoryInfo);
      
      updateLoadingMessage(`Обробка інвентарю для ${acc.login}...`);
      
      // Оновлюємо дані акаунту
      accounts[index].fullInventory = inventoryInfo;
      
      // Зберігаємо загальну кількість та вартість
      const totalValue = inventoryInfo.reduce((sum, item) => sum + parseFloat(item.priceUAH || 0), 0);
      accounts[index].inventoryValue = totalValue.toFixed(2);
      accounts[index].inventoryCount = inventoryInfo.length;
      
      console.log('[fetchFullInventory] Оновлений інвентар:', {
        count: inventoryInfo.length,
        totalValue: totalValue.toFixed(2)
      });
      
      // Зберігаємо та перерендеруємо
      console.log('[fetchFullInventory] Зберігаємо дані...');
      saveAccounts();
      console.log('[fetchFullInventory] Перерендеруємо...');
      // Оновлюємо відфільтровані акаунти після зміни
      if (searchQuery && searchQuery !== '') {
        searchAccounts(searchQuery);
      } else {
        filteredAccounts = [...accounts];
        render();
      }
      
      // Оновлюємо портфоліо завжди після зміни інвентаря
      setTimeout(calculateAndDisplayPortfolio, 500);
      
      const inventoryText = `Завантажено ${inventoryInfo.length} предметів<br>Загальна вартість: ${totalValue.toFixed(2)} грн`;
      showNotification(`Інвентар оновлено!<br><br>${inventoryText}`, 'success');
    } else {
      console.log('[fetchFullInventory] inventoryInfo is null, undefined або порожній');
      showNotification('Не вдалося знайти інформацію про інвентар або інвентар порожній', 'warning');
      // Очищаємо інвентар акаунта, щоб видалити з портфоліо
      acc.fullInventory = [];
      acc.inventoryCount = 0;
      acc.inventoryValue = 0;
      saveAccounts();
      setTimeout(calculateAndDisplayPortfolio, 500);
    }

    tradeManager.disconnect();
    
  } catch (e) {
    console.error(`[fetchFullInventory] Помилка при отриманні інвентарю для ${acc.login}:`, e);
    showNotification(`Помилка: ${e.message}`, 'error');
  } finally {
    // Ховаємо глобальний індикатор завантаження
    hideLoadingIndicator();
    
    // Відновлюємо кнопки
    const buttons = [
      document.getElementById(`fetch-inventory-${index}`),
      document.querySelector(`[onclick="fetchFullInventory(${index})"]`)
    ];
    
    buttons.forEach((button, i) => {
      if (button) {
        // Відновлюємо оригінальний текст або встановлюємо стандартний
        if (button.id && button.id.includes('fetch-inventory')) {
          button.innerHTML = '📦 Завантажити повний інвентар';
        } else {
          button.innerHTML = '📦';
        }
        button.disabled = false;
        button.style.opacity = '1';
      }
    });
    console.log(`[fetchFullInventory] Завершено для акаунту ${acc.login}`);
  }
}

function render() {
  const container = document.getElementById('accounts');
  container.innerHTML = '';

  const accountsToRender = applyStarFilter((!searchQuery ? accounts : filteredAccounts));

  // Повідомлення про відсутність результатів
  if (((searchQuery && searchQuery !== '') || starFilter !== 'all') && accountsToRender.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <h3>Нічого не знайдено</h3>
        <p>За запитом "${searchQuery}" не знайдено жодного акаунту</p>
        <button onclick="clearSearch()" class="btn-clear-search-inline">Очистити пошук</button>
      </div>
    `;
    return;
  }

  accountsToRender.forEach((acc, i) => {
    // Знайдемо оригінальний індекс цього акаунту в основному масиві
    const originalIndex = accounts.indexOf(acc);
    
    const passwordId = `password-${originalIndex}`;
    const netProfit = (parseFloat(acc.income || 0) - parseFloat(acc.expenses || 0)).toFixed(2);

    const div = document.createElement('div');
    div.className = 'account';
    div.setAttribute('data-account-index', originalIndex);
    const isOpen = acc.open;

   div.innerHTML = `
  <div class="account-card ${acc.loadingDrop ? 'loading-drop' : ''}"
    data-account-index="${originalIndex}">
    ${acc.prime ? '<span class="prime-badge" title="Prime"><img style="width:50px; height:50px" src="./Prime.png" /></span>' : ''}
    <div class="account-header" onclick="toggleDetails(${originalIndex})">
      <div class="account-title">
        <b>#${i + 1}</b>
        <span>${acc.name || acc.login || 'Без імені'}</span>
        <small class="account-id">ID: ${acc.id}</small>
      </div>
      <button class="btn-global-trade" onclick="event.stopPropagation(); openGlobalTradeModal(${originalIndex})">🌐 Перекинути скіни на глобальну трейд-лінку</button>

      <!-- Завжди показуємо секцію дропу -->
      <div class="drop-preview ${(acc.lastDrops && acc.lastDrops.length > 0) || acc.lastDrop ? 'has-drop' : 'no-drop-yet'}">
        ${(acc.lastDrops && acc.lastDrops.length > 0) ? `
          <div class="drops-container">
            ${acc.lastDrops.slice(0, 2).map((drop, dropIndex) => `
              <div class="drop-item ${dropIndex === 0 ? 'primary-drop' : 'secondary-drop'}">
                <img src="${drop.imageUrl}" alt="${drop.name}" class="drop-preview-image ${dropIndex === 0 ? 'large' : 'small'}" onerror="this.onerror=null; this.outerHTML='<div class=&quot;drop-fallback-svg&quot;><svg width=&quot;40&quot; height=&quot;40&quot; viewBox=&quot;0 0 40 40&quot; fill=&quot;none&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;><rect width=&quot;40&quot; height=&quot;40&quot; rx=&quot;6&quot; fill=&quot;#1f2937&quot; stroke=&quot;#059669&quot; stroke-width=&quot;1&quot; stroke-dasharray=&quot;4,2&quot;/><circle cx=&quot;20&quot; cy=&quot;20&quot; r=&quot;10&quot; stroke=&quot;#10b981&quot; stroke-width=&quot;1&quot; fill=&quot;none&quot; opacity=&quot;0.5&quot;/><path d=&quot;M20 14v12m-6-6h12&quot; stroke=&quot;#059669&quot; stroke-width=&quot;1.5&quot; stroke-linecap=&quot;round&quot;/><circle cx=&quot;20&quot; cy=&quot;20&quot; r=&quot;1.5&quot; fill=&quot;#059669&quot;/></svg></div>'">
                <div class="drop-preview-info">
                  <span class="drop-preview-name">${drop.name}</span>
                  <div class="drop-price-container">
                    <span class="drop-preview-price">💰 ${drop.priceUAH} грн</span>
                    <span class="drop-preview-price-usd">(${drop.originalPrice})</span>
                    <button onclick="event.stopPropagation(); copyDropPrice(${originalIndex}, ${dropIndex})" class="btn-copy-drop" title="Копіювати ціну">📋</button>
                  </div>
                </div>
              </div>
            `).join('')}
            ${acc.lastDrops.length > 1 ? `
              <div class="total-drops-price">
                <span class="total-label">Загалом:</span>
                <span class="total-amount">${(acc.lastDrops.reduce((sum, drop) => sum + parseFloat(drop.priceUAH || 0), 0)).toFixed(2)} грн</span>
                <button onclick="event.stopPropagation(); copyTotalDropPrice(${originalIndex})" class="btn-copy-total" title="Копіювати загальну суму">📋</button>
              </div>
            ` : ''}
          </div>
          <button onclick="event.stopPropagation(); fetchLastDrop(${originalIndex})" class="btn-refresh-drop" title="Оновити дропи">🔄</button>
        ` : acc.lastDrop ? `
          <img src="${acc.lastDropImageUrl}" alt="${acc.lastDrop}" class="drop-preview-image" onerror="this.onerror=null; this.outerHTML='<div class=&quot;drop-fallback-svg&quot;><svg width=&quot;48&quot; height=&quot;48&quot; viewBox=&quot;0 0 48 48&quot; fill=&quot;none&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;><rect width=&quot;48&quot; height=&quot;48&quot; rx=&quot;8&quot; fill=&quot;#1f2937&quot; stroke=&quot;#059669&quot; stroke-width=&quot;1.5&quot; stroke-dasharray=&quot;6,3&quot;/><circle cx=&quot;24&quot; cy=&quot;24&quot; r=&quot;12&quot; stroke=&quot;#10b981&quot; stroke-width=&quot;1.5&quot; fill=&quot;none&quot; opacity=&quot;0.6&quot;/><path d=&quot;M24 18v12m-6-6h12&quot; stroke=&quot;#059669&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot;/><circle cx=&quot;24&quot; cy=&quot;24&quot; r=&quot;2&quot; fill=&quot;#10b981&quot;/></svg></div>'">
          <div class="drop-preview-info">
            <span class="drop-preview-name">${acc.lastDrop}</span>
            <span class="drop-preview-price">💰 ${acc.lastDropPrice} грн</span>
            <button onclick="event.stopPropagation(); copyLastDropPrice(${originalIndex})" class="btn-copy-drop" title="Копіювати ціну">📋</button>
          </div>
          <button onclick="event.stopPropagation(); fetchLastDrop(${originalIndex})" class="btn-refresh-drop" title="Оновити дроп">🔄</button>
        ` : `
          <div class="drop-placeholder">
            <div class="drop-placeholder-content">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="8" fill="none" stroke="#059669" stroke-width="2" stroke-dasharray="6,3" opacity="0.6"/>
                <circle cx="24" cy="24" r="12" stroke="#10b981" stroke-width="1.5" fill="none" opacity="0.7"/>
                <path d="M24 18v12m-6-6h12" stroke="#059669" stroke-width="2" stroke-linecap="round"/>
                <circle cx="24" cy="24" r="2" fill="#10b981"/>
                <text x="24" y="40" text-anchor="middle" fill="#059669" font-family="Arial" font-size="6" font-weight="bold">NO DROP</text>
              </svg>
            </div>
            <div class="drop-preview-info">
              <span class="drop-preview-name">Немає дропів</span>
              <span class="drop-preview-price">Натисніть для отримання</span>
            </div>
            <button onclick="event.stopPropagation(); fetchLastDrop(${originalIndex})" class="btn-fetch-drop-mini" title="Отримати дропи">🎁</button>
          </div>
        `}
      </div>

      <div class="account-meta">
        <span>
          👤 ${acc.login}
          <button onclick="event.stopPropagation(); copyToClipboard('${acc.login}', '👤 Логін скопійовано: ${acc.login}')">📋</button>
        </span>

        <span>
          🔒••••••
          <button onclick="event.stopPropagation(); copyToClipboard('${acc.password}', '🔒 Пароль скопійовано')">📋</button>
        </span>

        <button onclick="event.stopPropagation(); generate2FA(${originalIndex})" class="btn-2fa">📟 Копіювати 2FA</button>

        <button onclick="event.stopPropagation(); copyToClipboard('${acc.tradeUrl || ''}', '🔗 Трейд-лінка скопійована')" class="btn-trade-url" title="Копіювати трейд-лінку">
          🔗 ${acc.tradeUrl ? 'Трейд-лінка' : 'Немає трейд-лінки'}
        </button>

        <button onclick="event.stopPropagation(); toggleFarming(${originalIndex})" class="btn-farming">
          ${acc.farming ? '✅ Фармиться' : '🚫 Не фармиться'}
        </button>

        <button id="${originalIndex}Button" class="buttonFarm ${acc.starred ? 'farm' : 'unFarm'}" onclick="event.stopPropagation(); toggleStar(${originalIndex})">
          ${acc.starred ? 'Відфармлений' : 'Не відфармлений'}
        </button>

        <span class="toggle-arrow">▼</span>
      </div>
    </div>

    <div class="account-details" id="details-${originalIndex}" style="display: ${isOpen ? 'block' : 'none'};">
      <div class="account-body">
        ${acc.prime
          ? `<div class="prime-section">
               <span title="Prime Status">🔒 Prime</span>
               <button class="btn-prime-remove" onclick="event.stopPropagation(); togglePrime(${originalIndex})">❌ Видалити Prime</button>
             </div>`
          : `<div class="prime-section">
               <span title="До Prime">
                 До Prime: через ${daysUntil(acc.unlockDate)} днів
               </span>
               <input type="date" value="${acc.unlockDate || ''}" onchange="updateField(${originalIndex}, 'unlockDate', this.value)" />
               <button class="btn-prime-add" onclick="event.stopPropagation(); togglePrime(${originalIndex})">✅ Встановити Prime</button>
             </div>`}

        <input type="file" onchange="selectMaFile(event, ${originalIndex})" />
        <input type="text" placeholder="Шлях до maFile" value="${acc.maFilePath || ''}" onchange="updateField(${originalIndex}, 'maFilePath', this.value)" />

        <div class="trade-url-field">
          <input type="text" placeholder="Трейд-лінка (Trade URL)" value="${acc.tradeUrl || ''}" onchange="updateField(${originalIndex}, 'tradeUrl', this.value)" />
          <button onclick="event.stopPropagation(); copyToClipboard('${acc.tradeUrl || ''}', '🔗 Трейд-лінка скопійована')" title="Копіювати трейд-лінку">🔗</button>
        </div>

        <input type="text" placeholder="Ім'я" value="${acc.name || ''}" onchange="updateField(${originalIndex}, 'name', this.value)" />
        <input type="text" placeholder="Login" value="${acc.login}" onchange="updateField(${originalIndex}, 'login', this.value)" />

        <div class="password-field">
          <input type="password" id="${passwordId}" placeholder="Password" value="${acc.password}" onchange="updateField(${originalIndex}, 'password', this.value)" />
          <button onclick="togglePasswordVisibility('${passwordId}')">👁️</button>
        </div>

        <div class="finance">
          <label>💰 Загальний дохід:</label>
          <input type="number" value="${acc.income || 0}" onchange="updateField(${originalIndex}, 'income', this.value)" /> грн

          <label>➕ Дохід за тиждень:</label>
          <input type="number" value="${acc.weeklyIncome || 0}" onchange="updateField(${originalIndex}, 'weeklyIncome', this.value)" /> грн
          <button class="btn-weekly-add" onclick="addWeeklyIncome(${originalIndex})">➕ Додати</button>

          <label>💸 Загальні витрати:</label>
          <input type="number" value="${acc.expenses || 0}" onchange="updateField(${originalIndex}, 'expenses', this.value)" /> грн

          <b>📈 Чистий прибуток: ${netProfit} грн</b>
        </div>

        <div class="last-drop">
          <label>🎁 Останні дропи:</label>
          <div class="drop-controls">
            <button id="fetch-drop-${originalIndex}" onclick="fetchLastDrop(${originalIndex})" class="btn-fetch-drop">🎁 Отримати дропи зі Steam</button>
          </div>
          
          ${(acc.lastDrops && acc.lastDrops.length > 0) ? `
            <div class="drops-history">
              ${acc.lastDrops.map((drop, dropIndex) => `
                <div class="drop-history-item">
                  <div class="drop-number">#${dropIndex + 1}</div>
                  <img src="${drop.imageUrl}" alt="${drop.name}" class="last-drop-image" onerror="this.onerror=null; this.outerHTML='<div class=&quot;drop-fallback-svg&quot;><svg width=&quot;64&quot; height=&quot;64&quot; viewBox=&quot;0 0 64 64&quot; fill=&quot;none&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;><rect width=&quot;64&quot; height=&quot;64&quot; rx=&quot;10&quot; fill=&quot;#1f2937&quot; stroke=&quot;#059669&quot; stroke-width=&quot;2&quot; stroke-dasharray=&quot;8,4&quot;/><circle cx=&quot;32&quot; cy=&quot;32&quot; r=&quot;16&quot; stroke=&quot;#10b981&quot; stroke-width=&quot;2&quot; fill=&quot;none&quot; opacity=&quot;0.6&quot;/><path d=&quot;M32 20v24m-12-12h24&quot; stroke=&quot;#059669&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot;/><circle cx=&quot;32&quot; cy=&quot;32&quot; r=&quot;3&quot; fill=&quot;#10b981&quot;/></svg></div>'">
                  <div class="last-drop-details">
                    <span class="last-drop-name">${drop.name}</span>
                    <span class="last-drop-price">Ціна: ${drop.priceUAH} грн (${drop.originalPrice})</span>
                    <span class="last-drop-date">Дата: ${new Date(drop.date).toLocaleDateString()}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : acc.lastDrop ? `
            <div class="legacy-drop-info">
              <input type="text" placeholder="Назва предмету" value="${acc.lastDrop || ''}" onchange="updateField(${originalIndex}, 'lastDrop', this.value)" />
              <input type="text" placeholder="URL зображення" value="${acc.lastDropImageUrl || ''}" onchange="updateField(${originalIndex}, 'lastDropImageUrl', this.value)" />
              <input type="number" placeholder="Ціна" value="${acc.lastDropPrice || 0}" onchange="updateField(${originalIndex}, 'lastDropPrice', this.value)" /> грн
              
              <div class="last-drop-info">
                <img src="${acc.lastDropImageUrl}" alt="${acc.lastDrop}" class="last-drop-image" onerror="this.onerror=null; this.outerHTML='<div class=&quot;drop-fallback-svg&quot;><svg width=&quot;64&quot; height=&quot;64&quot; viewBox=&quot;0 0 64 64&quot; fill=&quot;none&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;><rect width=&quot;64&quot; height=&quot;64&quot; rx=&quot;10&quot; fill=&quot;#1f2937&quot; stroke=&quot;#059669&quot; stroke-width=&quot;2&quot; stroke-dasharray=&quot;8,4&quot;/><circle cx=&quot;32&quot; cy=&quot;32&quot; r=&quot;16&quot; stroke=&quot;#10b981&quot; stroke-width=&quot;2&quot; fill=&quot;none&quot; opacity=&quot;0.6&quot;/><path d=&quot;M32 20v24m-12-12h24&quot; stroke=&quot;#059669&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot;/><circle cx=&quot;32&quot; cy=&quot;32&quot; r=&quot;3&quot; fill=&quot;#10b981&quot;/></svg></div>'">
                <div class="last-drop-details">
                  <span class="last-drop-name">${acc.lastDrop}</span>
                  <span class="last-drop-price">Ціна: ${acc.lastDropPrice} грн</span>
                </div>
              </div>
            </div>
          ` : '<div class="no-drop">Немає інформації про дропи</div>'}
        </div>

        <div class="full-inventory">
          <label>📦 Повний інвентар:</label>
          <div class="inventory-controls">
            <button id="fetch-inventory-${originalIndex}" onclick="fetchFullInventory(${originalIndex})" class="btn-fetch-inventory">📦 Завантажити повний інвентар</button>
            ${acc.fullInventory && acc.fullInventory.length > 0 ? `
              <div class="inventory-summary">
                <span class="inventory-count">Предметів: ${acc.inventoryCount || acc.fullInventory.length}</span>
                <span class="inventory-value">Вартість: ${acc.inventoryValue || '0.00'} грн</span>
              </div>
            ` : ''}
          </div>
          
          ${acc.fullInventory && acc.fullInventory.length > 0 ? `
            <div class="inventory-grid">
              ${acc.fullInventory.slice(0, 12).map((item, itemIndex) => `
                <div class="inventory-item" title="${escapeHtml(item.name)}">
                  ${item.imageUrl ? 
                    `<img src="${item.imageUrl}" alt="${escapeHtml(item.name)}" class="inventory-item-image" onerror="this.style.display='none'">` : 
                    '<div class="inventory-item-placeholder">📦</div>'
                  }
                  <div class="inventory-item-info">
                    <div class="inventory-item-name">${escapeHtml(item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name)}</div>
                    <div class="inventory-item-price">${item.priceUAH !== '0.00' ? item.priceUAH + ' грн' : 'Без ціни'}</div>
                  </div>
                </div>
              `).join('')}
              ${acc.fullInventory.length > 12 ? `
                <div class="inventory-item more-items">
                  <div class="more-items-content">
                    <div class="more-items-count">+${acc.fullInventory.length - 12}</div>
                    <div class="more-items-text">ще предметів</div>
                  </div>
                </div>
              ` : ''}
            </div>
          ` : '<div class="no-inventory">Інвентар не завантажено</div>'}
        </div>

        <button class="delete-btn" onclick="deleteAccount(${originalIndex})">🗑️ Видалити</button>
      </div>
    </div>
  </div>
`;

    container.appendChild(div);
  });

  // Оновлення загального прибутку
  const totalProfit = accounts.reduce((sum, acc) => {
    const inc = parseFloat(acc.income) || 0;
    const exp = parseFloat(acc.expenses) || 0;
    return sum + (inc - exp);
  }, 0);

  const totalProfitEl = document.getElementById('total-profit');
  if (totalProfitEl) {
    totalProfitEl.innerText = `Загальний прибуток: ${totalProfit.toFixed(2)} грн`;

    if (totalProfit > 0) {
      totalProfitEl.style.color = '#4caf50'; // зелений
    } else if (totalProfit < 0) {
      totalProfitEl.style.color = '#f44336'; // червоний
    } else {
      totalProfitEl.style.color = '#00ffc3'; // нейтральний
    }
  }
}

function saveAccounts() {
  if (!accountsFilePath) {
    console.error('Шлях до файлу акаунтів ще не ініціалізований');
    return;
  }
  
  try {
    const dataToSave = { accounts };
    fs.writeFileSync(accountsFilePath, JSON.stringify(dataToSave, null, 2));
    console.log('[saveAccounts] Акаунти збережено успішно:', accounts.length, 'акаунтів');
    console.log('[saveAccounts] Шлях збереження:', accountsFilePath);
    
    // Додаткове логування для дропів
    accounts.forEach((acc, i) => {
      if (acc.lastDrop) {
        console.log(`[saveAccounts] Акаунт ${i} (${acc.login}): lastDrop="${acc.lastDrop}", price="${acc.lastDropPrice}"`);
      }
    });
    
    // Оновлюємо портфоліо якщо вкладка активна
    const portfolioTab = document.getElementById('portfolio-tab');
    if (portfolioTab && portfolioTab.style.display === 'block') {
      setTimeout(calculateAndDisplayPortfolio, 100);
    }
  } catch (error) {
    console.error('[saveAccounts] Помилка при збереженні акаунтів:', error);
  }
}

function toggleDetails(index) {
  accounts[index].open = !accounts[index].open;
  saveAccounts();
  // Оновлюємо відфільтровані акаунти після зміни
  if (searchQuery && searchQuery !== '') {
    searchAccounts(searchQuery);
  } else {
    filteredAccounts = [...accounts];
    render();
  }
}

function toggleFarming(index) {
  accounts[index].farming = !accounts[index].farming;
  saveAccounts();
  // Оновлюємо відфільтровані акаунти після зміни
  if (searchQuery && searchQuery !== '') {
    searchAccounts(searchQuery);
  } else {
    filteredAccounts = [...accounts];
    render();
  }
}

// Функція для перемикання табів
function showTab(tabId, buttonElement) {
  // Ховаємо всі таби
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.style.display = 'none';
  });

  // Видаляємо active клас з усіх кнопок
  const buttons = document.querySelectorAll('.tab-button');
  buttons.forEach(btn => {
    btn.classList.remove('active');
  });

  // Показуємо обраний таб
  const selectedTab = document.getElementById(tabId);
  if (selectedTab) {
    selectedTab.style.display = 'block';
    buttonElement.classList.add('active');
  }

  // Якщо це таб історії, рендеримо історію
  if (tabId === 'history-tab') {
    renderHistory();
  }
  
  // Якщо це таб портфоліо, показуємо портфоліо
  if (tabId === 'portfolio-tab') {
    setTimeout(showPortfolio, 100); // Невелика затримка для завершення анімації табу
  }
}

// Функція для показу сповіщень
function showNotification(message, type = 'info') {
  // Створюємо контейнер для сповіщень, якщо його немає
  let notificationContainer = document.querySelector('.notification-container');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.className = 'notification-container';
    document.body.appendChild(notificationContainer);
  }

  // Створюємо сповіщення
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <span class="notification-message">${message}</span>
    <button class="notification-close" onclick="this.parentElement.remove()">×</button>
  `;

  // Додаємо сповіщення
  notificationContainer.appendChild(notification);

  // Анімація появи
  setTimeout(() => notification.classList.add('show'), 100);

  // Автоматично видаляємо через 5 секунд
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Функція для рендеру історії
function renderHistory() {
  const historyList = document.getElementById('history-list');
  if (!historyList) return;

  historyList.innerHTML = '';

  // Збираємо всю історію з усіх акаунтів
  const allHistory = [];
  accounts.forEach((acc, accIndex) => {
    if (acc.history && acc.history.length > 0) {
      acc.history.forEach(entry => {
        // Міграція старих дат до ISO формату
        let entryDate = entry.date;
        if (!entryDate.includes('T') && !entryDate.includes('-')) {
          // Конвертуємо старий формат дати
          const parts = entryDate.split('.');
          if (parts.length === 3) {
            entryDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T12:00:00`;
          }
        }
        
        allHistory.push({
          ...entry,
          date: entryDate,
          accountName: acc.name || acc.login || `Акаунт #${accIndex + 1}`,
          accountIndex: accIndex
        });
      });
    }
  });

  // Сортуємо за датою (найновіші спочатку)
  allHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (allHistory.length === 0) {
    historyList.innerHTML = '<div class="no-history">📊 Історія доходів порожня</div>';
    return;
  }

  // Групуємо по датах
  const groupedHistory = {};
  allHistory.forEach(entry => {
    const date = new Date(entry.date);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const displayDate = date.toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (!groupedHistory[dateKey]) {
      groupedHistory[dateKey] = {
        displayDate,
        entries: []
      };
    }
    groupedHistory[dateKey].entries.push(entry);
  });

  // Рендеримо групи по датах
  Object.keys(groupedHistory)
    .sort((a, b) => new Date(b) - new Date(a)) // Сортуємо дати (найновіші спочатку)
    .forEach(dateKey => {
      const group = groupedHistory[dateKey];
      
      // Додаємо заголовок дати
      const dateHeader = document.createElement('div');
      dateHeader.className = 'history-date-header';
      dateHeader.innerHTML = `
        <span class="date-icon">📅</span>
        <span class="date-text">${group.displayDate}</span>
        <span class="date-count">(${group.entries.length})</span>
      `;
      historyList.appendChild(dateHeader);

      // Додаємо групу записів
      const dateGroup = document.createElement('div');
      dateGroup.className = 'history-date-group';
      
      // Сортуємо записи в групі за часом (найновіші спочатку)
      group.entries
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach((entry, index) => {
          const listItem = document.createElement('div');
          listItem.className = 'history-entry';
          
          const amount = parseFloat(entry.amount) || 0;
          const amountClass = amount > 0 ? 'income-entry' : amount < 0 ? 'expense-entry' : 'neutral-entry';
          
          // Перевіряємо, чи це новий запис (додано менше ніж 5 хвилин тому)
          const entryTime = new Date(entry.date);
          const now = new Date();
          const isNew = (now - entryTime) < 5 * 60 * 1000; // 5 хвилин
          
          const time = entryTime.toLocaleTimeString('uk-UA', {
            hour: '2-digit',
            minute: '2-digit'
          });
          
          listItem.innerHTML = `
            <div class="history-item ${amountClass}">
              <div class="history-header">
                <span class="history-icon">${amount > 0 ? '💰' : amount < 0 ? '💸' : '💱'}</span>
                <span class="history-account">${entry.accountName}</span>
              </div>
              <div class="history-income ${amountClass}">
                ${amount > 0 ? '+' : ''}${amount.toFixed(2)} грн
              </div>
            </div>
          `;
          
          // Додаємо анімацію для нових записів
          if (isNew) {
            listItem.classList.add('new-entry');
          }
          
          // Анімація появи з затримкою
          listItem.style.animationDelay = `${index * 0.1}s`;
          
          dateGroup.appendChild(listItem);
        });
      
      historyList.appendChild(dateGroup);
    });
}

// Функція для ресету (якщо потрібна)
function ResetFarm() {
  if (confirm('Скинути стан фарму та останні дропи? Ця дія незворотна!')) {
    accounts.forEach(acc => {
      // Скидаємо стан фармингу
      acc.farming = false;
      acc.open = false;
      
      // Скидаємо стан "відфармлений"
      acc.starred = false;
      
      // Скидаємо дані про останній дроп
      acc.lastDrop = '';
      acc.lastDropPrice = 0;
      acc.lastDropImageUrl = '';
      acc.lastDrops = [];
    });
    saveAccounts();
    
    // Оновлюємо відфільтровані акаунти після зміни
    if (searchQuery && searchQuery !== '') {
      searchAccounts(searchQuery);
    } else {
      filteredAccounts = [...accounts];
      render();
    }
  }
}

// Функція для перенумерації ID акаунтів
function renumberAccountIds() {
  accounts.forEach((acc, index) => {
    acc.id = index + 1;
  });
  saveAccounts();
}

window.onload = async () => {
  await initUpdater(); // Спочатку ініціалізуємо updater та шляхи
  loadAccounts(); // Потім завантажуємо акаунти
};

// Функція для зміни пароля
async function changePassword() {
  showPasswordChangeModal();
}

// Функція для показу модального вікна зміни пароля
function showPasswordChangeModal() {
  // Створюємо модальне вікно
  const modal = document.createElement('div');
  modal.className = 'password-modal';
  modal.innerHTML = `
    <div class="password-modal-content">
      <div class="password-modal-header">
        <h3>Зміна пароля</h3>
        <button class="password-modal-close" onclick="closePasswordModal()">&times;</button>
      </div>
      <div class="password-modal-body">
        <div class="password-field">
          <label for="current-password">Поточний пароль:</label>
          <input type="password" id="current-password" placeholder="Введіть поточний пароль">
        </div>
        <div class="password-field">
          <label for="new-password">Новий пароль:</label>
          <input type="password" id="new-password" placeholder="Введіть новий пароль">
        </div>
        <div class="password-field">
          <label for="confirm-password">Підтвердження:</label>
          <input type="password" id="confirm-password" placeholder="Підтвердіть новий пароль">
        </div>
        <div class="password-error" id="password-error"></div>
      </div>
      <div class="password-modal-footer">
        <button class="password-btn password-btn-cancel" onclick="closePasswordModal()">Скасувати</button>
        <button class="password-btn password-btn-save" onclick="saveNewPassword()">Зберегти</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Фокус на першому полі
  setTimeout(() => {
    document.getElementById('current-password').focus();
  }, 100);
  
  // Додаємо обробку Enter для полів вводу
  const inputs = modal.querySelectorAll('input[type="password"]');
  inputs.forEach((input, index) => {
    input.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (index < inputs.length - 1) {
          // Переходимо до наступного поля
          inputs[index + 1].focus();
        } else {
          // На останньому полі - зберігаємо
          saveNewPassword();
        }
      }
    });
  });
  
  // Закриття по кліку поза модальним вікном
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closePasswordModal();
    }
  });
}

// Функція для закриття модального вікна
window.closePasswordModal = function() {
  const modal = document.querySelector('.password-modal');
  if (modal) {
    modal.remove();
  }
}

// Функція для збереження нового пароля
window.saveNewPassword = async function() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const errorDiv = document.getElementById('password-error');
  
  // Очищаємо попередні помилки
  errorDiv.textContent = '';
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    errorDiv.textContent = 'Будь ласка, заповніть всі поля!';
    return;
  }
  
  if (newPassword !== confirmPassword) {
    errorDiv.textContent = 'Паролі не співпадають!';
    return;
  }
  
  if (newPassword.length < 3) {
    errorDiv.textContent = 'Пароль повинен містити принаймні 3 символи!';
    return;
  }
  
  try {
    // Читаємо поточний auth.json через IPC
    const authData = await ipcRenderer.invoke('read-auth-file');
    
    if (currentPassword !== authData.password) {
      errorDiv.textContent = 'Неправильний поточний пароль!';
      return;
    }
    
    // Оновлюємо пароль через IPC
    authData.password = newPassword;
    await ipcRenderer.invoke('write-auth-file', authData);
    
    closePasswordModal();
    
    // Показуємо повідомлення про успіх
    showNotification('Пароль успішно змінено! Перезапустіть додаток для застосування змін.', 'success');
    
  } catch (error) {
    console.error('Помилка зміни пароля:', error);
    errorDiv.textContent = 'Помилка зміни пароля: ' + error.message;
  }
}

// Функції для імпорту/експорту
async function importAccounts() {
  try {
    showNotification('Виберіть файл з акаунтами для імпорту...', 'info');
    const result = await ipcRenderer.invoke('import-accounts');
    
    if (result.success) {
      showNotification(result.message, 'success');
      // Перезавантажуємо список акаунтів
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      showNotification(result.message, 'error');
    }
  } catch (error) {
    console.error('Помилка імпорту акаунтів:', error);
    showNotification('Помилка імпорту акаунтів: ' + error.message, 'error');
  }
}

async function importTradeHistory() {
  try {
    showNotification('Виберіть файл з історією торгівлі для імпорту...', 'info');
    const result = await ipcRenderer.invoke('import-trade-history');
    
    if (result.success) {
      showNotification(result.message, 'success');
    } else {
      showNotification(result.message, 'error');
    }
  } catch (error) {
    console.error('Помилка імпорту історії:', error);
    showNotification('Помилка імпорту історії: ' + error.message, 'error');
  }
}

async function importMaFiles() {
  try {
    showNotification('Виберіть папку з .maFile файлами для імпорту...', 'info');
    const result = await ipcRenderer.invoke('import-mafiles-folder');
    
    if (result.success) {
      showNotification(result.message, 'success');
      
      // Автоматично перейменовуємо файли після імпорту
      setTimeout(async () => {
        await renameMaFilesToAccountNames();
        // Перезавантажуємо список акаунтів
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }, 1000);
    } else {
      showNotification(result.message, 'error');
    }
  } catch (error) {
    console.error('Помилка імпорту maFiles:', error);
    showNotification('Помилка імпорту maFiles: ' + error.message, 'error');
  }
}

// Функція для імпорту папки з .maFile файлами
async function importMaFilesFolder() {
  try {
    showNotification('Виберіть папку з .maFile файлами для імпорту...', 'info');
    const result = await ipcRenderer.invoke('import-mafiles-folder');
    
    if (result.success) {
      showNotification(result.message, 'success');
      
      // Автоматично перейменовуємо файли після імпорту
      setTimeout(async () => {
        await renameMaFilesToAccountNames();
        // Перезавантажуємо список акаунтів
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }, 1000);
    } else {
      showNotification(result.message, 'error');
    }
  } catch (error) {
    console.error('Помилка імпорту папки maFiles:', error);
    showNotification('Помилка імпорту папки maFiles: ' + error.message, 'error');
  }
}

// Функція для імпорту окремих .maFile файлів
async function importMaFilesIndividual() {
  try {
    showNotification('Виберіть .maFile файли для імпорту...', 'info');
    const result = await ipcRenderer.invoke('import-mafiles-individual');
    
    if (result.success) {
      showNotification(result.message, 'success');
      
      // Автоматично перейменовуємо файли після імпорту
      setTimeout(async () => {
        await renameMaFilesToAccountNames();
        // Перезавантажуємо список акаунтів
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }, 1000);
    } else {
      showNotification(result.message, 'error');
    }
  } catch (error) {
    console.error('Помилка імпорту окремих maFiles:', error);
    showNotification('Помилка імпорту окремих maFiles: ' + error.message, 'error');
  }
}

async function exportAccounts() {
  try {
    showNotification('Виберіть місце для збереження файлу...', 'info');
    const result = await ipcRenderer.invoke('export-accounts');
    
    if (result.success) {
      showNotification(result.message, 'success');
    } else {
      showNotification(result.message, 'error');
    }
  } catch (error) {
    console.error('Помилка експорту акаунтів:', error);
    showNotification('Помилка експорту акаунтів: ' + error.message, 'error');
  }
}

// Функція для показу модального вікна імпорту/експорту
function showImportExportModal() {
  const modal = document.createElement('div');
  modal.className = 'import-export-modal';
  modal.innerHTML = `
    <div class="import-export-modal-content">
      <div class="import-export-modal-header">
        <h3>Імпорт / Експорт даних</h3>
        <button class="modal-close" onclick="closeImportExportModal()">&times;</button>
      </div>
      <div class="import-export-modal-body">
        <div class="import-export-section">
          <h4>📥 Імпорт</h4>
          <div class="import-export-buttons">
            <button class="import-export-btn import-btn" onclick="importAccounts()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Імпорт акаунтів
            </button>
            <button class="import-export-btn import-btn" onclick="importTradeHistory()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3h18v18H3zM12 8v8m-4-4h8"/>
              </svg>
              Імпорт історії торгівлі
            </button>
            <button class="import-export-btn import-btn" onclick="importMaFiles()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
              Імпорт .maFile папки
            </button>
          </div>
        </div>
        
        <div class="import-export-section">
          <h4>📤 Експорт</h4>
          <div class="import-export-buttons">
            <button class="import-export-btn export-btn" onclick="exportAccounts()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Експорт акаунтів
            </button>
          </div>
        </div>
        
        <div class="import-export-info">
          <h4>ℹ️ Інформація</h4>
          <ul>
            <li><strong>Імпорт акаунтів:</strong> Додає нові акаунти до існуючих (дублікати пропускаються)</li>
            <li><strong>Імпорт історії:</strong> Замінює поточну історію торгівлі</li>
            <li><strong>Імпорт .maFile:</strong> Копіює .maFile файли до папки програми</li>
            <li><strong>Експорт акаунтів:</strong> Зберігає всі акаунти у JSON файл</li>
          </ul>
        </div>
      </div>
      <div class="import-export-modal-footer">
        <button class="import-export-btn cancel-btn" onclick="closeImportExportModal()">Закрити</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Закриття по кліку поза модальним вікном
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeImportExportModal();
    }
  });
}

// Функція для закриття модального вікна імпорту/експорту
window.closeImportExportModal = function() {
  const modal = document.querySelector('.import-export-modal');
  if (modal) {
    modal.remove();
  }
}

// Функція для примусового закриття всіх модальних вікон та екранів завантаження
function forceCloseAllModals() {
  const modals = document.querySelectorAll('.password-modal, .import-export-modal, .drop-info-modal, .loading-backdrop');
  modals.forEach(modal => {
    modal.remove();
  });
  showNotification('Всі модальні вікна та екрани завантаження закрито.', 'info');
}

// Робимо функцію глобальною
window.forceCloseAllModals = forceCloseAllModals;

// Тестові функції для DevTools
window.testRenameFiles = async function() {
  console.log('=== ТЕСТ: Запуск перейменування файлів ===');
  console.log('Кількість акаунтів:', accounts.length);
  console.log('Шлях до maFiles:', maFilesPath);
  
  if (accounts.length > 0) {
    console.log('Перші 3 акаунти:');
    accounts.slice(0, 3).forEach((acc, i) => {
      console.log(`${i+1}. Login: "${acc.login}", maFilePath: "${acc.maFilePath}"`);
    });
  }
  
  await renameMaFilesToAccountNames();
};

window.debugAccounts = function() {
  console.log('=== ДЕБАГ: Інформація про акаунти ===');
  console.log('Всього акаунтів:', accounts.length);
  
  accounts.forEach((acc, i) => {
    console.log(`Акаунт ${i+1}:`);
    console.log(`  Login: "${acc.login}"`);
    console.log(`  maFilePath: "${acc.maFilePath}"`);
    console.log(`  Файл існує: ${acc.maFilePath ? require('fs').existsSync(acc.maFilePath) : 'немає шляху'}`);
  });
  
  console.log('Шлях до папки maFiles:', maFilesPath);
  
  if (maFilesPath && require('fs').existsSync(maFilesPath)) {
    try {
      const files = require('fs').readdirSync(maFilesPath);
      console.log('Файли в папці maFiles:', files);
    } catch (e) {
      console.error('Помилка читання папки:', e);
    }
  } else {
    console.log('Папка maFiles не існує або шлях не визначений');
  }
};

// Функція для автоматичного зіставлення всіх maFiles
async function autoLinkAllMaFiles() {
  try {
    showNotification('Автоматично з\'язую .maFile файли з акаунтами...', 'info');
    const result = await ipcRenderer.invoke('auto-link-mafiles');
    
    if (result.success) {
      showNotification(result.message, 'success');
      // Перезавантажуємо дані через деякий час
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } else {
      showNotification(result.message, 'error');
    }
  } catch (error) {
    console.error('Помилка автоматичного зв\'язування всіх maFiles:', error);
    showNotification('Помилка автоматичного зв\'язування: ' + error.message, 'error');
  }
}

// Робимо функції глобальними
window.importAccounts = importAccounts;
window.importTradeHistory = importTradeHistory;
window.importMaFiles = importMaFiles;
window.importMaFilesFolder = importMaFilesFolder;
window.importMaFilesIndividual = importMaFilesIndividual;
window.exportAccounts = exportAccounts;
window.showImportExportModal = showImportExportModal;
window.autoLinkAllMaFiles = autoLinkAllMaFiles;
window.renameMaFilesToAccountNames = renameMaFilesToAccountNames;

function applyStarFilter(list) {
  if (starFilter === 'starred') return list.filter(acc => acc.starred);
  if (starFilter === 'unstarred') return list.filter(acc => !acc.starred);
  return list;
}

function setStarFilter(filter) {
  starFilter = filter;
  ['filter-all','filter-starred','filter-unstarred'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove('active');
  });
  const activeBtn = document.getElementById(`filter-${filter}`);
  if (activeBtn) activeBtn.classList.add('active');

  if (searchQuery) {
    searchAccounts(searchQuery);
  } else {
    filteredAccounts = applyStarFilter([...accounts]);
    render();
    updateSearchResultCount();
  }
}

window.setStarFilter = setStarFilter;

// Функція для перейменування .maFile файлів на основі логіну акаунта
async function renameMaFilesToAccountNames() {
  try {
    console.log('[renameMaFiles] Початок виконання функції');
    showNotification('Перейменовуємо .maFile файли...', 'info');
    
    if (!maFilesPath) {
      console.error('[renameMaFiles] maFilesPath не визначений');
      showNotification('Шлях до папки maFiles не ініціалізований', 'error');
      return;
    }

    console.log('[renameMaFiles] Шлях до maFiles:', maFilesPath);
    console.log('[renameMaFiles] Кількість облікових записів:', accounts.length);

    // Перевіряємо, чи існує папка
    if (!fs.existsSync(maFilesPath)) {
      console.error('[renameMaFiles] Папка не існує:', maFilesPath);
      showNotification(`Папка maFiles не існує: ${maFilesPath}`, 'error');
      return;
    }

    if (accounts.length === 0) {
      console.log('[renameMaFiles] Немає облікових записів для обробки');
      showNotification('Немає облікових записів для перейменування файлів', 'warning');
      return;
    }
    
    let renamedCount = 0;
    let skippedCount = 0;
    let errors = [];

    // Проходимо по кожному обліковому запису
    for (const account of accounts) {
      console.log(`\n[renameMaFiles] === Обробляємо обліковий запис: ${account.login} ===`);
      
      try {
        if (!account.maFilePath) {
          console.log(`[renameMaFiles] У акаунту ${account.login} відсутній maFilePath`);
          continue;
        }

        console.log(`[renameMaFiles] Поточний maFilePath: ${account.maFilePath}`);
        
        // Перевіряємо, чи існує файл
        if (!fs.existsSync(account.maFilePath)) {
          console.error(`[renameMaFiles] Файл не існує: ${account.maFilePath}`);
          errors.push(`Файл не існує для акаунту ${account.login}: ${account.maFilePath}`);
          continue;
        }

        // Отримуємо поточну назву файлу
        const currentFileName = path.basename(account.maFilePath);
        console.log(`[renameMaFiles] Поточна назва файлу: ${currentFileName}`);
        
        // Створюємо нову назву файлу на основі логіну акаунту
        const newFileName = `${account.login}.maFile`;
        console.log(`[renameMaFiles] Нова назва файлу: ${newFileName}`);
        
        // Перевіряємо, чи потрібно перейменувати
        if (currentFileName === newFileName) {
          console.log(`[renameMaFiles] Файл для акаунту ${account.login} вже має правильну назву`);
          skippedCount++;
          continue;
        }
        
        const newFilePath = path.join(maFilesPath, newFileName);
        console.log(`[renameMaFiles] Новий повний шлях: ${newFilePath}`);
        
        // Перевіряємо, чи не існує файл з такою назвою
        if (fs.existsSync(newFilePath) && newFilePath !== account.maFilePath) {
          console.error(`[renameMaFiles] Файл з назвою ${newFileName} вже існує`);
          errors.push(`Файл з назвою ${newFileName} вже існує`);
          continue;
        }
        
        // Виконуємо перейменування
        try {
          console.log(`[renameMaFiles] Перейменовуємо файл з ${account.maFilePath} на ${newFilePath}`);
          fs.renameSync(account.maFilePath, newFilePath);
          console.log(`[renameMaFiles] ✅ УСПІШНО перейменовано: ${currentFileName} -> ${newFileName}`);
          
          // Оновлюємо шлях в акаунті
          account.maFilePath = newFilePath;
          console.log(`[renameMaFiles] Оновлено maFilePath для акаунту ${account.login}`);
          
          renamedCount++;
          
        } catch (renameError) {
          console.error(`[renameMaFiles] Помилка перейменування файлу для акаунту ${account.login}:`, renameError);
          errors.push(`Помилка перейменування файлу для ${account.login}: ${renameError.message}`);
        }
        
      } catch (error) {
        console.error(`[renameMaFiles] Загальна помилка обробки акаунту ${account.login}:`, error);
        errors.push(`Помилка обробки акаунту ${account.login}: ${error.message}`);
      }
    }

    // Зберігаємо зміни
    if (renamedCount > 0) {
      console.log(`[renameMaFiles] Зберігаємо дані після ${renamedCount} перейменувань`);
      try {
        saveAccounts();
        console.log(`[renameMaFiles] Дані збережено успішно`);
      } catch (saveError) {
        console.error(`[renameMaFiles] Помилка збереження:`, saveError);
        errors.push(`Помилка збереження даних: ${saveError.message}`);
      }
    }

    // Показуємо результат
    console.log(`\n[renameMaFiles] === ПІДСУМОК ===`);
    console.log(`[renameMaFiles] Перейменовано: ${renamedCount}`);
    console.log(`[renameMaFiles] Пропущено (вже правильні назви): ${skippedCount}`);
    console.log(`[renameMaFiles] Помилок: ${errors.length}`);
    
    let message = `Перейменування завершено!<br>• Перейменовано: ${renamedCount} файлів<br>• Пропущено: ${skippedCount} файлів`;
    
    if (errors.length > 0) {
      message += `<br>• Помилки (${errors.length}):<br>${errors.slice(0, 3).join('<br>')}`;
      if (errors.length > 3) {
        message += `<br>... та ще ${errors.length - 3} помилок`;
      }
      console.log(`[renameMaFiles] Помилки:`, errors);
    }
    
    const notificationType = errors.length > 0 ? 'warning' : (renamedCount > 0 ? 'success' : 'info');
    showNotification(message, notificationType);
    
  } catch (error) {
    console.error('[renameMaFiles] Критична помилка:', error);
    showNotification('Критична помилка перейменування: ' + error.message, 'error');
  }
}

// Функція для ручного перейменування файлів (кнопка в інтерфейсі)
async function manualRenameFiles() {
  console.log('[manualRenameFiles] Ручний запуск перейменування...');
  showNotification('🔄 Запускається перейменування .maFile файлів...', 'info');
  
  try {
    await renameMaFilesToAccountNames();
    
    // Оновлюємо відображення після перейменування
    setTimeout(() => {
      if (searchQuery && searchQuery !== '') {
        searchAccounts(searchQuery);
      } else {
        filteredAccounts = [...accounts];
        render();
      }
    }, 1000);
    
  } catch (error) {
    console.error('[manualRenameFiles] Помилка:', error);
    showNotification('❌ Помилка перейменування: ' + error.message, 'error');
  }
}

// ===============================
// ФУНКЦІОНАЛ ПОРТФОЛІО
// ===============================

let portfolioChart = null;
let valueChart = null;

// Функція для показу портфоліо
function showPortfolio() {
  console.log('[Portfolio] Показ портфоліо...');
  calculateAndDisplayPortfolio();
  
  // Перевіряємо чи потрібно автоматично завантажувати інвентарі
  if (shouldAutoLoadInventories()) {
    setTimeout(() => {
      const shouldLoad = confirm('🎮 Портфоліо: Виявлено мало завантажених інвентарів.\n\n📦 Завантажити інвентарі CS:GO та TF2 для всіх акаунтів автоматично?\n\n⏱️ Це може зайняти кілька хвилин...');
      
      if (shouldLoad) {
        autoLoadAllInventories();
      }
    }, 1000);
  }
}

// Функція для оновлення портфоліо
function refreshPortfolio() {
  console.log('[Portfolio] Оновлення портфоліо...');
  showNotification('🔄 Оновлення портфоліо...', 'info');
  calculateAndDisplayPortfolio();
}

// Функція автоматичного завантаження інвентаря для всіх акаунтів
async function autoLoadAllInventories() {
  console.log('[Portfolio] Початок автоматичного завантаження інвентарів...');
  
  showNotification('🔄 Завантаження інвентарів для всіх акаунтів...', 'info');
  
  const accountsWithCredentials = accounts.filter(acc => 
    acc.login && acc.password && acc.login.trim() !== '' && acc.password.trim() !== ''
  );
  
  if (accountsWithCredentials.length === 0) {
    showNotification('❌ Немає акаунтів з налаштованими даними для входу', 'warning');
    return;
  }
  
  console.log(`[Portfolio] Знайдено ${accountsWithCredentials.length} акаунтів для завантаження`);
  
  let successCount = 0;
  let errorCount = 0;
  
  // Завантажуємо по черзі щоб не перевантажувати Steam API
  for (let i = 0; i < accountsWithCredentials.length; i++) {
    const account = accountsWithCredentials[i];
    const originalIndex = accounts.indexOf(account);
    
    try {
      console.log(`[Portfolio] Завантаження інвентаря ${i + 1}/${accountsWithCredentials.length}: ${account.login}`);
      
      showNotification(`🔄 Завантаження інвентаря ${account.login || account.name} (${i + 1}/${accountsWithCredentials.length})`, 'info');
      
      // Викликаємо існуючу функцію завантаження інвентаря
      await fetchFullInventory(originalIndex);
      
      successCount++;
      console.log(`[Portfolio] ✅ Успішно завантажено інвентар для ${account.login}`);
      
      // Пауза між завантаженнями щоб не перевантажувати API
      if (i < accountsWithCredentials.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 секунди між акаунтами
      }
      
    } catch (error) {
      errorCount++;
      console.error(`[Portfolio] ❌ Помилка завантаження для ${account.login}:`, error);
    }
  }
  
  console.log(`[Portfolio] Завершено автозавантаження. Успішно: ${successCount}, Помилок: ${errorCount}`);
  
  // Зберігаємо час завершення завантаження
  localStorage.setItem('lastAutoInventoryLoad', Date.now().toString());
  
  if (successCount > 0) {
    showNotification(`✅ Завантажено інвентарі для ${successCount} акаунтів!${errorCount > 0 ? ` (${errorCount} помилок)` : ''}`, 'success');
    
    // Оновлюємо портфоліо після завантаження
    setTimeout(() => {
      calculateAndDisplayPortfolio();
    }, 1000);
  } else {
    showNotification(`❌ Не вдалося завантажити жоден інвентар (${errorCount} помилок)`, 'error');
  }
}

// Функція для перевірки чи потрібно автоматично завантажувати інвентарі
function shouldAutoLoadInventories() {
  const accountsWithInventory = accounts.filter(acc => 
    acc.fullInventory && acc.fullInventory.length > 0
  );
  
  const accountsWithCredentials = accounts.filter(acc => 
    acc.login && acc.password && acc.login.trim() !== '' && acc.password.trim() !== ''
  );
  
  // Якщо менше 50% акаунтів мають завантажений інвентар, пропонуємо автозавантаження
  const loadedPercentage = accountsWithCredentials.length > 0 ? 
    (accountsWithInventory.length / accountsWithCredentials.length) * 100 : 0;
  
  console.log(`[Portfolio] Завантажено інвентарів: ${accountsWithInventory.length}/${accountsWithCredentials.length} (${loadedPercentage.toFixed(1)}%)`);
  
  // Перевіряємо час останнього завантаження (не частіше ніж раз на годину)
  const lastAutoLoad = localStorage.getItem('lastAutoInventoryLoad');
  const now = Date.now();
  const oneHour = 60 * 60 * 1000; // 1 година в мілісекундах
  
  if (lastAutoLoad && (now - parseInt(lastAutoLoad)) < oneHour) {
    console.log('[Portfolio] Автозавантаження пропущено - завантажували менше години тому');
    return false;
  }
  
  return loadedPercentage < 50;
}

// Основна функція для розрахунку та відображення портфоліо
function calculateAndDisplayPortfolio() {
  try {
    const portfolioData = calculatePortfolioStats();
    updatePortfolioSummary(portfolioData);
    renderPortfolioAccounts(portfolioData.accountsWithInventory);
    renderPortfolioCharts(portfolioData);
    
    console.log('[Portfolio] Портфоліо оновлено:', portfolioData);
  } catch (error) {
    console.error('[Portfolio] Помилка розрахунку портфоліо:', error);
    showNotification('❌ Помилка завантаження портфоліо: ' + error.message, 'error');
  }
}

// Функція для розрахунку статистики портфоліо
function calculatePortfolioStats() {
  const stats = {
    totalInventoryValue: 0,
    totalInventoryItems: 0,
    activeAccounts: 0,
    averageValue: 0,
    accountsWithInventory: [],
    inventoryByAccount: {}
  };

  accounts.forEach(account => {
    let hasInventory = false;
    const accountStats = {
      login: account.login,
      name: account.name || account.login,
      inventory: [],
      totalInventoryValue: 0,
      inventoryCount: 0
    };

    // Обробляємо повний інвентар CS:GO та TF2
    if (account.fullInventory && account.fullInventory.length > 0) {
      hasInventory = true;
      
      account.fullInventory.forEach(item => {
        if (item && item.priceUAH) {
          const price = parseFloat(item.priceUAH) || 0;
          stats.totalInventoryValue += price;
          stats.totalInventoryItems++;
          accountStats.totalInventoryValue += price;
          accountStats.inventoryCount++;
          
          accountStats.inventory.push({
            name: item.name || 'Невідомий предмет',
            imageUrl: item.imageUrl || '',
            price: item.priceUAH || '0',
            originalPrice: item.originalPrice || item.price || '$0.00',
            type: item.type || '',
            rarity: item.rarity || '',
            tradeable: item.tradeable || false,
            marketable: item.marketable || false,
            game: item.game || 'Unknown'
          });
        }
      });
    }

    if (hasInventory) {
      stats.activeAccounts++;
      stats.accountsWithInventory.push(accountStats);
      stats.inventoryByAccount[account.login] = accountStats.inventoryCount;
    }
  });

  // Загальна статистика
  stats.averageValue = stats.totalInventoryItems > 0 ? stats.totalInventoryValue / stats.totalInventoryItems : 0;
  
  // Сортуємо акаунти за вартістю інвентаря
  stats.accountsWithInventory.sort((a, b) => b.totalInventoryValue - a.totalInventoryValue);

  return stats;
}

// Функція для оновлення загальної статистики
function updatePortfolioSummary(portfolioData) {
  const totalValueEl = document.getElementById('total-portfolio-value');
  const totalDropsEl = document.getElementById('total-drops-count');
  const activeAccountsEl = document.getElementById('active-accounts-count');
  const averageDropValueEl = document.getElementById('average-drop-value');

  if (totalValueEl) {
    totalValueEl.textContent = `₴${portfolioData.totalInventoryValue.toFixed(2)}`;
  }
  
  if (totalDropsEl) {
    totalDropsEl.textContent = portfolioData.totalInventoryItems.toString();
  }
  
  if (activeAccountsEl) {
    activeAccountsEl.textContent = portfolioData.activeAccounts.toString();
  }
  
  if (averageDropValueEl) {
    averageDropValueEl.textContent = `₴${portfolioData.averageValue.toFixed(2)}`;
  }
}

// Функція для відображення акаунтів з інвентарем
function renderPortfolioAccounts(accountsWithInventory) {
  const container = document.getElementById('portfolio-accounts');
  if (!container) return;

  if (accountsWithInventory.length === 0) {
    container.innerHTML = `
      <div class="no-drops-message">
        <p>📭 Немає інвентаря для відображення</p>
        <p>Завантажте інвентар CS:GO та Team Fortress 2 для перегляду предметів</p>
      </div>
    `;
    return;
  }

  container.innerHTML = accountsWithInventory.map(account => `
    <div class="portfolio-account-card">
      <div class="portfolio-account-header">
        <div class="portfolio-account-name">${escapeHtml(account.name)}</div>
        <div class="portfolio-account-stats">
          <span>📦 Предметів: ${account.inventoryCount}</span>
          <span>💰 Вартість інвентаря: ₴${account.totalInventoryValue.toFixed(2)}</span>
        </div>
      </div>
      
      ${account.inventory.length > 0 ? `
        <div class="portfolio-section">
          <h4 class="portfolio-section-title">� Інвентар CS:GO та Team Fortress 2</h4>
          
          ${(() => {
            // Групуємо предмети по іграх
            const csgoItems = account.inventory.filter(item => item.game === 'CS:GO');
            const tf2Items = account.inventory.filter(item => item.game === 'TF2');
            
            let html = '';
            
            if (csgoItems.length > 0) {
              html += `
                <div class="game-section">
                  <h5 class="game-title">🔫 CS:GO (${csgoItems.length} предметів)</h5>
                  <div class="portfolio-drops-grid">
                    ${csgoItems.slice(0, 12).map(item => `
                      <div class="portfolio-drop-item">
                        ${item.imageUrl ? 
                          `<img src="${item.imageUrl}" alt="${escapeHtml(item.name)}" class="drop-image" onerror="this.style.display='none'">` : 
                          '<div class="drop-image" style="background: var(--bg-hover); display: flex; align-items: center; justify-content: center; font-size: 20px;">�</div>'
                        }
                        <div class="drop-info">
                          <div class="drop-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name.length > 22 ? item.name.substring(0, 22) + '...' : item.name)}</div>
                          <div class="drop-price">₴${item.price} ${item.tradeable ? '(🔄)' : '(🔒)'}</div>
                          ${item.type ? `<div class="item-type">${escapeHtml(item.type)}</div>` : ''}
                        </div>
                      </div>
                    `).join('')}
                    ${csgoItems.length > 12 ? `
                      <div class="portfolio-drop-item more-items-indicator">
                        <div class="drop-image" style="background: var(--bg-hover); display: flex; align-items: center; justify-content: center; font-size: 16px; color: var(--emerald-400);">+${csgoItems.length - 12}</div>
                        <div class="drop-info">
                          <div class="drop-name">Ще CS:GO предметів</div>
                          <div class="drop-price">...</div>
                        </div>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
            }
            
            if (tf2Items.length > 0) {
              html += `
                <div class="game-section">
                  <h5 class="game-title">� Team Fortress 2 (${tf2Items.length} предметів)</h5>
                  <div class="portfolio-drops-grid">
                    ${tf2Items.slice(0, 12).map(item => `
                      <div class="portfolio-drop-item">
                        ${item.imageUrl ? 
                          `<img src="${item.imageUrl}" alt="${escapeHtml(item.name)}" class="drop-image" onerror="this.style.display='none'">` : 
                          '<div class="drop-image" style="background: var(--bg-hover); display: flex; align-items: center; justify-content: center; font-size: 20px;">�</div>'
                        }
                        <div class="drop-info">
                          <div class="drop-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name.length > 22 ? item.name.substring(0, 22) + '...' : item.name)}</div>
                          <div class="drop-price">₴${item.price} ${item.tradeable ? '(🔄)' : '(🔒)'}</div>
                          ${item.type ? `<div class="item-type">${escapeHtml(item.type)}</div>` : ''}
                        </div>
                      </div>
                    `).join('')}
                    ${tf2Items.length > 12 ? `
                      <div class="portfolio-drop-item more-items-indicator">
                        <div class="drop-image" style="background: var(--bg-hover); display: flex; align-items: center; justify-content: center; font-size: 16px; color: var(--emerald-400);">+${tf2Items.length - 12}</div>
                        <div class="drop-info">
                          <div class="drop-name">Ще TF2 предметів</div>
                          <div class="drop-price">...</div>
                        </div>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
            }
            
            return html;
          })()}
        </div>
      ` : `
        <div class="no-data-message">
          <p>📭 Інвентар порожній або не завантажений</p>
          <p>Натисніть "📦 Завантажити повний інвентар" для завантаження</p>
        </div>
      `}
    </div>
  `).join('');
}

// Функція для відображення графіків
function renderPortfolioCharts(portfolioData) {
  // Знищуємо попередні графіки якщо є
  if (portfolioChart) {
    portfolioChart.destroy();
    portfolioChart = null;
  }
  if (valueChart) {
    valueChart.destroy();
    valueChart = null;
  }

  const dropsCanvas = document.getElementById('dropsChart');
  const valueCanvas = document.getElementById('valueChart');
  
  if (!dropsCanvas || !valueCanvas) return;

  const accounts = portfolioData.accountsWithInventory.slice(0, 10); // Показуємо топ 10 акаунтів
  
  if (accounts.length === 0) return;

  const labels = accounts.map(acc => acc.name);
  const inventoryData = accounts.map(acc => acc.inventoryCount);
  const valueData = accounts.map(acc => acc.totalInventoryValue);

  // Графік кількості предметів в інвентарі
  const dropsCtx = dropsCanvas.getContext('2d');
  portfolioChart = new Chart(dropsCtx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Кількість предметів',
        data: inventoryData,
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#a7f3d0'
          }
        },
        title: {
          display: true,
          text: 'Кількість предметів в інвентарі по акаунтах',
          color: '#6ee7b7',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#6ee7b7',
            stepSize: 1
          },
          grid: {
            color: 'rgba(110, 231, 183, 0.1)'
          }
        },
        x: {
          ticks: {
            color: '#6ee7b7',
            maxRotation: 45
          },
          grid: {
            color: 'rgba(110, 231, 183, 0.1)'
          }
        }
      }
    }
  });

  // Графік вартості інвентаря
  const valueCtx = valueCanvas.getContext('2d');
  valueChart = new Chart(valueCtx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        label: 'Вартість інвентаря (₴)',
        data: valueData,
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(52, 211, 153, 0.8)',
          'rgba(110, 231, 183, 0.8)',
          'rgba(167, 243, 208, 0.8)',
          'rgba(209, 250, 229, 0.8)',
          'rgba(5, 150, 105, 0.8)',
          'rgba(4, 120, 87, 0.8)',
          'rgba(6, 95, 70, 0.8)',
          'rgba(6, 78, 59, 0.8)',
          'rgba(2, 44, 34, 0.8)'
        ],
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#a7f3d0',
            usePointStyle: true,
            padding: 15
          }
        },
        title: {
          display: true,
          text: 'Розподіл вартості інвентаря',
          color: '#6ee7b7',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ₴${value.toFixed(2)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// Функція для екранування HTML
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Ініціалізація портфоліо при завантаженні
document.addEventListener('DOMContentLoaded', function() {
  // Додаємо обробник для автоматичного оновлення портфоліо при зміні табу
  const portfolioTab = document.querySelector('[onclick*="portfolio-tab"]');
  if (portfolioTab) {
    portfolioTab.addEventListener('click', function() {
      setTimeout(() => {
        showPortfolio();
        updateAutoLoadButtonText(); // Оновлюємо текст кнопки при відкритті портфоліо
      }, 100);
    });
  }
  
  // Перевіряємо налаштування автозавантаження при старті
  checkAutoLoadOnStartup();
  
  // Оновлюємо текст кнопки при завантаженні
  setTimeout(updateAutoLoadButtonText, 500);
});

// Функція для перевірки автозавантаження при старті
function checkAutoLoadOnStartup() {
  const autoLoadSetting = localStorage.getItem('autoLoadInventoryOnStartup');
  
  if (autoLoadSetting === 'true') {
    console.log('[Portfolio] Автозавантаження при старті активне');
    
    // Затримка для повного завантаження інтерфейсу
    setTimeout(() => {
      if (shouldAutoLoadInventories()) {
        console.log('[Portfolio] Запуск автозавантаження при старті...');
        autoLoadAllInventories();
      }
    }, 5000); // 5 секунд після старту
  }
}

// Функція для увімкнення/вимкнення автозавантаження при старті
function toggleAutoLoadOnStartup() {
  const currentSetting = localStorage.getItem('autoLoadInventoryOnStartup') === 'true';
  const newSetting = !currentSetting;
  
  localStorage.setItem('autoLoadInventoryOnStartup', newSetting.toString());
  
  const status = newSetting ? 'увімкнено' : 'вимкнено';
  showNotification(`⚙️ Автозавантаження при старті ${status}`, newSetting ? 'success' : 'info');
  
  console.log(`[Portfolio] Автозавантаження при старті ${status}`);
  
  // Оновлюємо текст кнопки
  updateAutoLoadButtonText();
}

// Функція для оновлення тексту кнопки автозавантаження
// Set global trade link from input
window.setGlobalTradeLink = function() {
  const input = document.getElementById('globalTradeLinkInput');
  if (input) {
    globalTradeLink = input.value.trim();
    localStorage.setItem('globalTradeLink', globalTradeLink);
    showNotification('Глобальна трейд-лінка збережена!', 'success');
  }
};

// Modal logic for global trade link skin transfer
globalThis.openGlobalTradeModal = function(accountIndex) {
  const acc = accounts[accountIndex];
  // Check if there is inventory to transfer
  const hasCS2 = acc.fullInventory && acc.fullInventory.some(item => item.gameApp === 'CS:GO' || item.game === 'CS:GO');
  const hasTF2 = acc.fullInventory && acc.fullInventory.some(item => item.gameApp === 'TF2' || item.game === 'TF2');
  if (!hasCS2 && !hasTF2) {
    showNotification('У акаунта немає інвентаря CS2 або TF2 для перекидання!', 'warning');
    return;
  }
  const modal = document.createElement('div');
  modal.className = 'global-trade-modal';
  modal.innerHTML = `
    <div class="global-trade-modal-content">
      <h3><span class="modal-icon">🌐</span> Виберіть гру для перекидання скінів</h3>
      <div class="game-select">
        <button class="game-btn" onclick="window.sendGlobalTrade(${accountIndex}, 'CS2')" ${!hasCS2 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
          <span class="game-icon">🔫</span> CS2
        </button>
        <button class="game-btn" onclick="window.sendGlobalTrade(${accountIndex}, 'TF2')" ${!hasTF2 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
          <span class="game-icon">🛡️</span> Team Fortress 2
        </button>
      </div>
      <button onclick="window.closeGlobalTradeModal()" class="close-modal">Закрити</button>
    </div>
  `;
  document.body.appendChild(modal);
};

globalThis.closeGlobalTradeModal = function() {
  const modal = document.querySelector('.global-trade-modal');
  if (modal) modal.remove();
};

globalThis.sendGlobalTrade = async function(accountIndex, game) {
  const acc = accounts[accountIndex];
  if (!globalTradeLink || globalTradeLink.trim() === '') {
    showNotification('Глобальна трейд-лінка не вказана!', 'error');
    return;
  }
  // Inventory check for CS2
  if (game === 'CS2') {
    const hasCS2 = acc.fullInventory && acc.fullInventory.some(item => item.gameApp === 'CS:GO' || item.game === 'CS:GO');
    if (!hasCS2) {
      showNotification('У акаунта немає інвентаря CS2 для перекидання!', 'warning');
      return;
    }
  }
  showLoadingIndicator(`Відправка всіх скінів з ${game} на глобальну трейд-лінку...`);
  try {
    let appIDs = [];
    if (game === 'CS2') appIDs = [{ appid: 730, contextid: 2 }];
    else if (game === 'TF2') appIDs = [{ appid: 440, contextid: 2 }];
    else appIDs = [{ appid: 730, contextid: 2 }, { appid: 440, contextid: 2 }];

    let maFilePath = acc.maFilePath;
    if (!maFilePath || !fs.existsSync(maFilePath)) {
      if (maFilesPath) maFilePath = path.join(maFilesPath, acc.login + '.maFile');
      if (!maFilePath || !fs.existsSync(maFilePath)) throw new Error('maFile не знайдено для акаунта ' + acc.login);
    }
    const maFile = JSON.parse(fs.readFileSync(maFilePath));
    const identitySecret = maFile.identity_secret;
    const sharedSecret = maFile.shared_secret;
    if (!identitySecret || !sharedSecret) throw new Error('maFile не містить необхідних секретів');

    tradeManager = new TradeManager();
    await tradeManager.login(acc.login, acc.password, SteamTotp.generateAuthCode(sharedSecret), identitySecret);
    const result = await tradeManager.sendAllTradeableItems(globalTradeLink, appIDs);
    showNotification(result.message || '✅ Всі скіни відправлено!', 'success');
    tradeManager.disconnect();
  } catch (e) {
    console.error('[sendGlobalTrade] Помилка:', e);
    showNotification('❌ Помилка: ' + (e.message || e), 'error');
  } finally {
    hideLoadingIndicator();
    window.closeGlobalTradeModal();
  }
};
function updateAutoLoadButtonText() {
  const autoLoadButton = document.querySelector('.auto-setting-btn');
  if (autoLoadButton) {
    const isEnabled = localStorage.getItem('autoLoadInventoryOnStartup') === 'true';
    const textElement = autoLoadButton.childNodes[autoLoadButton.childNodes.length - 1];
    if (textElement && textElement.nodeType === Node.TEXT_NODE) {
      textElement.textContent = isEnabled ? ' Авто: ВКЛ' : ' Авто при старті';
    }
    
    // Змінюємо стиль кнопки залежно від стану
    if (isEnabled) {
      autoLoadButton.style.background = 'linear-gradient(135deg, var(--emerald-600), var(--emerald-700))';
      autoLoadButton.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)';
    } else {
      autoLoadButton.style.background = 'linear-gradient(135deg, var(--emerald-400), var(--emerald-500))';
      autoLoadButton.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.1)';
    }
  }
}
