import { Schema, model } from 'mongoose'

var userdataSchema = Schema({
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
    battle: {
        skills: [
            {
                _id: false,
                name: String,
                value: Number
            }
        ],
        ready: Boolean,
        priority: String,
        currentHP: Number,
        healTimestamp: Number,
        inventory: [{
            id: String,
            count: Number,
        }],
        attacks: [String],
    },
    tan: String
}, { strict: false })

export default model('userdata', userdataSchema)