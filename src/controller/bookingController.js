
const mongoose = require("mongoose");

const Booking = require("../models/bookingModel");
const Show = require("../models/showModel");

class BookingController {

    // Display available shows for a selected movie
    async getAvailableShows(req, res) {
        try {
            const { movieId } = req.params;

            if (!mongoose.isValidObjectId(movieId)) {
                return res.status(400).render("error", {
                    statusCode: 400,
                    message: "Invalid movie ID."
                });
            }

            const shows = await Show.find({
                movie: movieId,
                showDateTime: { $gt: new Date() },
                availableSeats: { $gt: 0 }
            })
                .populate("movie", "name genre language duration poster")
                .populate("theater", "name location")
                .sort({ showDateTime: 1 });

            if (!shows.length) {
                return res.status(404).render("error", {
                    statusCode: 404,
                    message: "No upcoming shows are currently available for this movie."
                });
            }

            return res.render("movies/movieDetails", {
                title: "Available Shows",
                shows,
                movie: shows[0].movie
            });

        } catch (error) {
            console.error("Available Shows Error:", error);

            return res.status(500).render("error", {
                statusCode: 500,
                message: "Unable to load available shows."
            });
        }
    }


    // Display the booking page for a selected show
    async getBookingPage(req, res) {
        try {
            const { showId } = req.params;

            if (!mongoose.isValidObjectId(showId)) {
                return res.status(400).render("error", {
                    statusCode: 400,
                    message: "Invalid show ID."
                });
            }

            const show = await Show.findOne({
                _id: showId,
                showDateTime: { $gt: new Date() },
                availableSeats: { $gt: 0 }
            })
                .populate("movie", "name genre language duration poster")
                .populate("theater", "name location");

            if (!show) {
                return res.status(404).render("error", {
                    statusCode: 404,
                    message: "This show is unavailable or fully booked."
                });
            }

            return res.render("user/bookTickets", {
                title: "Book Tickets",
                show
            });

        } catch (error) {
            console.error("Get Booking Page Error:", error);

            return res.status(500).render("error", {
                statusCode: 500,
                message: "Unable to load the booking page."
            });
        }
    }


    // Book tickets
    async bookTickets(req, res) {
        let session;

        try {
            const { showId, ticketCount } = req.body;
            const userId = req.session.user.id;

            const count = Number(ticketCount);

            if (
                !mongoose.isValidObjectId(showId) ||
                !Number.isInteger(count) ||
                count < 1
            ) {
                return res.status(400).render("error", {
                    statusCode: 400,
                    message: "Please select a valid show and ticket quantity."
                });
            }

            session = await mongoose.startSession();

            let bookingId;

            await session.withTransaction(async () => {

                // Reserve seats only when enough seats are available
                const show = await Show.findOneAndUpdate(
                    {
                        _id: showId,
                        showDateTime: { $gt: new Date() },
                        availableSeats: { $gte: count }
                    },
                    {
                        $inc: { availableSeats: -count }
                    },
                    {
                        new: true,
                        session
                    }
                );

                if (!show) {
                    throw new Error("NOT_ENOUGH_SEATS");
                }

                const booking = new Booking({
                    user: userId,
                    movie: show.movie,
                    theater: show.theater,
                    show: show._id,
                    ticketCount: count,
                    bookingDate: new Date(),
                    status: "Confirmed"
                });

                await booking.save({ session });

                bookingId = booking._id;
            });

            req.flash("success", "Tickets booked successfully.");

            return res.redirect(`/bookings/details/${bookingId}`);

        } catch (error) {
            console.error("Book Tickets Error:", error);

            if (error.message === "NOT_ENOUGH_SEATS") {
                return res.status(400).render("error", {
                    statusCode: 400,
                    message: "The show is unavailable or does not have enough seats."
                });
            }

            return res.status(500).render("error", {
                statusCode: 500,
                message: "Unable to complete your booking."
            });

        } finally {
            if (session) {
                await session.endSession();
            }
        }
    }


