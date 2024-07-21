const mongoose = require('mongoose');
const Schema =  mongoose.Schema;

const userSchema = new mongoose.Schema({
    username: {type: String, required: true, min: 4, unique: true},
    password: {type: String, required: true}
});

const UsersModel = mongoose.model("users", userSchema);

module.exports = UsersModel 
