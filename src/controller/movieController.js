
const Movie = require("../models/movieModel");
const Show = require("../models/showModel");
const Booking = require("../models/bookingModel");

class MovieController {

    // 1. Display all movies
    async getMovies(req, res) {
        try {
            const movies = await Movie.find().sort({ createdAt: -1 });

            const movieList = await Promise.all(
                movies.map(async (movie) => {
                    const shows = await Show.find({
                        movie: movie._id
                    }).populate("theater", "name location");

                    const theaterIds = [
                        ...new Set(
                            shows
                                .filter(show => show.theater)
                                .map(show => show.theater._id.toString())
                        )
                    ];

                    return {
                        ...movie.toObject(),
                        totalTheaters: theaterIds.length,
                        shows
                    };
                })
            );

            return res.render("movies/movieList", {
                title: "All Movies",
                movies: movieList
            });

        } catch (error) {
            console.error("Get Movies Error:", error);

            return res.status(500).render("error", {
                statusCode: 500,
                message: "Unable to load movies."
            });
        }
    }


    // 2. Display single movie details
    async getMovieDetails(req, res) {
        try {
            const { id } = req.params;

            const movie = await Movie.findById(id);

            if (!movie) {
                return res.status(404).render("error", {
                    statusCode: 404,
                    message: "Movie not found."
                });
            }

            const shows = await Show.find({
                movie: movie._id
            }).populate("theater", "name location");

            return res.render("movies/movieDetails", {
                title: movie.name,
                movie,
                shows
            });

        } catch (error) {
            console.error("Movie Details Error:", error);

            return res.status(500).render("error", {
                statusCode: 500,
                message: "Unable to load movie details."
            });
        }
    }


    // 3. Display admin movie management page
    async getAdminMovies(req, res) {
        try {
            const movies = await Movie.find().sort({ createdAt: -1 });

            return res.render("admin/movies", {
                title: "Manage Movies",
                movies
            });

        } catch (error) {
            console.error("Admin Movies Error:", error);

            return res.status(500).render("error", {
                statusCode: 500,
                message: "Unable to load movie management page."
            });
        }
    }


    // 4. Add a new movie
    async addMovie(req, res) {
        try {
            const {
                name,
                genre,
                language,
                duration,
                cast,
                director,
                releaseDate
            } = req.body;

            // Validate required fields
            if (
                !name?.trim() ||
                !genre ||
                !language?.trim() ||
                !duration ||
                !director?.trim() ||
                !releaseDate
            ) {
                return res.status(400).render("error", {
                    statusCode: 400,
                    message: "Please fill in all required movie details."
                });
            }

            const movie = new Movie({
                name: name.trim(),
                genre: Array.isArray(genre)
                    ? genre
                    : genre.split(",").map(item => item.trim()).filter(Boolean),
                language: language.trim(),
                duration: Number(duration),
                cast: cast
                    ? cast.split(",").map(item => item.trim()).filter(Boolean)
                    : [],
                director: director.trim(),
                releaseDate
            });

            await movie.save();

            console.log("MOVIE ADDED SUCCESSFULLY:", movie.name);

            req.flash("success", "Movie added successfully.");

            // Correct URL
            return res.redirect("/movies/admin/manage");

        } catch (error) {
            console.error("Add Movie Error:", error);

            return res.status(500).render("error", {
                statusCode: 500,
                message: "Unable to add movie. Please check the movie details."
            });
        }
    }


    // 5. Update movie details
    async updateMovie(req, res) {
        try {
            const { id } = req.params;

            const {
                name,
                genre,
                language,
                duration,
                cast,
                director,
                releaseDate
            } = req.body;

            const movie = await Movie.findById(id);

            if (!movie) {
                return res.status(404).render("error", {
                    statusCode: 404,
                    message: "Movie not found."
                });
            }

            if (
                !name?.trim() ||
                !genre ||
                !language?.trim() ||
                !duration ||
                !director?.trim() ||
                !releaseDate
            ) {
                return res.status(400).render("error", {
                    statusCode: 400,
                    message: "Please fill in all required movie details."
                });
            }

            movie.name = name.trim();

            movie.genre = Array.isArray(genre)
                ? genre
                : genre.split(",").map(item => item.trim()).filter(Boolean);

            movie.language = language.trim();
            movie.duration = Number(duration);

            movie.cast = cast
                ? cast.split(",").map(item => item.trim()).filter(Boolean)
                : [];

            movie.director = director.trim();
            movie.releaseDate = releaseDate;

            await movie.save();

            req.flash("success", "Movie updated successfully.");

            return res.redirect("/movies/admin/manage");

        } catch (error) {
            console.error("Update Movie Error:", error);

            return res.status(500).render("error", {
                statusCode: 500,
                message: "Unable to update movie."
            });
        }
    }


    // 6. Delete movie
    async deleteMovie(req, res) {
        try {
            const { id } = req.params;

            const movie = await Movie.findById(id);

            if (!movie) {
                return res.status(404).render("error", {
                    statusCode: 404,
                    message: "Movie not found."
                });
            }

            // Prevent deletion if bookings exist
            const bookingExists = await Booking.exists({
                movie: movie._id
            });

            if (bookingExists) {
                req.flash(
                    "error",
                    "This movie has booking records and cannot be deleted."
                );

                return res.redirect("/movies/admin/manage");
            }

            // Delete related shows
            await Show.deleteMany({
                movie: movie._id
            });

            // Delete movie
            await Movie.findByIdAndDelete(id);

            req.flash("success", "Movie deleted successfully.");

            return res.redirect("/movies/admin/manage");

        } catch (error) {
            console.error("Delete Movie Error:", error);

            return res.status(500).render("error", {
                statusCode: 500,
                message: "Unable to delete movie."
            });
        }
    }

}

module.exports = new MovieController();
