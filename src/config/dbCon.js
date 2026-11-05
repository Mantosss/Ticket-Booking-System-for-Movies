const mongoose = require("mongoose");

const dbConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB Connected Successfully");
    } catch (error) {
        console.log("Database Connection Error:", error.message);
        process.exit(1);
    }
};

module.exports = dbConnect;