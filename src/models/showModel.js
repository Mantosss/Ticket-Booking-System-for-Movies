
const mongoose = require("mongoose");

const showSchema = new mongoose.Schema(
    {
        movie: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Movie",
            required: true
        },

        theater: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Theater",
            required: true
        },

        screenNumber: {
            type: Number,
            required: true,
            min: 1
        },

        showDateTime: {
            type: Date,
            required: true
        },

        totalSeats: {
            type: Number,
            required: true,
            min: 1
        },

        availableSeats: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

// Validate available seats before saving
showSchema.pre("validate", function () {
    if (this.availableSeats > this.totalSeats) {
        throw new Error(
            "Available seats cannot exceed total seats."
        );
    }
});

const Show = mongoose.model("Show", showSchema);

module.exports = Show;
