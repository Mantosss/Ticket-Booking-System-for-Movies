
const express = require("express");
const router = express.Router();

const movieController = require("../controller/movieController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// ==========================================
// PUBLIC MOVIE ROUTES
// ==========================================

// Display all movies
router.get("/", movieController.getMovies);

// Display movie details
router.get("/details/:id", movieController.getMovieDetails);


// ==========================================
// ADMIN DASHBOARD
// ==========================================

// Display Admin Dashboard
router.get(
    "/admin/dashboard",
    authMiddleware,
    roleMiddleware("Admin"),
    (req, res) => {
        return res.render("admin/dashboard", {
            title: "Admin Dashboard"
        });
    }
);


// ==========================================
// ADMIN MOVIE MANAGEMENT
// ==========================================

// Display all movies for Admin
router.get(
    "/admin/manage",
    authMiddleware,
    roleMiddleware("Admin"),
    movieController.getAdminMovies
);

// Add a new movie
router.post(
    "/admin/add",
    authMiddleware,
    roleMiddleware("Admin"),
    movieController.addMovie
);

// Update movie
router.post(
    "/admin/update/:id",
    authMiddleware,
    roleMiddleware("Admin"),
    movieController.updateMovie
);

// Delete movie
router.post(
    "/admin/delete/:id",
    authMiddleware,
    roleMiddleware("Admin"),
    movieController.deleteMovie
);


// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;