    // Display booking details
    async getBookingDetails(req, res) {
        try {
            const { id } = req.params;

            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).render("error", {
                    statusCode: 400,
                    message: "Invalid booking ID."
                });
            }

            const booking = await Booking.findOne({
                _id: id,
                user: req.session.user.id
            })
                .populate("movie", "name genre language")
                .populate("theater", "name location")
                .populate("show", "screenNumber showDateTime");

            if (!booking) {
                return res.status(404).render("error", {
                    statusCode: 404,
                    message: "Booking not found."
                });
            }

            return res.render("user/bookingDetails", {
                title: "Booking Details",
                booking
            });

        } catch (error) {
            console.error("Booking Details Error:", error);

            return res.status(500).render("error", {
                statusCode: 500,
                message: "Unable to load booking details."
            });
        }
    }


    // Cancel a booking and restore available seats
    async cancelBooking(req, res) {
        let session;

        try {
            const { id } = req.params;
            const userId = req.session.user.id;

            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).render("error", {
                    statusCode: 400,
                    message: "Invalid booking ID."
                });
            }

            session = await mongoose.startSession();

            await session.withTransaction(async () => {

                // Cancel only a confirmed booking belonging to this user
                const booking = await Booking.findOneAndUpdate(
                    {
                        _id: id,
                        user: userId,
                        status: "Confirmed"
                    },
                    {
                        $set: { status: "Cancelled" }
                    },
                    {
                        new: true,
                        session
                    }
                );

                if (!booking) {
                    throw new Error("BOOKING_NOT_FOUND");
                }

                // Restore the cancelled ticket seats
                const show = await Show.findOneAndUpdate(
                    {
                        _id: booking.show,
                        $expr: {
                            $lte: [
                                { $add: ["$availableSeats", booking.ticketCount] },
                                "$totalSeats"
                            ]
                        }
                    },
                    {
                        $inc: {
                            availableSeats: booking.ticketCount
                        }
                    },
                    {
                        new: true,
                        session
                    }
                );

                if (!show) {
                    throw new Error("SHOW_NOT_FOUND");
                }
            });

            req.flash("success", "Booking cancelled and seats restored.");

            return res.redirect("/bookings/history");

        } catch (error) {
            console.error("Cancel Booking Error:", error);

            if (
                error.message === "BOOKING_NOT_FOUND" ||
                error.message === "SHOW_NOT_FOUND"
            ) {
                return res.status(404).render("error", {
                    statusCode: 404,
                    message: "Booking could not be cancelled."
                });
            }

            return res.status(500).render("error", {
                statusCode: 500,
                message: "Unable to cancel booking."
            });

        } finally {
            if (session) {
                await session.endSession();
            }
        }
    }


    // Display logged-in user's booking history
    async getBookingHistory(req, res) {
        try {
            const bookings = await Booking.find({
                user: req.session.user.id
            })
                .populate("movie", "name genre language")
                .populate("theater", "name location")
                .populate("show", "screenNumber showDateTime")
                .sort({ bookingDate: -1 });

            return res.render("user/bookingHistory", {
                title: "My Booking History",
                bookings
            });

        } catch (error) {
            console.error("Booking History Error:", error);

            return res.status(500).render("error", {
                statusCode: 500,
                message: "Unable to load booking history."
            });
        }
    }


    // Admin: Display all bookings
    async getAllBookings(req, res) {
        try {
            const bookings = await Booking.find()
                .populate("user", "name email")
                .populate("movie", "name")
                .populate("theater", "name location")
                .populate("show", "screenNumber showDateTime")
                .sort({ bookingDate: -1 });

            return res.render("admin/bookings", {
                title: "All Bookings",
                bookings
            });

        } catch (error) {
            console.error("All Bookings Error:", error);

            return res.status(500).render("error", {
                statusCode: 500,
                message: "Unable to load bookings."
            });
        }
    }
}

module.exports = new BookingController();
