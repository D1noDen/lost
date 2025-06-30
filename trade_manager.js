const EventEmitter = require('events');
const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');
const TradeOfferManager = require('steam-tradeoffer-manager');

class TradeManager extends EventEmitter {
    constructor() {
        super();
        this.client = new SteamUser();
        this.community = new SteamCommunity();
        this.manager = new TradeOfferManager({
            steam: this.client,
            community: this.community,
            language: 'en'
        });

        this._setupEventHandlers();
    }

    _setupEventHandlers() {
        this.client.on('loggedOn', () => {
            console.log('Logged into Steam');
            this.client.setPersona(SteamUser.EPersonaState.Online);
        });

        this.client.on('webSession', (sessionID, cookies) => {
            this.manager.setCookies(cookies, (err) => {
                if (err) {
                    if (this.loginReject) this.loginReject(err);
                    return;
                }
                console.log('Got API key:', this.manager.apiKey);

                this.community.setCookies(cookies);
                this.community.startConfirmationChecker(10000, this.identitySecret);

                this.manager.on('newOffer', offer => {
                    this.emit('newOffer', offer);
                });

                if (this.loginResolve) this.loginResolve();
            });
        });

        this.client.on('error', (err) => {
            console.error('Steam client error:', err);
            if (this.loginReject) this.loginReject(err);
            this.emit('error', err);
        });

        this.client.on('disconnected', (eresult, msg) => {
            console.log('Logged off:', eresult, msg);
            this.emit('disconnected', eresult, msg);
        });
    }

    login(accountName, password, twoFactorCode, identitySecret) {
        this.identitySecret = identitySecret; // Store for confirmation checker

        return new Promise((resolve, reject) => {
            this.loginResolve = resolve;
            this.loginReject = reject;

            this.client.logOn({
                accountName,
                password,
                twoFactorCode: twoFactorCode
            });
        });
    }

    disconnect() {
        this.client.logOff();
        // this.community.stopConfirmationChecker(); // No longer needed
        console.log('Disconnected.');
    }

    getOffers() {
        return new Promise((resolve, reject) => {
            this.manager.getOffers(TradeOfferManager.EOfferFilter.ActiveOnly, (err, sent, received) => {
                if (err) {
                    return reject(err);
                }
                // Return offers we've received, as those are the ones we can act on.
                resolve(received || []);
            });
        });
    }

    getOffer(offerId) {
        return new Promise((resolve, reject) => {
            this.manager.getOffer(offerId, (err, offer) => {
                if (err) {
                    return reject(err);
                }
                resolve(offer);
            });
        });
    }

    acceptOffer(offer) {
        return new Promise((resolve, reject) => {
            offer.accept((err, status) => {
                if (err) {
                    return reject(err);
                }

                if (status === 'pending') {
                    console.log(`Offer #${offer.id} is pending confirmation. Attempting to confirm...`);
                    this.community.checkConfirmations(); // Check for confirmations immediately
                    resolve('pending');
                } else if (status === 'accepted') {
                    console.log(`Offer #${offer.id} accepted immediately (no confirmation needed).`);
                    resolve('accepted');
                } else {
                    reject(new Error(`Offer #${offer.id} has an unexpected status: ${status}`));
                }
            });
        });
    }

