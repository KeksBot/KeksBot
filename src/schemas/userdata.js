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
        attacks: [String],
    },
    inventory: [{
        id: String,
        count: Number,
        metadata: Object,
        _id: false
    }],
    system: {
        user: String,
        bounduser: String,
        password: String,
        username: String,
        permissionLevel: Number,
        _id: false
    }
}, { strict: true })

export default model('userdata', userdataSchema)