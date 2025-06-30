const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'accounts.json');
const SteamTotp = require('steam-totp');
let accounts = [];

function loadAccounts() {
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath);
    try {
      const loaded = JSON.parse(raw).accounts || [];
      accounts = loaded.map(acc => ({
        ...acc,
        open: acc.open || false,
        farming:acc.farming || false
      }));
    } catch {
      accounts = [];
    }
  }
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
function ResetFarm() {
  if (!confirm('Скинути всі "відфармлені" акаунти?')) return;

  let changed = false;
  accounts.forEach(acc => {
    if (acc.starred) {
      acc.starred = false;
      changed = true;
    }
  });

  if (changed) {
    saveAccounts();
    render();
  }
}

function saveAccounts() {
  fs.writeFileSync(filePath, JSON.stringify({ accounts }, null, 2));
}
function toggleFarming(index) {
  accounts[index].isFarming = !accounts[index].isFarming;
  saveAccounts();
  const currentTab = document.querySelector('.tab-button.active').innerText;
  if (currentTab === 'Фармляться') {
    render(true);
  } else {
    render();
  }
}
function showTab(tabId, btn) {
  // Переключення вкладок
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));

  document.getElementById(tabId).classList.add('active');
  btn.classList.add('active');

  const accountsContainer = document.getElementById('accounts');

  // Логіка для кожної вкладки
  if (tabId === 'accounts-tab') {
    accountsContainer.style.display = 'flex';
    const historyList = document.getElementById('history-list');
  historyList.innerHTML = '';
    render(false); 
  } else if (tabId === 'farming-tab') {
    accountsContainer.style.display = 'flex';
    render(true); 
    const historyList = document.getElementById('history-list');
  historyList.innerHTML = '';
  } else if (tabId === 'history-tab') {
    accountsContainer.style.display = 'none'; // сховати акаунти
    renderHistory();
  }
}



function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
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

