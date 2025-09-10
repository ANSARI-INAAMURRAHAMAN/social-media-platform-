const mongoose = require('mongoose');

// Set strictQuery to false to suppress the deprecation warning
mongoose.set('strictQuery', false);

// Use environment variable for MongoDB connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost/codeial_development';
mongoose.connect(mongoURI);

const db = mongoose.connection;

db.on('error', console.error.bind(console, "Error connecting to MongoDB"));


db.once('open', function(){
    console.log('Connected to Database :: MongoDB');
});


module.exports = db;