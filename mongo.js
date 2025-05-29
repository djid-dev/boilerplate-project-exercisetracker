require('dotenv').config();
const mongoose = require('mongoose');


mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err);
    });

const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
});

const User = mongoose.model('User', userSchema);



const exerciseSchema = new Schema({ 
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});

const Exercise = mongoose.model('Exercise', exerciseSchema);


module.exports = {
    User,
    Exercise
};
// This module exports the User and Exercise models for use in other parts of the application.