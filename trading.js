const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');
const TradeManager = require('./trade_manager.js');
const SteamTotp = require('steam-totp');

const tradeManager = new TradeManager();
let activeOffers = [];
let selectedAccountName = null;
const historyFilePath = path.join(__dirname, 'trade_history.json');

function showTab(tabId, element) {
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    element.classList.add('active');
}

function saveToHistory(entry) {
    let history = [];
    if (fs.existsSync(historyFilePath)) {
        try {
            history = JSON.parse(fs.readFileSync(historyFilePath));
        } catch (e) {
            console.error('Error reading trade_history.json:', e);
        }
    }
    history.unshift(entry);
    fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));
}

function loadAndRenderHistory() {
    if (fs.existsSync(historyFilePath)) {
        try {
            const history = JSON.parse(fs.readFileSync(historyFilePath));
            renderHistory(history);
        } catch (e) {
            console.error('Error reading or parsing trade_history.json:', e);
            renderHistory([]);
        }
    } else {
        renderHistory([]);
    }
}

function renderHistory(history) {
    const container = document.getElementById('history-container');
    container.innerHTML = '';

    if (history.length === 0) {
        container.innerHTML = `
            <div class="no-trades">
                <div class="icon">📊</div>
                <h3>Історія порожня</h3>
                <p>Тут будуть відображатися завершені угоди</p>
            </div>
        `;
        return;
    }

    history.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'trade-offer';

        const itemsToGiveHtml = entry.itemsGiven.map(renderItem).join('');
        const itemsToReceiveHtml = entry.itemsReceived.map(renderItem).join('');
        const tradeDate = new Date(entry.date).toLocaleDateString('uk-UA');
        const tradeTime = new Date(entry.date).toLocaleTimeString('uk-UA');
        const headerClass = entry.status.toLowerCase();
        const statusText = entry.status === 'Accepted' ? 'Прийнято' : 'Відхилено';
        const statusIcon = entry.status === 'Accepted' ? '✅' : '❌';
        const statusBadgeClass = entry.status === 'Accepted' ? 'status-accepted' : 'status-declined';

        div.innerHTML = `
            <div class="trade-header ${headerClass}">
                <h3>${statusIcon} Трейд #${entry.id}</h3>
                <div class="trade-meta">
                    <span class="status-badge ${statusBadgeClass}">${statusText}</span>
                    👤 З: ${entry.partnerId} • 📅 ${tradeDate} ${tradeTime}
                </div>
            </div>
            <div class="trade-body">
                <div class="trade-section">
                    <h4>📤 Ви віддали</h4>
                    <div class="items-grid">
                        ${itemsToGiveHtml || '<div class="no-items">🚫 Нічого</div>'}
                    </div>
                </div>
                <div class="trade-section">
                    <h4>📥 Ви отримали</h4>
                    <div class="items-grid">
                        ${itemsToReceiveHtml || '<div class="no-items">🚫 Нічого</div>'}
                    </div>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

async function loadAccountsManually() {
    try {
        const data = await ipcRenderer.invoke('get-accounts-data');
        const accounts = data.accounts;
        
        if (!accounts || accounts.length === 0) {
            alert('Акаунти не знайдено!');
            return;
        }
        
        const accountSelect = document.getElementById('account-select');
        
        // Очищуємо попередні опції
        accountSelect.innerHTML = '';
        
        accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.login;
            option.textContent = account.name || account.login;
            accountSelect.appendChild(option);
        });

        // Показуємо селект та кнопку логіну
        accountSelect.style.display = 'block';
        document.getElementById('login-btn').style.display = 'inline-block';
        
        // Ховаємо кнопку завантаження
        event.target.style.display = 'none';
    } catch (error) {
        console.error('Помилка завантаження акаунтів:', error);
        alert('Помилка завантаження акаунтів!');
    }
}

async function login() {
    const selectedLogin = document.getElementById('account-select').value;
    const accountSelect = document.getElementById('account-select');
    
    if (!selectedLogin) {
        // Анімуємо помилку
        accountSelect.className = 'with-icon error';
        accountSelect.style.animation = 'shake 0.5s ease-in-out';
        
        setTimeout(() => {
            accountSelect.className = 'with-icon ready';
            accountSelect.style.animation = '';
        }, 500);
        
        showMessage('⚠️ Будь ласка, оберіть акаунт!', 'error');
        return;
    }
    
    try {
        const data = await ipcRenderer.invoke('get-accounts-data');
        const accounts = data.accounts;
        const selectedAccount = accounts.find(acc => acc.login === selectedLogin);
        
        if (!selectedAccount) {
            showMessage('❌ Акаунт не знайдено!', 'error');
            return;
        }
        
        // Показуємо стан завантаження
        showMessage('🔐 Входимо в акаунт...', 'loading');
        
        // Ховаємо контейнер логіну та показуємо інформацію про акаунт
        document.getElementById('login-container').style.display = 'none';
        const accountInfoDiv = document.getElementById('account-info');
        accountInfoDiv.style.display = 'block';
        
        // Красиво форматуємо ім'я акаунта
        const accountDisplayName = selectedAccount.name || selectedAccount.login;
        const primeIcon = selectedAccount.prime ? '👑' : '⚡';
        const farmingIcon = selectedAccount.farming ? '🌱' : '💤';
        
        document.getElementById('current-account-name').innerHTML = 
            `${primeIcon} ${farmingIcon} ${accountDisplayName} <small style="color: #888;">(${selectedAccount.login})</small>`;
        
        selectedAccountName = selectedAccount.login;
        
        // Логінимось тільки в один обраний акаунт
        loginToNextAccount([selectedAccount], 0);
    } catch (error) {
        console.error('Помилка входу в акаунт:', error);
        showMessage('❌ Помилка входу в акаунт!', 'error');
    }
}

function logout() {
    // Приховуємо всі повідомлення та loading-анімації
    hideLoadingMessages();
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => msg.remove());
    
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('account-info').style.display = 'none';
    
    // Скидаємо селект до початкового стану
    const accountSelect = document.getElementById('account-select');
    if (accountSelect) {
        accountSelect.selectedIndex = 0; // Повертаємо до "Оберіть акаунт"
        accountSelect.className = 'with-icon ready'; // Відновлюємо готовий стан
    }
    
    selectedAccountName = null;
    
    // Показуємо повідомлення про вихід
    showMessage('👋 Ви вийшли з акаунту', 'success');
    
    // Відключаємося від Steam
    tradeManager.disconnect();
}

function loadTrades() {
    const statesToFetch = [
        1, // Active
        8, // CreatedNeedsConfirmation
        10 // InEscrow
    ];

    const offerPromises = statesToFetch.map(state => tradeManager.getOffers(state));

    Promise.all(offerPromises)
        .then(offerGroups => {
            // Приховуємо повідомлення про завантаження після успішного завантаження трейдів
            hideLoadingMessages();
            
            // Flatten the array of arrays and remove duplicates
            const allOffers = [].concat(...offerGroups);
            const uniqueOffers = allOffers.filter((offer, index, self) =>
                index === self.findIndex((o) => o.id === offer.id)
            );

            activeOffers = uniqueOffers;
            renderTrades(uniqueOffers);
        })
        .catch(err => {
            // Приховуємо повідомлення про завантаження при помилці
            hideLoadingMessages();
            
            console.error('Failed to get trades:', err);
            showMessage(`❌ Помилка завантаження трейдів: ${err.message}`, 'error');
        });
}

function renderItem(item) {
    const nameColor = item.name_color ? `#${item.name_color}` : '#f1f1f1';
    const imageUrl = item.getImageURL ? item.getImageURL() : 
                    `https://community.cloudflare.steamstatic.com/economy/image/${item.icon_url}`;
    
    // Обрізаємо довгі назви
    const shortName = item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name;
    
    return `
        <div class="item-card" title="${item.name}">
            <img src="${imageUrl}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/64x64/333/fff?text=?'">
            <div class="item-name" style="color: ${nameColor};">
                ${shortName}
            </div>
        </div>
    `;
}

