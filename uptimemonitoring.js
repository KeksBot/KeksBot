const https = require('https');

module.exports = function uptimemonitoring(uptimeurl) {

    https.get(uptimeurl)
    setInterval(() => {
        https.get(uptimeurl)
    }, 1000 * 30)

}