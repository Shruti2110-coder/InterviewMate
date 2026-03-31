const mongoose = require('mongoose');

async function connectionToDB() {
    try {
       await  mongoose.connect(process.env.MONGO_URI)
 console.log("connected to database successfully");  
    }
catch (error) {
    console.log("error while connecting to database", error);   
}
}

module.exports = connectionToDB;