import mongoose from 'mongoose'
import { dbpath } from '../config.json'

export default async function() {
    await mongoose.connect(dbpath)
    return mongoose
}