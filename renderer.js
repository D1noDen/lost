const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'accounts.json');
const SteamTotp = require('steam-totp');
const TradeManager = require('./trade_manager.js');

let accounts = [];
let tradeManager = null;
let filteredAccounts = []; // Для збереження відфільтрованих акаунтів
let searchQuery = ''; // Поточний запит пошуку

// Курс USD до UAH (можна оновлювати або отримувати з API)
const USD_TO_UAH_RATE = 41.5;

function convertUsdToUah(usdPrice) {
  // Видаляємо символ $ та конвертуємо в число
  const cleanPrice = parseFloat(usdPrice.replace('$', ''));
  if (isNaN(cleanPrice)) return 0;
  return (cleanPrice * USD_TO_UAH_RATE).toFixed(2);
}

function loadAccounts() {
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath);
    try {
      const loaded = JSON.parse(raw).accounts || [];
      accounts = loaded.map(acc => {
        // Додаємо ID для існуючих акаунтів, якщо вони його не мають
        if (!acc.id) {
          acc.id = 'acc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return {
          ...acc,
          open: acc.open || false,
          lastDrop: acc.lastDrop || '',
          lastDropPrice: acc.lastDropPrice || 0,
          lastDropImageUrl: acc.lastDropImageUrl || '',
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
}

function addWeeklyIncome(index) {
  const acc = accounts[index];
  const weekly = parseFloat(acc.weeklyIncome) || 0;
  if (weekly <= 0) return;

  acc.income = (parseFloat(acc.income) || 0) + weekly;
  acc.weeklyIncome = 0;

  const date = new Date().toLocaleDateString();
  acc.history = acc.history || [];
  acc.history.unshift({ date, amount: weekly });

  saveAccounts();
  // Оновлюємо відфільтровані акаунти після зміни
  if (searchQuery && searchQuery !== '') {
    searchAccounts(searchQuery);
  } else {
    filteredAccounts = [...accounts];
    render();
  }
}

function deleteAccount(index) {
  if (confirm('Видалити акаунт?')) {
    accounts.splice(index, 1);
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
  const accountId = 'acc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  accounts.push({
    id: accountId,
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
  console.log(event)
  const file = event.target.files[0];
  if (file) {
    updateField(index, 'maFilePath', `./resources/app/maFiles/${file.name}`);
  } else {
    alert('Неможливо отримати шлях до файлу. Переконайтесь, що ви використовуєте Electron.');
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
    filteredAccounts = [...accounts];
    render();
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
    copyToClipboard(code);
    alert("Код скопійовано: " + code);
  } catch (e) {
    alert("Помилка при зчитуванні maFile: " + e.message);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
}

// Функція пошуку акаунтів
function searchAccounts(query) {
  searchQuery = query.toLowerCase().trim();
  
  if (!searchQuery || searchQuery === '') {
    filteredAccounts = [...accounts];
  } else {
    filteredAccounts = accounts.filter(acc => {
      const login = (acc.login || '').toLowerCase();
      const name = (acc.name || '').toLowerCase();
      const lastDrop = (acc.lastDrop || '').toLowerCase();
      const id = (acc.id || '').toLowerCase();
      
      return login.includes(searchQuery) || 
             name.includes(searchQuery) || 
             lastDrop.includes(searchQuery) ||
             id.includes(searchQuery);
    });
  }
  
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
  if (searchInfo) {
    if (searchQuery && searchQuery !== '') {
      const total = accounts.length;
      const found = filteredAccounts.length;
      searchInfo.textContent = `Знайдено ${found} з ${total} акаунтів`;
      searchInfo.style.display = 'block';
    } else {
      searchInfo.style.display = 'none';
    }
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

async function fetchLastDrop(index) {
  const acc = accounts[index];
  console.log(`[fetchLastDrop] Початок для акаунту ${acc.login}, index: ${index}`);
  
  if (!acc.login || !acc.password) {
    alert('Потрібно вказати логін та пароль для акаунту');
    return;
  }

  // Спочатку перевіряємо, чи є maFile в заданому шляху
  let maFilePath = acc.maFilePath;
  if (!maFilePath || !fs.existsSync(maFilePath)) {
    // Якщо шлях не вказаний або файл не існує, шукаємо в стандартній папці
    maFilePath = path.join(__dirname, 'maFiles', `${acc.login}.maFile`);
    if (!fs.existsSync(maFilePath)) {
      alert(`maFile не знайдено для акаунту ${acc.login}.\nПеревірено:\n- ${acc.maFilePath}\n- ${maFilePath}`);
      return;
    }
  }

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
      document.querySelector(`[onclick="fetchLastDrop(${index})"]`)
    ];
    
    buttons.forEach(button => {
      if (button) {
        button.textContent = 'Завантаження...';
        button.disabled = true;
      }
    });

    console.log(`[fetchLastDrop] Намагаємося увійти в акаунт ${acc.login}...`);
    await tradeManager.login(acc.login, acc.password, SteamTotp.generateAuthCode(sharedSecret), identitySecret);
    console.log(`[fetchLastDrop] Увійшли в акаунт ${acc.login}`);

    console.log(`[fetchLastDrop] Отримуємо інформацію про дропи...`);
    const dropsInfo = await tradeManager.getLastDrops(acc.login, 2); // Отримуємо 2 останні дропи
    console.log(`[fetchLastDrop] Результат getLastDrops:`, dropsInfo);
    
    if (dropsInfo && dropsInfo.length > 0) {
      console.log('[fetchLastDrop] Отримано інформацію про дропи:', dropsInfo);
      
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
      ).join('\n');
      
      alert(`Дропи оновлено!\n\n${dropsText}`);
    } else {
      console.log('[fetchLastDrop] dropsInfo is null, undefined або порожній');
      alert('Не вдалося знайти інформацію про дропи або інвентар порожній');
    }

    tradeManager.disconnect();
    
  } catch (e) {
    console.error(`[fetchLastDrop] Помилка при отриманні дропу для ${acc.login}:`, e);
    alert(`Помилка: ${e.message}`);
  } finally {
    // Відновлюємо кнопки
    const buttons = [
      document.getElementById(`fetch-drop-${index}`),
      document.querySelector(`[onclick="fetchLastDrop(${index})"]`)
    ];
    
    buttons.forEach(button => {
      if (button) {
        if (button.textContent.includes('🔄')) {
          button.textContent = '🔄';
        } else {
          button.textContent = '🎁';
        }
        button.disabled = false;
      }
    });
    console.log(`[fetchLastDrop] Завершено для акаунту ${acc.login}`);
  }
}

function render() {
  const container = document.getElementById('accounts');
  container.innerHTML = '';
 
  const accountsToRender = (!searchQuery || searchQuery === '') ? accounts : filteredAccounts;

  // Показуємо повідомлення, якщо нічого не знайдено (тільки при активному пошуку)
  if (searchQuery && searchQuery !== '' && accountsToRender.length === 0) {
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
    const isOpen = acc.open;

   div.innerHTML = `
  <div class="account-card">
    <div class="account-header" onclick="toggleDetails(${originalIndex})">
      <div class="account-title">
        <b>#${i + 1}</b>
        <span>${acc.name || acc.login || 'Без імені'}</span>
        <small class="account-id">ID: ${acc.id || 'Невідомо'}</small>
      </div>

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
          <button onclick="event.stopPropagation(); copyToClipboard('${acc.login}')">📋</button>
        </span>

        <span>
          🔒••••••
          <button onclick="event.stopPropagation(); copyToClipboard('${acc.password}')">📋</button>
        </span>

        <button onclick="event.stopPropagation(); generate2FA(${originalIndex})" class="btn-2fa">📟 Копіювати 2FA</button>

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
               <input type="date" value="${acc.unlockDate || ''}" onchange="updateUnlockDate(${originalIndex}, this.value)" />
               <button class="btn-prime-add" onclick="event.stopPropagation(); togglePrime(${originalIndex})">✅ Встановити Prime</button>
             </div>`}

        <input type="file" onchange="selectMaFile(event, ${originalIndex})" />
        <input type="text" placeholder="Шлях до maFile" value="${acc.maFilePath || ''}" onchange="updateField(${originalIndex}, 'maFilePath', this.value)" />

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
  try {
    const dataToSave = { accounts };
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
    console.log('[saveAccounts] Акаунти збережено успішно:', accounts.length, 'акаунтів');
    
    // Додаткове логування для дропів
    accounts.forEach((acc, i) => {
      if (acc.lastDrop) {
        console.log(`[saveAccounts] Акаунт ${i} (${acc.login}): lastDrop="${acc.lastDrop}", price="${acc.lastDropPrice}"`);
      }
    });
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
        allHistory.push({
          ...entry,
          accountName: acc.name || acc.login || `Акаунт #${accIndex + 1}`,
          accountIndex: accIndex
        });
      });
    }
  });

  // Сортуємо за датою (найновіші спочатку)
  allHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (allHistory.length === 0) {
    historyList.innerHTML = '<div class="no-history">📊 Історія транзакцій порожня</div>';
    return;
  }

  // Рендеримо історію
  allHistory.forEach(entry => {
    const listItem = document.createElement('li');
    listItem.className = 'history-entry';
    
    const amount = parseFloat(entry.amount) || 0;
    const amountClass = amount > 0 ? 'positive' : amount < 0 ? 'negative' : 'neutral';
    
    listItem.innerHTML = `
      <div class="history-item">
        <div class="history-header">
          <span class="history-icon">💰</span>
          <span class="history-account">${entry.accountName}</span>
          <span class="history-date">${entry.date}</span>
        </div>
        <div class="history-amount ${amountClass}">
          ${amount > 0 ? '+' : ''}${amount} грн
        </div>
      </div>
    `;
    
    historyList.appendChild(listItem);
  });
}

// Функція для ресету (якщо потрібна)
function ResetFarm() {
  if (confirm('Скинути всі дані фарму? Ця дія незворотна!')) {
    accounts.forEach(acc => {
      acc.farming = false;
      acc.open = false;
    });
    saveAccounts();
    render();
  }
}

window.onload = loadAccounts;
