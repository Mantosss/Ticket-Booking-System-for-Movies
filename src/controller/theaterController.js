
const mongoose = require("mongoose");

const Movie = require("../models/movieModel");
const Theater = require("../models/theaterModel");
const Show = require("../models/showModel");
const Booking = require("../models/bookingModel");

class TheaterController {

    // ==============================
    // GET ALL THEATERS
    // ==============================
    async getTheaters(req, res) {
        try {
            const theaters = await Theater.find().sort({ createdAt: -1 });

            return res.render("admin/theaters", {
                title: "Manage Theaters",
                theaters
            });
        } catch (error) {
            console.error("Get Theaters Error:", error);
            req.flash("error", "Unable to load theaters.");
            return res.redirect("/movies/admin/dashboard");
        }
    }

    // ==============================
    // ADD THEATER
    // ==============================
    async addTheater(req, res) {
        try {
            const { name, location, numberOfScreens } = req.body;
            const screens = Number(numberOfScreens);

            if (
                !name?.trim() ||
                !location?.trim() ||
                !Number.isInteger(screens) ||
                screens < 1
            ) {
                req.flash("error", "Please enter valid theater details.");
                return res.redirect("/theaters/admin/manage");
            }

            await Theater.create({
                name: name.trim(),
                location: location.trim(),
                numberOfScreens: screens
            });

            req.flash("success", "Theater added successfully.");
            return res.redirect("/theaters/admin/manage");

        } catch (error) {
            console.error("Add Theater Error:", error);
            req.flash("error", "Unable to add theater.");
            return res.redirect("/theaters/admin/manage");
        }
    }

    // ==============================
    // GET EDIT THEATER PAGE
    // ==============================
    async getEditTheater(req, res) {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                req.flash("error", "Invalid theater ID.");
                return res.redirect("/theaters/admin/manage");
            }

            const theater = await Theater.findById(req.params.id);

            if (!theater) {
                req.flash("error", "Theater not found.");
                return res.redirect("/theaters/admin/manage");
            }

