const mongoose = require('mongoose')

var serverdataSchema = mongoose.Schema({
    _id: { type: String, required: true },
    lang: String,
    xp: Number,
    level: Number,
    thismin: Number,
    partner: Number, /*
        2: Antrag gestellt
        1: Partner
        0: Kein Partner/Antrag
        -1: Kein Partner/blockiert
    */
    verified: Boolean,
    theme: {
        red: String,
        yellow: String,
        lime: String,
        normal: String
    }
}, { strict: false })

module.exports = mongoose.model('serverdata', serverdataSchema)