const mongoose = require('mongoose')

var serverdataSchema = mongoose.Schema({
    _id: { type: String, required: true },
    lang: String,
    xp: Number,
    level: Number,
    thismin: Number,
    partner: Boolean,
    verified: Boolean,
    theme: {
        red: String,
        yellow: String,
        lime: String,
        normal: String
    }
})

module.exports = mongoose.model('serverdata', serverdataSchema)