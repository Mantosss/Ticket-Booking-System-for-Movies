
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const mongoose = require("mongoose");
const path = require("path");
const flash = require("connect-flash");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const methodOverride = require("method-override");

const dbConnect = require("./src/config/dbCon");

// Routers
const authRoute = require("./src/router/authRoute");
const userRoute = require("./src/router/userRoute");
const movieRoute = require("./src/router/movieRoute");
const theaterRoute = require("./src/router/theaterRoute");
const bookingRoute = require("./src/router/bookingRoute");
const reportRoute = require("./src/router/reportRoute");

// Error middleware
const errorMiddleware = require("./src/middleware/errorMiddleware");

const app = express();

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false
}));

// Static files
app.use(express.static(path.join(__dirname, "src/public")));

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Method override
app.use(methodOverride("_method"));

// Rate limiter
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false
});

// Session configuration
app.use(session({
    name: "movie.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL,
        collectionName: "sessions"
    }),

    cookie: {
        maxAge: Number(process.env.SESSION_MAX_AGE) || 86400000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    }
}));

// Flash messages
app.use(flash());

// Global EJS variables
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.successMessage = req.flash("success");
    res.locals.errorMessage = req.flash("error");
    next();
});

// Home route
app.get("/", (req, res) => {
    res.redirect("/movies");
});

// Authentication routes
app.use("/auth", authLimiter, authRoute);

// Other routes
app.use("/user", userRoute);
app.use("/movies", movieRoute);
app.use("/theaters", theaterRoute);
app.use("/bookings", bookingRoute);
app.use("/reports", reportRoute);

// Favicon
app.get("/favicon.ico", (req, res) => {
    res.status(204).end();
});

// Error handlers
app.use(errorMiddleware.notFound);
app.use(errorMiddleware.handleError);

// Start server after database connection
const PORT = process.env.PORT || 3009;

async function startServer() {
    try {
        await dbConnect();

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
}

startServer();
