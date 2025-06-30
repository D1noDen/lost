const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'accounts.json');
const SteamTotp = require('steam-totp');
const TradeManager = require('./trade_manager.js');

let accounts = [];
let tradeManager = null;

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
          lastDropImageUrl: acc.lastDropImageUrl || ''
        };
      });
      // Зберігаємо оновлені дані з ID
      saveAccounts();
    } catch {
      accounts = [];
    }
  }
  render();
}

function updateField(index, key, value) {
  if (["income", "expenses", "weeklyIncome", "lastDropPrice"].includes(key)) {
    accounts[index][key] = parseFloat(value) || 0;
  } else {
    accounts[index][key] = value;
  }
  saveAccounts();
  render();
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
  render();
}

function deleteAccount(index) {
  if (confirm('Видалити акаунт?')) {
    accounts.splice(index, 1);
    saveAccounts();
    render();
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
    open: false,
    farming: true
  });
  saveAccounts();
  render();
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
  render();
}

function togglePrime(index) {
  accounts[index].prime = !accounts[index].prime;
  saveAccounts();
  render();
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
  render();
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

    console.log(`[fetchLastDrop] Отримуємо інформацію про дроп...`);
    const dropInfo = await tradeManager.getLastDrop(acc.login);
    console.log(`[fetchLastDrop] Результат getLastDrop:`, dropInfo);
    
    if (dropInfo) {
      console.log('[fetchLastDrop] Отримано інформацію про дроп:', dropInfo);
      
      // Оновлюємо дані акаунту
      const oldDropData = {
        lastDrop: acc.lastDrop,
        lastDropImageUrl: acc.lastDropImageUrl,
        lastDropPrice: acc.lastDropPrice
      };
      
      accounts[index].lastDrop = dropInfo.name;
      accounts[index].lastDropImageUrl = dropInfo.imageUrl;
      accounts[index].lastDropPrice = dropInfo.price;
      
      console.log('[fetchLastDrop] Старі дані:', oldDropData);
      console.log('[fetchLastDrop] Нові дані:', {
        lastDrop: accounts[index].lastDrop,
        lastDropImageUrl: accounts[index].lastDropImageUrl,
        lastDropPrice: accounts[index].lastDropPrice
      });
      
      // Зберігаємо та перерендеруємо
      console.log('[fetchLastDrop] Зберігаємо дані...');
      saveAccounts();
      console.log('[fetchLastDrop] Перерендеруємо...');
      render();
      
      alert(`Останній дроп оновлено!\nПредмет: ${dropInfo.name}\nЦіна: ${dropInfo.price}`);
    } else {
      console.log('[fetchLastDrop] dropInfo is null або undefined');
      alert('Не вдалося знайти інформацію про дроп або інвентар порожній');
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
  const container = document.getElementById('accountsFarm');
  container.innerHTML = '';
 
  const filteredAccounts = accounts.filter(item => item.farming);

  filteredAccounts.forEach((acc, i) => {
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
      <div class="drop-preview ${acc.lastDrop ? 'has-drop' : 'no-drop-yet'}">
        ${acc.lastDrop ? `
          <img src="${acc.lastDropImageUrl || 'https://via.placeholder.com/48x48/333/fff?text=?'}" alt="${acc.lastDrop}" class="drop-preview-image" onerror="this.src='https://via.placeholder.com/48x48/333/fff?text=?'">
          <div class="drop-preview-info">
            <span class="drop-preview-name">${acc.lastDrop}</span>
            <span class="drop-preview-price">💰 ${acc.lastDropPrice}</span>
          </div>
          <button onclick="event.stopPropagation(); fetchLastDrop(${originalIndex})" class="btn-refresh-drop" title="Оновити дроп">🔄</button>
        ` : `
          <div class="drop-placeholder">
            <img src="https://via.placeholder.com/48x48/333/fff?text=?" class="drop-preview-image">
            <div class="drop-preview-info">
              <span class="drop-preview-name">Немає дропу</span>
              <span class="drop-preview-price">Натисніть для отримання</span>
            </div>
            <button onclick="event.stopPropagation(); fetchLastDrop(${originalIndex})" class="btn-fetch-drop-mini" title="Отримати дроп">🎁</button>
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
          <label>🎁 Останній дроп:</label>
          <div class="drop-controls">
            <button id="fetch-drop-${originalIndex}" onclick="fetchLastDrop(${originalIndex})" class="btn-fetch-drop">🎁 Отримати дроп зі Steam</button>
          </div>
          <input type="text" placeholder="Назва предмету" value="${acc.lastDrop || ''}" onchange="updateField(${originalIndex}, 'lastDrop', this.value)" />
          <input type="text" placeholder="URL зображення" value="${acc.lastDropImageUrl || ''}" onchange="updateField(${originalIndex}, 'lastDropImageUrl', this.value)" />
          <input type="number" placeholder="Ціна" value="${acc.lastDropPrice || 0}" onchange="updateField(${originalIndex}, 'lastDropPrice', this.value)" /> грн
          
          ${acc.lastDrop ? `
            <div class="last-drop-info">
              <img src="${acc.lastDropImageUrl || 'https://via.placeholder.com/64'}" alt="${acc.lastDrop}" class="last-drop-image" onerror="this.src='https://via.placeholder.com/64'">
              <div class="last-drop-details">
                <span class="last-drop-name">${acc.lastDrop}</span>
                <span class="last-drop-price">Ціна: ${acc.lastDropPrice} грн</span>
              </div>
            </div>
          ` : '<div class="no-drop">Немає інформації про дроп</div>'}
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
  render();
}

function toggleFarming(index) {
  accounts[index].farming = !accounts[index].farming;
  saveAccounts();
  render();
}

window.onload = loadAccounts;
