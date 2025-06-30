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
        container.innerHTML = '<p>No trade history.</p>';
        return;
    }

    history.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'trade-offer';

        const itemsToGiveHtml = entry.itemsGiven.map(renderItem).join('');
        const itemsToReceiveHtml = entry.itemsReceived.map(renderItem).join('');
        const tradeDate = new Date(entry.date).toLocaleString();
        const headerClass = entry.status.toLowerCase();
        const statusText = entry.status === 'Accepted' ? 'Прийнято' : 'Відхилено';

        div.innerHTML = `
            <div class="trade-header ${headerClass}">
                [${statusText}] Угода з ${entry.partnerId} - ${tradeDate}
            </div>
            <div class="trade-body">
                <div class="trade-items-section">
                    <h4>Ви віддали</h4>
                    <div class="items-container">
                        ${itemsToGiveHtml || '<p>Нічого</p>'}
                    </div>
                </div>
                <div class="trade-items-section">
                    <h4>Ви отримали</h4>
                    <div class="items-container">
                        ${itemsToReceiveHtml || '<p>Нічого</p>'}
                    </div>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function login() {
    const accountSelect = document.getElementById('account-select');
    selectedAccountName = accountSelect.value;
    const accounts = JSON.parse(fs.readFileSync(path.join(__dirname, 'accounts.json'))).accounts;
    const account = accounts.find(acc => acc.login === selectedAccountName);
    if (account) {
        const maFilePath = path.join(__dirname, 'maFiles', `${account.login}.maFile`);
        try {
            const maFile = JSON.parse(fs.readFileSync(maFilePath));
            const identitySecret = maFile.identity_secret;
            const sharedSecret = maFile.shared_secret;

            tradeManager.login(account.login, account.password, SteamTotp.generateAuthCode(sharedSecret), identitySecret)
                .then(() => {
                    document.getElementById('login-container').style.display = 'none';
                    const accountInfoDiv = document.getElementById('account-info');
                    accountInfoDiv.style.display = 'block';
                    document.getElementById('current-account-name').textContent = account.name || account.login;

                    loadTrades();
                    loadAndRenderHistory();
                })
                .catch(err => {
                    alert('Login failed: ' + err.message);
                });
        } catch (e) {
            alert(`Error reading maFile for ${account.login}: ${e.message}`);
        }
    } else {
        alert('Account not found');
    }
}

function logout() {
    tradeManager.disconnect();
    document.getElementById('login-container').style.display = 'block';
    const accountInfoDiv = document.getElementById('account-info');
    accountInfoDiv.style.display = 'none';
    document.getElementById('current-account-name').textContent = '';
    
    const container = document.getElementById('trades-container');
    container.innerHTML = '';
    activeOffers = [];
    selectedAccountName = null;
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
            // Flatten the array of arrays and remove duplicates
            const allOffers = [].concat(...offerGroups);
            const uniqueOffers = allOffers.filter((offer, index, self) =>
                index === self.findIndex((o) => o.id === offer.id)
            );

            activeOffers = uniqueOffers;
            renderTrades(uniqueOffers);
        })
        .catch(err => {
            console.error('Failed to get trades:', err);
            alert('Failed to get trades: ' + err.message);
        });
}

function renderItem(item) {
    const nameColor = item.name_color ? `#${item.name_color}` : '#f1f1f1';
    const imageUrl = item.getImageURL ? item.getImageURL() : `https://community.cloudflare.steamstatic.com/economy/image/${item.icon_url}`;
    
    return `
        <div class="item-card">
            <img src="${imageUrl}" alt="${item.name}">
            <span class="item-name" style="color: ${nameColor};">${item.name}</span>
        </div>
    `;
}