function renderTrades(offers) {
    const container = document.getElementById('trades-container');
    container.innerHTML = '';

    if (offers.length === 0) {
        container.innerHTML = `
            <div class="no-trades">
                <div class="icon">📦</div>
                <h3>Немає активних угод</h3>
                <p>На даний момент немає трейдів для обробки</p>
            </div>
        `;
        return;
    }

    offers.forEach(offer => {
        const div = document.createElement('div');
        div.className = 'trade-offer';

        const itemsToGiveHtml = offer.itemsToGive.map(renderItem).join('');
        const itemsToReceiveHtml = offer.itemsToReceive.map(renderItem).join('');
        
        const partnerName = offer.partner ? offer.partner.getSteamID64() : 'Невідомий користувач';
        const offerDate = new Date(offer.created * 1000).toLocaleDateString('uk-UA');
        const offerTime = new Date(offer.created * 1000).toLocaleTimeString('uk-UA');

        div.innerHTML = `
            <div class="trade-header">
                <h3>💼 Трейд #${offer.id}</h3>
                <div class="trade-meta">
                    <span class="status-badge status-active">Активний</span>
                    👤 Від: ${partnerName} • 📅 ${offerDate} ${offerTime}
                </div>
            </div>
            <div class="trade-body">
                <div class="trade-section">
                    <h4>📤 Ви віддаєте</h4>
                    <div class="items-grid">
                        ${itemsToGiveHtml || '<div class="no-items">🚫 Нічого</div>'}
                    </div>
                </div>
                <div class="trade-section">
                    <h4>📥 Ви отримуєте</h4>
                    <div class="items-grid">
                        ${itemsToReceiveHtml || '<div class="no-items">🚫 Нічого</div>'}
                    </div>
                </div>
            </div>
            <div class="trade-actions">
                <button class="btn-accept" onclick="acceptTrade('${offer.id}')">
                    ✅ Прийняти
                </button>
                <button class="btn-decline" onclick="declineTrade('${offer.id}')">
                    ❌ Відхилити
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

function acceptTrade(offerId) {
    const offer = activeOffers.find(o => o.id === offerId);
    if (!offer) {
        showMessage('❌ Трейд не знайдено!', 'error');
        return;
    }

    showMessage('⏳ Прийняття трейду...', 'loading');
    
    tradeManager.acceptOffer(offer)
        .then(() => {
            hideLoadingMessages();
            showMessage('✅ Трейд успішно прийнято!', 'success');
            const historyEntry = {
                id: offer.id,
                partnerId: offer.partner.getSteamID64(),
                status: 'Accepted',
                date: new Date().toISOString(),
                itemsGiven: offer.itemsToGive,
                itemsReceived: offer.itemsToReceive
            };
            saveToHistory(historyEntry);
            loadTrades();
        })
        .catch(err => {
            hideLoadingMessages();
            console.error('Failed to accept trade:', err);
            showMessage(`❌ Помилка при прийнятті трейду: ${err.message}`, 'error');
        });
}

function declineTrade(offerId) {
    const offer = activeOffers.find(o => o.id === offerId);
    if (!offer) {
        showMessage('❌ Трейд не знайдено!', 'error');
        return;
    }

    if (!confirm('Ви впевнені, що хочете відхилити цей трейд?')) {
        return;
    }

    showMessage('⏳ Відхилення трейду...', 'loading');
    
    tradeManager.declineOffer(offer)
        .then(() => {
            hideLoadingMessages();
            showMessage('✅ Трейд успішно відхилено!', 'success');
            const historyEntry = {
                id: offer.id,
                partnerId: offer.partner.getSteamID64(),
                status: 'Declined',
                date: new Date().toISOString(),
                itemsGiven: offer.itemsToGive,
                itemsReceived: offer.itemsToReceive
            };
            saveToHistory(historyEntry);
            loadTrades();
        })
        .catch(err => {
            hideLoadingMessages();
            console.error('Failed to decline trade:', err);
            showMessage(`❌ Помилка при відхиленні трейду: ${err.message}`, 'error');
        });
}

function hideLoadingMessages() {
    // Видаляємо всі loading повідомлення та елементи з класом loading
    const loadingMessages = document.querySelectorAll('.loading');
    loadingMessages.forEach(msg => {
        if (msg.parentNode) {
            msg.remove();
        }
    });
    
    // Також видаляємо батьківські div-и, що можуть містити loading
    const loadingContainers = document.querySelectorAll('div:has(.loading)');
    loadingContainers.forEach(container => {
        if (container && !container.querySelector(':not(.loading)')) {
            container.remove();
        }
    });
}

function showMessage(text, type = 'info') {
    // Видаляємо попередні повідомлення більш надійно
    hideLoadingMessages();
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => {
        if (msg.parentNode) {
            msg.remove();
        }
    });

    const messageDiv = document.createElement('div');
    
    if (type === 'loading') {
        messageDiv.className = 'loading';
        messageDiv.innerHTML = `
            <div class="spinner"></div>
            <div>${text}</div>
        `;
    } else {
        messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
        messageDiv.textContent = text;
    }

    const container = document.querySelector('.trades-container');
    if (container) {
        container.insertBefore(messageDiv, container.firstChild);
    } else {
        // Якщо контейнер не знайдено, додаємо до body
        document.body.insertBefore(messageDiv, document.body.firstChild);
    }

    // Автоматично видаляємо повідомлення через 5 секунд (окрім loading)
    if (type !== 'loading') {
        setTimeout(() => {
            if (messageDiv && messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

async function loginToNextAccount(accounts, index = 0) {
    if (index >= accounts.length) {
        console.log('All accounts processed.');
        return;
    }

    const account = accounts[index];
    
    try {
        // Читаємо .maFile через IPC
        const maFileResult = await ipcRenderer.invoke('read-mafile', account.login);
        
        if (!maFileResult.success) {
            console.error(`Помилка читання maFile для ${account.login}:`, maFileResult.error);
            showMessage(`❌ Помилка читання maFile для ${account.login}: ${maFileResult.error}`, 'error');
            return;
        }
        
        const { sharedSecret, identitySecret } = maFileResult;

        console.log(`Logging in as ${account.login}...`);
        await tradeManager.login(account.login, account.password, SteamTotp.generateAuthCode(sharedSecret), identitySecret);
        console.log(`Logged in as ${account.login}.`);
        
        // Приховуємо ВСІ повідомлення про завантаження після успішного входу
        hideLoadingMessages();
        
        // Показуємо повідомлення про успішний вхід
        showMessage(`✅ Успішно увійшли як ${account.name || account.login}`, 'success');
        
        loadTrades();
    } catch (e) {
        console.error(`Failed to log in as ${account.login}:`, e);
        
        // Приховуємо повідомлення про завантаження при помилці
        hideLoadingMessages();
        
        // Показуємо повідомлення про помилку
        showMessage(`❌ Помилка входу: ${e.message}`, 'error');
        
        // Повертаємо інтерфейс логіну при помилці
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('account-info').style.display = 'none';
    }
    // ВИДАЛЕНО автоматичний перехід до наступного акаунту
    // setTimeout(() => loginToNextAccount(accounts, index + 1), 5000); 
}

// Завантажуємо акаунти і налаштовуємо інтерфейс, але НЕ логінимось автоматично
window.onload = async () => {
    // Завантажуємо список акаунтів у селект
    const accountSelect = document.getElementById('account-select');
    
    // Встановлюємо стан завантаження
    accountSelect.className = 'with-icon loading';
    accountSelect.innerHTML = '<option value="">⏳ Завантаження акаунтів...</option>';
    
    try {
        const data = await ipcRenderer.invoke('get-accounts-data');
        const accounts = data.accounts;
        
        // Очищуємо селект
        accountSelect.innerHTML = '';
        
        if (accounts && accounts.length > 0) {
            // Додаємо опцію "Оберіть акаунт"
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '🎯 Оберіть акаунт для логіну';
            accountSelect.appendChild(defaultOption);
            
            // Додаємо всі акаунти з красивими емодзі
            accounts.forEach((account, index) => {
                const option = document.createElement('option');
                option.value = account.login;
                
                // Додаємо емодзі та форматуємо текст
                const accountNumber = `#${index + 1}`;
                const accountName = account.name || account.login;
                const primeStatus = account.prime ? '👑' : '⚡';
                const farmingStatus = account.farming ? '🌱' : '💤';
                
                option.textContent = `${primeStatus} ${farmingStatus} ${accountNumber} ${accountName}`;
                option.title = `Login: ${account.login} | Prime: ${account.prime ? 'Так' : 'Ні'} | Farming: ${account.farming ? 'Так' : 'Ні'}`;
                
                accountSelect.appendChild(option);
            });
            
            // Встановлюємо готовий стан
            accountSelect.className = 'with-icon ready';
            console.log(`Завантажено ${accounts.length} акаунтів у селект`);
        } else {
            // Немає акаунтів
            accountSelect.innerHTML = '<option value="">❌ Акаунти не знайдено</option>';
            accountSelect.className = 'with-icon empty';
        }
    } catch (error) {
        console.error('Помилка при завантаженні акаунтів:', error);
        accountSelect.innerHTML = '<option value="">🚫 Помилка завантаження</option>';
        accountSelect.className = 'with-icon error';
    }
    
    // Завантажуємо історію
    loadAndRenderHistory();
    
    // Налаштовуємо обробник подій для нових оферів
    tradeManager.on('newOffer', offer => {
        console.log('New offer');
        loadTrades();
    });
};