function updateField(index, key, value) {
  if (["income", "expenses", "weeklyIncome"].includes(key)) {
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
  accounts.push({
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
    open: false
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
  if (file ) {
    updateField(index, 'maFilePath', `./resources/app/maFiles/${file.name}`);
  } else {
    alert('Неможливо отримати шлях до файлу. Переконайтесь, що ви використовуєте Electron.');
  }
}


function render(onlyFarming = false) {
  const container = document.getElementById('accounts');
  const farmingContainer = document.getElementById('farming-accounts');
  const search = document.getElementById('search-input')?.value?.toLowerCase() || '';

  container.innerHTML = '';
  farmingContainer.innerHTML = '';

  // Визначити, які акаунти рендерити
  const filteredAccounts = accounts.filter((acc, i) => {
    if (onlyFarming) return acc.farming;
    const name = (acc.name || acc.login || '').toLowerCase();
    return name.includes(search);
  });

  const targetContainer = onlyFarming ? farmingContainer : container;

  filteredAccounts.forEach((acc, i) => {
    const passwordId = `password-${i}`;
    const netProfit = (parseFloat(acc.income || 0) - parseFloat(acc.expenses || 0)).toFixed(2);

    const div = document.createElement('div');
    div.className = 'account';
    const isOpen = acc.open;

   div.innerHTML = `
  <div class="account-card">
    <div class="account-header" onclick="toggleDetails(${i})">
      <div class="account-title">
        <b>#${i + 1}</b>
        <span>${acc.name || acc.login || 'Без імені'}</span>
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

        <button onclick="event.stopPropagation(); generate2FA(${i})" class="btn-2fa">📟 Копіювати 2FA</button>

        <button onclick="event.stopPropagation(); toggleFarming(${i})" class="btn-farming">
          ${acc.farming ? '✅ Фармиться' : '🚫 Не фармиться'}
        </button>

        <button id="${i}Button" class="buttonFarm ${acc.starred ? 'farm' : 'unFarm'}" onclick="event.stopPropagation(); toggleStar(${i})">
          ${acc.starred ? 'Відфармлений' : 'Не відфармлений'}
        </button>

        <span class="toggle-arrow">▼</span>
      </div>
    </div>

    <div class="account-details" id="details-${i}" style="display: ${isOpen ? 'block' : 'none'};">
      <div class="account-body">
        ${acc.prime
          ? `<div class="prime-section">
               <span title="Prime Status">🔒 Prime</span>
               <button class="btn-prime-remove" onclick="event.stopPropagation(); togglePrime(${i})">❌ Видалити Prime</button>
             </div>`
          : `<div class="prime-section">
               <span title="До Prime">
                 До Prime: через ${daysUntil(acc.unlockDate)} днів
               </span>
               <input type="date" value="${acc.unlockDate || ''}" onchange="updateUnlockDate(${i}, this.value)" />
               <button class="btn-prime-add" onclick="event.stopPropagation(); togglePrime(${i})">✅ Встановити Prime</button>
             </div>`}

        <input type="file" onchange="selectMaFile(event, ${i})" />
        <input type="text" placeholder="Шлях до maFile" value="${acc.maFilePath || ''}" onchange="updateField(${i}, 'maFilePath', this.value)" />

        <input type="text" placeholder="Ім’я" value="${acc.name || ''}" onchange="updateField(${i}, 'name', this.value)" />
        <input type="text" placeholder="Login" value="${acc.login}" onchange="updateField(${i}, 'login', this.value)" />

        <div class="password-field">
          <input type="password" id="${passwordId}" placeholder="Password" value="${acc.password}" onchange="updateField(${i}, 'password', this.value)" />
          <button onclick="togglePasswordVisibility('${passwordId}')">👁️</button>
        </div>

        <div class="finance">
          <label>💰 Загальний дохід:</label>
          <input type="number" value="${acc.income || 0}" onchange="updateField(${i}, 'income', this.value)" /> грн

          <label>➕ Дохід за тиждень:</label>
          <input type="number" value="${acc.weeklyIncome || 0}" onchange="updateField(${i}, 'weeklyIncome', this.value)" /> грн
          <button class="btn-weekly-add" onclick="addWeeklyIncome(${i})">➕ Додати</button>

          <label>💸 Загальні витрати:</label>
          <input type="number" value="${acc.expenses || 0}" onchange="updateField(${i}, 'expenses', this.value)" /> грн

          <b>📈 Чистий прибуток: ${netProfit} грн</b>
        </div>

        <button class="delete-btn" onclick="deleteAccount(${i})">🗑️ Видалити</button>
      </div>
    </div>
  </div>
`;


    targetContainer.appendChild(div);
  });

  // Оновлення загального прибутку
  const totalProfit = accounts.reduce((sum, acc) => {
    const inc = parseFloat(acc.income) || 0;
    const exp = parseFloat(acc.expenses) || 0;
    return sum + (inc - exp);
  }, 0);

  const totalProfitEl = document.getElementById('total-profit');
totalProfitEl.innerText = `Загальний прибуток: ${totalProfit.toFixed(2)} грн`;

if (totalProfit > 0) {
  totalProfitEl.style.color = '#4caf50'; // зелений
} else if (totalProfit < 0) {
  totalProfitEl.style.color = '#f44336'; // червоний
} else {
  totalProfitEl.style.color = '#fff'; // нейтральний
}
}

function toggleDetails(index) {
  accounts[index].open = !accounts[index].open;
  saveAccounts();
  render();
}
function renderHistory() {
  const historyList = document.getElementById('history-list');
  historyList.innerHTML = '';

  let allHistory = [];
  accounts.forEach(acc => {
    if (acc.history && acc.history.length) {
      acc.history.forEach(h => {
        allHistory.push({
          name: acc.name || acc.login || 'Без імені',
          date: h.date,
          amount: h.amount
        });
      });
    }
  });

  allHistory.sort((a, b) => {
    const dateA = new Date(a.date.split('.').reverse().join('-'));
    const dateB = new Date(b.date.split('.').reverse().join('-'));
    return dateB - dateA;
  });

  if (allHistory.length === 0) {
    historyList.innerHTML = '<li>Історія відсутня</li>';
    return;
  }

  allHistory.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `
    <div class="history-entry">
  <span class="history-icon">📅</span>
  <span class="history-date"> ${item.date}</span> —
  <span class="history-login">${item.name}</span>:
  <span class="history-income">+${item.amount.toFixed(2)} грн</span>
</div>`;
    historyList.appendChild(li);
  });
}
function filterAccounts() {
  const filter = document.getElementById('filter-select').value;
  const query = document.getElementById('search-input').value.toLowerCase();

  const filtered = accounts.filter(acc => {
    const matchesSearch =
      (acc.name || '').toLowerCase().includes(query) ||
      (acc.login || '').toLowerCase().includes(query);

    const matchesFilter =
      filter === 'all' ||
      (filter === 'farming' && acc.farming) ||
      (filter === 'not-farming' && !acc.farming);

    return matchesSearch && matchesFilter;
  });

  renderFilteredAccounts(filtered, 'accounts');
}
function toggleFarming(index) {
  accounts[index].farming = !accounts[index].farming;
  saveAccounts();
  render();
}

window.onload = loadAccounts;