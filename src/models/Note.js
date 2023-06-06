import { Schema, model } from "mongoose";

const shema = new Schema({
    title: {
        type: String,
        required:true
    },
    description: {
        type: String
    }
}, {
    timestamps: true
})

export default model('Note',shema)