async function updateLastDropInfo(accountLogin) {
    try {
        const data = await ipcRenderer.invoke('get-accounts-data');
        const accounts = data.accounts;
        const inventory = JSON.parse(fs.readFileSync(path.join(__dirname, 'inventories', `${accountLogin}_730.json`)));

        inventory.sort((a, b) => new Date(b.acquired_date) - new Date(a.acquired_date));
        const lastDrop = inventory[0];
        const imageUrl = lastDrop.getImageURL ? lastDrop.getImageURL() : `https://community.cloudflare.steamstatic.com/economy/image/${lastDrop.icon_url}`;

        tradeManager.getItemPrice(730, lastDrop.market_hash_name)
            .then(price => {
                const accountIndex = accounts.findIndex(acc => acc.login === accountLogin);
                if (accountIndex !== -1) {
                    accounts[accountIndex].lastDrop = lastDrop.market_hash_name;
                    accounts[accountIndex].lastDropPrice = price.lowest_price;
                    accounts[accountIndex].lastDropImageUrl = imageUrl;
                    // Зберігаємо через IPC (потрібно додати обробник)
                    ipcRenderer.invoke('save-accounts-data', { accounts });
                    render();
                }
            })
            .catch(err => {
                console.error('Failed to get item price:', err);
            });
    } catch (error) {
        console.error('Помилка оновлення інформації про дроп:', error);
    }
}