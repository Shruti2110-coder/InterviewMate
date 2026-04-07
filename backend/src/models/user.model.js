const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: [true, "username already exists"]
    },
    email: {
        type: String,
        required: true,
        unique: [true, "email already exists"]
    },
   password: {
    type: String,
    required: true  
   } 
})

const User = mongoose.model('User', userSchema);

module.exports = User;