    declineOffer(offer) {
        return new Promise((resolve, reject) => {
            offer.decline((err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }

    getInventory(appID = 730, contextID = 2) {
        return new Promise((resolve, reject) => {
            if (!this.client.steamID) {
                return reject(new Error("Not logged in"));
            }
            this.community.getUserInventoryContents(this.client.steamID, appID, contextID, true, (err, inventory) => {
                if (err) {
                    return reject(err);
                }
                resolve(inventory || []);
            });
        });
    }

    getItemPrice(appID, marketHashName) {
        return new Promise((resolve, reject) => {
            // Використовуємо HTTP запит до Steam Market API
            const https = require('https');
            const url = `https://steamcommunity.com/market/priceoverview/?currency=1&appid=${appID}&market_hash_name=${encodeURIComponent(marketHashName)}`;
            
            https.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.success) {
                            resolve({
                                lowest_price: response.lowest_price || 'N/A',
                                median_price: response.median_price || 'N/A'
                            });
                        } else {
                            resolve({ lowest_price: 'N/A', median_price: 'N/A' });
                        }
                    } catch (e) {
                        resolve({ lowest_price: 'N/A', median_price: 'N/A' });
                    }
                });
            }).on('error', (err) => {
                console.log('Price fetch error:', err);
                resolve({ lowest_price: 'N/A', median_price: 'N/A' });
            });
        });
    }

    async getLastDrop(accountLogin) {
        try {
            console.log(`[getLastDrop] Початок для ${accountLogin}`);
            const inventory = await this.getInventory(730, 2); // CS:GO
            console.log(`[getLastDrop] Отримано інвентар розміром: ${inventory.length} предметів`);
            
            if (inventory.length === 0) {
                console.log(`[getLastDrop] Inventory is empty for ${accountLogin}`);
                return null;
            }

            // Сортуємо за датою отримання, щоб знайти найновіший предмет
            const sortedInventory = inventory.sort((a, b) => {
                const dateA = new Date(a.acquired_date || 0);
                const dateB = new Date(b.acquired_date || 0);
                return dateB - dateA;
            });

            const lastDrop = sortedInventory[0];
            console.log(`[getLastDrop] Останній предмет:`, {
                name: lastDrop.market_hash_name,
                date: lastDrop.acquired_date,
                icon_url: lastDrop.icon_url
            });

            const imageUrl = lastDrop.getImageURL ? lastDrop.getImageURL() : 
                            `https://community.cloudflare.steamstatic.com/economy/image/${lastDrop.icon_url}`;

            try {
                console.log(`[getLastDrop] Отримуємо ціну для ${lastDrop.market_hash_name}`);
                const priceInfo = await this.getItemPrice(730, lastDrop.market_hash_name);
                console.log(`[getLastDrop] Отримано ціну:`, priceInfo);
                
                const result = {
                    name: lastDrop.market_hash_name,
                    imageUrl: imageUrl,
                    price: priceInfo.lowest_price || '0',
                    date: lastDrop.acquired_date
                };
                
                console.log(`[getLastDrop] Фінальний результат:`, result);
                return result;
            } catch (priceErr) {
                console.error(`[getLastDrop] Failed to get price for ${lastDrop.market_hash_name}:`, priceErr);
                const result = {
                    name: lastDrop.market_hash_name,
                    imageUrl: imageUrl,
                    price: 'N/A',
                    date: lastDrop.acquired_date
                };
                console.log(`[getLastDrop] Результат без ціни:`, result);
                return result;
            }
        } catch (err) {
            console.error(`[getLastDrop] Failed to get inventory for ${accountLogin}:`, err);
            return null;
        }
    }

    async getLastDrops(accountLogin, count = 2) {
        try {
            console.log(`[getLastDrops] Початок для ${accountLogin}, отримуємо ${count} дропів`);
            const inventory = await this.getInventory(730, 2); // CS:GO
            console.log(`[getLastDrops] Отримано інвентар розміром: ${inventory.length} предметів`);
            
            if (inventory.length === 0) {
                console.log(`[getLastDrops] Inventory is empty for ${accountLogin}`);
                return [];
            }

            // Сортуємо за датою отримання, щоб знайти найновіші предмети
            const sortedInventory = inventory.sort((a, b) => {
                const dateA = new Date(a.acquired_date || 0);
                const dateB = new Date(b.acquired_date || 0);
                return dateB - dateA;
            });

            // Беремо кількість предметів, яку запросили
            const lastDrops = sortedInventory.slice(0, Math.min(count, inventory.length));
            console.log(`[getLastDrops] Обрано ${lastDrops.length} останніх предметів`);

            const results = [];

            // Обробляємо кожен предмет
            for (let i = 0; i < lastDrops.length; i++) {
                const drop = lastDrops[i];
                console.log(`[getLastDrops] Обробка предмету ${i + 1}:`, {
                    name: drop.market_hash_name,
                    date: drop.acquired_date,
                    icon_url: drop.icon_url
                });

                const imageUrl = drop.getImageURL ? drop.getImageURL() : 
                                `https://community.cloudflare.steamstatic.com/economy/image/${drop.icon_url}`;

                try {
                    console.log(`[getLastDrops] Отримуємо ціну для ${drop.market_hash_name}`);
                    const priceInfo = await this.getItemPrice(730, drop.market_hash_name);
                    console.log(`[getLastDrops] Отримано ціну:`, priceInfo);
                    
                    const result = {
                        name: drop.market_hash_name,
                        imageUrl: imageUrl,
                        price: priceInfo.lowest_price || '$0.00',
                        date: drop.acquired_date
                    };
                    
                    results.push(result);
                    console.log(`[getLastDrops] Додано предмет ${i + 1}:`, result);
                } catch (priceErr) {
                    console.error(`[getLastDrops] Failed to get price for ${drop.market_hash_name}:`, priceErr);
                    const result = {
                        name: drop.market_hash_name,
                        imageUrl: imageUrl,
                        price: '$0.00',
                        date: drop.acquired_date
                    };
                    results.push(result);
                    console.log(`[getLastDrops] Додано предмет ${i + 1} без ціни:`, result);
                }
            }
            
            console.log(`[getLastDrops] Фінальний результат для ${accountLogin}:`, results);
            return results;
        } catch (err) {
            console.error(`[getLastDrops] Failed to get inventory for ${accountLogin}:`, err);
            return [];
        }
    }
}
module.exports = TradeManager;