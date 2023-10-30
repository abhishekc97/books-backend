const mongoose = require("mongoose");

function connectToMongo() {
    mongoose
        .connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then(() => {
            console.log("Successfully connected to MongoDB ");
        })
        .catch((err) => {
            console.log("Could not connect to MongoDB" + err);
        });
}
module.exports = connectToMongo;