            return res.render("admin/editTheater", {
                title: "Edit Theater",
                theater
            });

        } catch (error) {
            console.error("Get Edit Theater Error:", error);
            req.flash("error", "Unable to load theater.");
            return res.redirect("/theaters/admin/manage");
        }
    }

    // ==============================
    // UPDATE THEATER
    // ==============================
    async updateTheater(req, res) {
        try {
            const { name, location, numberOfScreens } = req.body;
            const screens = Number(numberOfScreens);

            if (!mongoose.isValidObjectId(req.params.id)) {
                req.flash("error", "Invalid theater ID.");
                return res.redirect("/theaters/admin/manage");
            }

            if (
                !name?.trim() ||
                !location?.trim() ||
                !Number.isInteger(screens) ||
                screens < 1
            ) {
                req.flash("error", "Please enter valid theater details.");
                return res.redirect(`/theaters/edit/${req.params.id}`);
            }

            const theater = await Theater.findById(req.params.id);

            if (!theater) {
                req.flash("error", "Theater not found.");
                return res.redirect("/theaters/admin/manage");
            }

            // Do not reduce screens below the highest scheduled screen.
            const highestScheduledScreen = await Show.findOne({
                theater: theater._id
            }).sort({ screenNumber: -1 });

            if (
                highestScheduledScreen &&
                screens < highestScheduledScreen.screenNumber
            ) {
                req.flash(
                    "error",
                    `This theater has a scheduled show on screen ${highestScheduledScreen.screenNumber}.`
                );
                return res.redirect(`/theaters/edit/${req.params.id}`);
            }

            theater.name = name.trim();
            theater.location = location.trim();
            theater.numberOfScreens = screens;

            await theater.save();

            req.flash("success", "Theater updated successfully.");
            return res.redirect("/theaters/admin/manage");

        } catch (error) {
            console.error("Update Theater Error:", error);
            req.flash("error", "Unable to update theater.");
            return res.redirect("/theaters/admin/manage");
        }
    }

    // ==============================
    // DELETE THEATER
    // ==============================
    async deleteTheater(req, res) {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                req.flash("error", "Invalid theater ID.");
                return res.redirect("/theaters/admin/manage");
            }

            const theater = await Theater.findById(req.params.id);

            if (!theater) {
                req.flash("error", "Theater not found.");
                return res.redirect("/theaters/admin/manage");
            }

            const existingShow = await Show.findOne({
                theater: theater._id
            });

            if (existingShow) {
                req.flash(
                    "error",
                    "Cannot delete this theater because it has scheduled shows."
                );
                return res.redirect("/theaters/admin/manage");
            }

            await Theater.findByIdAndDelete(theater._id);

            req.flash("success", "Theater deleted successfully.");
            return res.redirect("/theaters/admin/manage");

        } catch (error) {
            console.error("Delete Theater Error:", error);
            req.flash("error", "Unable to delete theater.");
            return res.redirect("/theaters/admin/manage");
        }
    }

    // ==============================
    // SHOW SCHEDULING PAGE
    // ==============================
    async getShowPage(req, res) {
        try {
            const [movies, theaters, shows] = await Promise.all([
                Movie.find().sort({ name: 1 }),
                Theater.find().sort({ name: 1 }),
                Show.find()
                    .populate("movie", "name duration")
                    .populate("theater", "name location")
                    .sort({ showDateTime: 1 })
            ]);

            return res.render("admin/shows", {
                title: "Manage Shows",
                movies,
                theaters,
                shows
            });

        } catch (error) {
            console.error("Get Show Page Error:", error);
            req.flash("error", "Unable to load show scheduling page.");
            return res.redirect("/movies/admin/dashboard");
        }
    }

    // ==============================
    // ADD SHOW
    // ==============================
    async addShow(req, res) {
        try {
            console.log("Show Form Data:", req.body);

            const {
                movie,
                theater,
                screenNumber,
                showDateTime,
                totalSeats
            } = req.body;

            const screen = Number(screenNumber);
            const seats = Number(totalSeats);

            // Validate required fields.
            if (
                !movie ||
                !theater ||
                !showDateTime ||
                !Number.isInteger(screen) ||
                !Number.isInteger(seats) ||
                screen < 1 ||
                seats < 1
            ) {
                return res.status(400).render("error", {
                    statusCode: 400,
                    message: "Please enter valid show details."
                });
            }

            // Validate ObjectIds.
            if (
                !mongoose.isValidObjectId(movie) ||
                !mongoose.isValidObjectId(theater)
            ) {
                return res.status(400).render("error", {
                    statusCode: 400,
                    message: "Invalid movie or theater selection."
                });
            }

            // Fetch selected movie and theater.
            const [movieData, theaterData] = await Promise.all([
                Movie.findById(movie),
                Theater.findById(theater)
            ]);

            if (!movieData || !theaterData) {
                return res.status(404).render("error", {
                    statusCode: 404,
                    message: "Selected movie or theater was not found."
                });
            }

            // Validate screen number.
            if (screen > Number(theaterData.numberOfScreens)) {
                return res.status(400).render("error", {
                    statusCode: 400,
                    message: "Selected screen does not exist in this theater."
                });
            }

            // Parse local datetime-local input.
            const showStart = new Date(showDateTime);
            const movieDuration = Number(movieData.duration);
            const currentTime = new Date();

            console.log("Selected Show Time:", showDateTime);
            console.log("Parsed Show Time:", showStart);
            console.log("Current Server Time:", currentTime);
            console.log("Movie Duration:", movieDuration);

            // Validate date.
            if (Number.isNaN(showStart.getTime())) {
                return res.status(400).render("error", {
                    statusCode: 400,
                    message: "Invalid show date and time."
                });
            }

            // Validate future time.
            if (showStart.getTime() <= currentTime.getTime()) {
                return res.status(400).render("error", {
                    statusCode: 400,
                    message: "Show time must be in the future."
                });
            }

            // Validate movie duration.
            if (
                !Number.isFinite(movieDuration) ||
                movieDuration <= 0
            ) {
                return res.status(400).render("error", {
                    statusCode: 400,
                    message: "Please check the movie duration."
                });
            }

            // Calculate show ending time.
            const showEnd = new Date(
                showStart.getTime() + movieDuration * 60 * 1000
            );

            // Find shows on the same theater screen.
            const existingShows = await Show.find({
                theater: theaterData._id,
                screenNumber: screen
            }).populate("movie", "duration");

            // Check overlapping timings.
            const hasConflict = existingShows.some(existingShow => {
                const existingStart = new Date(existingShow.showDateTime);
                const existingDuration = Number(
                    existingShow.movie?.duration
                );

                if (
                    Number.isNaN(existingStart.getTime()) ||
                    !Number.isFinite(existingDuration) ||
                    existingDuration <= 0
                ) {
                    return false;
                }

                const existingEnd = new Date(
                    existingStart.getTime() +
                    existingDuration * 60 * 1000
                );

                return (
                    showStart < existingEnd &&
                    showEnd > existingStart
                );
            });

            if (hasConflict) {
                return res.status(409).render("error", {
                    statusCode: 409,
                    message: "This screen already has a show scheduled during that time."
                });
            }

            // Save new show.
            const newShow = new Show({
                movie: movieData._id,
                theater: theaterData._id,
                screenNumber: screen,
                showDateTime: showStart,
                totalSeats: seats,
                availableSeats: seats
            });

            await newShow.save();

            req.flash("success", "Show scheduled successfully.");
            return res.redirect("/theaters/shows");

        } catch (error) {
            console.error("========== ADD SHOW ERROR ==========");
            console.error(error);
            console.error("Error Name:", error.name);
            console.error("Error Message:", error.message);
            console.error("=====================================");

            return res.status(500).render("error", {
                statusCode: 500,
                message: error.message
            });
        }
    }

    // ==============================
    // GET SHOWS FOR A THEATER
    // ==============================
    async getTheaterShows(req, res) {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                req.flash("error", "Invalid theater ID.");
                return res.redirect("/theaters/admin/manage");
            }

            const theater = await Theater.findById(req.params.id);

            if (!theater) {
                req.flash("error", "Theater not found.");
                return res.redirect("/theaters/admin/manage");
            }

            const shows = await Show.find({
                theater: theater._id
            })
                .populate("movie", "name duration")
                .populate("theater", "name location")
                .sort({ showDateTime: 1 });

            return res.render("admin/shows", {
                title: `${theater.name} Shows`,
                theater,
                movies: await Movie.find(),
                theaters: await Theater.find(),
                shows
            });

        } catch (error) {
            console.error("Get Theater Shows Error:", error);
            req.flash("error", "Unable to load theater shows.");
            return res.redirect("/theaters/admin/manage");
        }
    }
}

module.exports = new TheaterController();