function renderTrades(offers) {
    const container = document.getElementById('trades-container');
    container.innerHTML = '';

    if (offers.length === 0) {
        container.innerHTML = '<p>No active trade offers.</p>';
        return;
    }

    offers.forEach(offer => {
        const div = document.createElement('div');
        div.className = 'trade-offer';

        const itemsToGiveHtml = offer.itemsToGive.map(renderItem).join('');
        const itemsToReceiveHtml = offer.itemsToReceive.map(renderItem).join('');

        div.innerHTML = `
            <div class="trade-header">
                Offer from: ${offer.partner.getSteamID64()}
            </div>
            <div class="trade-body">
                <div class="trade-items-section">
                    <h4>You Give</h4>
                    <div class="items-container">
                        ${itemsToGiveHtml || '<p>Nothing</p>'}
                    </div>
                </div>
                <div class="trade-items-section">
                    <h4>You Receive</h4>
                    <div class="items-container">
                        ${itemsToReceiveHtml || '<p>Nothing</p>'}
                    </div>
                </div>
            </div>
            <div class="trade-actions">
                <button class="accept" onclick="acceptTrade('${offer.id}')">Accept</button>
                <button class="decline" onclick="declineTrade('${offer.id}')">Decline</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function acceptTrade(offerId) {
    const offer = activeOffers.find(o => o.id === offerId);
    if (offer) {
        tradeManager.acceptOffer(offer)
            .then(() => {
                alert('Trade accepted successfully!');
                const historyEntry = {
                    id: offer.id,
                    partnerId: offer.partner.getSteamID64(),
                    status: 'Accepted',
                    date: new Date().toISOString(),
                    itemsGiven: offer.itemsToGive.map(item => ({ name: item.name, icon_url: item.icon_url, name_color: item.name_color })),
                    itemsReceived: offer.itemsToReceive.map(item => ({ name: item.name, icon_url: item.icon_url, name_color: item.name_color }))
                };
                saveToHistory(historyEntry);
                loadTrades();
                loadAndRenderHistory();
            })
            .catch(err => {
                alert('Failed to accept trade: ' + err.message);
            });
    }
}

function declineTrade(offerId) {
    const offer = activeOffers.find(o => o.id === offerId);
    if (offer) {
        tradeManager.declineOffer(offer)
            .then(() => {
                alert('Trade declined successfully!');
                const historyEntry = {
                    id: offer.id,
                    partnerId: offer.partner.getSteamID64(),
                    status: 'Declined',
                    date: new Date().toISOString(),
                    itemsGiven: offer.itemsToGive.map(item => ({ name: item.name, icon_url: item.icon_url, name_color: item.name_color })),
                    itemsReceived: offer.itemsToReceive.map(item => ({ name: item.name, icon_url: item.icon_url, name_color: item.name_color }))
                };
                saveToHistory(historyEntry);
                loadTrades();
                loadAndRenderHistory();
            })
            .catch(err => {
                alert('Failed to decline trade: ' + err.message);
            });
    }
}

async function loginToNextAccount(accounts, index = 0) {
    if (index >= accounts.length) {
        console.log('All accounts processed.');
        return;
    }

    const account = accounts[index];
    const { shared_secret: sharedSecret, identity_secret: identitySecret } = JSON.parse(fs.readFileSync(path.join(__dirname, 'maFiles', `${account.login}.maFile`), 'utf8'));

    try {
        console.log(`Logging in as ${account.login}...`);
        await tradeManager.login(account.login, account.password, SteamTotp.generateAuthCode(sharedSecret), identitySecret);
        console.log(`Logged in as ${account.login}.`);
        loadTrades();
    } catch (e) {
        console.error(`Failed to log in as ${account.login}:`, e);
    } finally {
        // Wait for a bit before logging into the next account to avoid rate limits.
        setTimeout(() => loginToNextAccount(accounts, index + 1), 5000); 
    }
}

window.onload = () => {
    const accountsPath = path.join(__dirname, 'accounts.json');
    if (!fs.existsSync(accountsPath)) {
        alert('accounts.json not found!');
        return;
    }
    const accounts = JSON.parse(fs.readFileSync(accountsPath)).accounts;
    const accountSelect = document.getElementById('account-select');
    accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.login;
        option.textContent = account.name || account.login;
        accountSelect.appendChild(option);
    });

    tradeManager.on('newOffer', offer => {
        console.log('New offer');
        loadTrades();
    });

    document.getElementById('login-container').style.display = 'none';
    const accountInfoDiv = document.getElementById('account-info');
    accountInfoDiv.style.display = 'block';
    document.getElementById('current-account-name').textContent = accounts[0].name || accounts[0].login;

    loginToNextAccount(accounts);

    loadAndRenderHistory();
};