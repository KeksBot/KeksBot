const mongoose = require('mongoose')

var userdataSchema = mongoose.Schema({
    _id: { type: String, required: true },
    xp: Number,
    level: Number,
    cookies: Number,
    giftdm: Number,
    thismin: Number,
    badges: {
        partner: Number,
        verified: Boolean,
        team: Boolean,
        dev: Boolean,
        mod: Boolean,
        beta: Boolean
    },
    banned: {
        time: Number,
        reason: String
    },
    tan: String
}, { strict: false })

module.exports = mongoose.model('userdata', userdataSchema)