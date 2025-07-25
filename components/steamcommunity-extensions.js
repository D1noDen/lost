const SteamCommunity = require('steamcommunity');

// Розширення SteamCommunity для додавання методу acknowledgeTradeProtection
SteamCommunity.prototype.acknowledgeTradeProtection = function(callback) {
    this.httpRequestPost({
        uri: 'https://steamcommunity.com/trade/new/acknowledge',
        form: {
            sessionid: this.getSessionID(),
            message: 1
        }
    }, (err, res, body) => {
        if (err) {
            return callback && callback(err);
        }

        callback && callback(null);
    }, 'steamcommunity');
};

module.exports = SteamCommunity;
