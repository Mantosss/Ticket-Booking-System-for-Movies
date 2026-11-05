
const Booking = require("../models/bookingModel");
const Movie = require("../models/movieModel");
const Theater = require("../models/theaterModel");
const nodemailer = require("nodemailer");

// Get dashboard summary
const getDashboardStats = async () => {
    const [
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        ticketResult,
        totalMovies,
        totalTheaters
    ] = await Promise.all([
        Booking.countDocuments(),

        Booking.countDocuments({ status: "Confirmed" }),

        Booking.countDocuments({ status: "Cancelled" }),

        Booking.aggregate([
            { $match: { status: "Confirmed" } },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$ticketCount" }
                }
            }
        ]),

        Movie.countDocuments(),
        Theater.countDocuments()
    ]);

    return {
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        totalTickets: ticketResult[0]?.total || 0,
        totalMovies,
        totalTheaters
    };
};


// Get movie-wise booking report
const getMovieReports = async () => {
    return Booking.aggregate([
        { $match: { status: "Confirmed" } },
        {
            $group: {
                _id: "$movie",
                totalBookings: { $sum: 1 },
                totalTickets: { $sum: "$ticketCount" }
            }
        },
        {
            $lookup: {
                from: "movies",
                localField: "_id",
                foreignField: "_id",
                as: "movie"
            }
        },
        { $unwind: "$movie" },
        {
            $project: {
                _id: 0,
                movieName: "$movie.name",
                totalBookings: 1,
                totalTickets: 1
            }
        },
        { $sort: { totalTickets: -1 } }
    ]);
};


// Get theater-wise booking report
const getTheaterReports = async () => {
    return Booking.aggregate([
        { $match: { status: "Confirmed" } },
        {
            $group: {
                _id: "$theater",
                totalBookings: { $sum: 1 },
                totalTickets: { $sum: "$ticketCount" }
            }
        },
        {
            $lookup: {
                from: "theaters",
                localField: "_id",
                foreignField: "_id",
                as: "theater"
            }
        },
        { $unwind: "$theater" },
        {
            $project: {
                _id: 0,
                theaterName: "$theater.name",
                location: "$theater.location",
                totalBookings: 1,
                totalTickets: 1
            }
        },
        { $sort: { totalTickets: -1 } }
    ]);
};


// Get show-wise booking report
const getShowReports = async () => {
    return Booking.aggregate([
        { $match: { status: "Confirmed" } },
        {
            $group: {
                _id: "$show",
                totalBookings: { $sum: 1 },
                totalTickets: { $sum: "$ticketCount" }
            }
        },
        {
            $lookup: {
                from: "shows",
                localField: "_id",
                foreignField: "_id",
                as: "show"
            }
        },
        { $unwind: "$show" },
        {
            $lookup: {
                from: "movies",
                localField: "show.movie",
                foreignField: "_id",
                as: "movie"
            }
        },
        { $unwind: "$movie" },
        {
            $lookup: {
                from: "theaters",
                localField: "show.theater",
                foreignField: "_id",
                as: "theater"
            }
        },
        { $unwind: "$theater" },
        {
            $project: {
                _id: 0,
                movieName: "$movie.name",
                theaterName: "$theater.name",
                screenNumber: "$show.screenNumber",
                showDateTime: "$show.showDateTime",
                totalBookings: 1,
                totalTickets: 1
            }
        },
        { $sort: { showDateTime: -1 } }
    ]);
};


// Get all report data required by the EJS page
const getAllReportData = async () => {
    const [
        stats,
        movieReports,
        theaterReports,
        showReports
    ] = await Promise.all([
        getDashboardStats(),
        getMovieReports(),
        getTheaterReports(),
        getShowReports()
    ]);

    return {
        ...stats,
        movieReports,
        theaterReports,
        showReports
    };
};


class ReportController {

    // Main report dashboard
    async getReports(req, res) {
        try {
            const data = await getAllReportData();

            return res.render("admin/reports", {
                title: "Booking Reports",
                ...data,
                reportType: "dashboard"
            });

        } catch (error) {
            console.error("Report Dashboard Error:", error);

            return res.status(500).render("error", {
                statusCode: 500,
                message: "Unable to load report dashboard."
            });
        }
    }


    // Movie report page
    async getMovieReport(req, res) {
        try {
            const data = await getAllReportData();

            return res.render("admin/reports", {
                title: "Movie Booking Report",
                ...data,
                reportType: "movie"
            });

        } catch (error) {
            console.error("Movie Report Error:", error);

            return res.status(500).render("error", {
                statusCode: 500,
                message: "Unable to generate movie report."
            });
        }
    }


    // Theater report page
    async getTheaterReport(req, res) {
        try {
            const data = await getAllReportData();

            return res.render("admin/reports", {
                title: "Theater Booking Report",
                ...data,
                reportType: "theater"
            });

        } catch (error) {
            console.error("Theater Report Error:", error);

            return res.status(500).render("error", {
                statusCode: 500,
                message: "Unable to generate theater report."
            });
        }
    }


    // Show report page
    async getShowReport(req, res) {
        try {
            const data = await getAllReportData();

            return res.render("admin/reports", {
                title: "Show Booking Report",
                ...data,
                reportType: "show"
            });

        } catch (error) {
            console.error("Show Report Error:", error);

            return res.status(500).render("error", {
                statusCode: 500,
                message: "Unable to generate show report."
            });
        }
    }


    // Email booking summary
    async sendBookingSummary(req, res) {
        try {
            const { email } = req.body;

            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).render("error", {
                    statusCode: 400,
                    message: "Please enter a valid email address."
                });
            }

            const bookings = await Booking.find({
                status: "Confirmed"
            })
                .populate("user", "name email")
                .populate("movie", "name")
                .populate("theater", "name location")
                .populate("show", "screenNumber showDateTime")
                .sort({ bookingDate: -1 });

            const escapeHTML = (value) => {
                return String(value ?? "N/A").replace(
                    /[&<>"']/g,
                    (char) => ({
                        "&": "&amp;",
                        "<": "&lt;",
                        ">": "&gt;",
                        '"': "&quot;",
                        "'": "&#39;"
                    })[char]
                );
            };

            const rows = bookings.map((booking) => `
                <tr>
                    <td>${escapeHTML(booking.user?.name)}</td>
                    <td>${escapeHTML(booking.movie?.name)}</td>
                    <td>${escapeHTML(booking.theater?.name)}</td>
                    <td>${escapeHTML(booking.show?.screenNumber)}</td>
                    <td>${escapeHTML(booking.ticketCount)}</td>
                    <td>${escapeHTML(booking.status)}</td>
                </tr>
            `).join("");

            const html = `
                <h2>Movie Ticket Booking Summary</h2>
                <table border="1" cellpadding="8" cellspacing="0"
                    style="border-collapse:collapse;width:100%;">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Movie</th>
                            <th>Theater</th>
                            <th>Screen</th>
                            <th>Tickets</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows || "<tr><td colspan='6'>No bookings found</td></tr>"}
                    </tbody>
                </table>
            `;

            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || "smtp.gmail.com",
                port: Number(process.env.EMAIL_PORT) || 587,
                secure: Number(process.env.EMAIL_PORT) === 465,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            await transporter.sendMail({
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: email,
                subject: "Movie Ticket Booking Summary",
                html
            });

            req.flash("success", "Booking summary emailed successfully.");

            return res.redirect("/reports");

        } catch (error) {
            console.error("Send Summary Error:", error);

            return res.status(500).render("error", {
                statusCode: 500,
                message: "Unable to send booking summary."
            });
        }
    }
}

module.exports = new ReportController();
