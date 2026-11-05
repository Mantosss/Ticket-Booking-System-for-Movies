
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

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

        show: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Show",
            required: true,
            index: true
        },

        ticketCount: {
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: "Ticket count must be a whole number."
            }
        },

        bookingDate: {
            type: Date,
            default: Date.now
        },

        status: {
            type: String,
            enum: ["Confirmed", "Cancelled"],
            default: "Confirmed",
            index: true
        }
    },
    {
        timestamps: true
    }
);

// Improve booking history queries
bookingSchema.index({ user: 1, bookingDate: -1 });

// Improve admin booking reports
bookingSchema.index({ movie: 1, theater: 1, show: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
