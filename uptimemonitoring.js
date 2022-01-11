const https = require('https');

module.exports = function uptimemonitoring(uptimeurl, client) {
    https.get(uptimeurl.replace('PING', client.ws.ping))
    setInterval(() => {
        https.get(uptimeurl.replace('PING', client.ws.ping))
    }, 1000 * 60)

}