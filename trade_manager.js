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
}
module.exports = TradeManager;