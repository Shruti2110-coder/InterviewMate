const mongoose = require('mongoose');

async function connectionToDB() {
    try {
       await  mongoose.connect(process.env.MONGO_URI)
       console.log("connected to database successfully");
    }
catch (error) {
    console.error("error while connecting to database", error);
    process.exit(1);
}
}

module.exports = connectionToDB;