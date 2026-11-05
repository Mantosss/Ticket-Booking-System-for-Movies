
const mongoose = require("mongoose");

const theaterSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        location: {
            type: String,
            required: true,
            trim: true
        },

        numberOfScreens: {
            type: Number,
            required: true,
            min: 1
        }
    },
    {
        timestamps: true
    }
);

const Theater = mongoose.model("Theater", theaterSchema);

module.exports = Theater;
