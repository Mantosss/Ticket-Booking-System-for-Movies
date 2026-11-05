
const express = require("express");
const router = express.Router();

const theaterController = require("../controller/theaterController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const adminMiddleware = roleMiddleware("Admin");

// ==============================
// THEATER MANAGEMENT
// ==============================

// View all theaters
router.get(
    "/",
    authMiddleware,
    adminMiddleware,
    theaterController.getTheaters
);

router.get(
    "/admin/manage",
    authMiddleware,
    adminMiddleware,
    theaterController.getTheaters
);

// Add theater
router.post(
    "/add",
    authMiddleware,
    adminMiddleware,
    theaterController.addTheater
);

// Edit theater
router.get(
    "/edit/:id",
    authMiddleware,
    adminMiddleware,
    theaterController.getEditTheater
);

// Update theater
router.post(
    "/update/:id",
    authMiddleware,
    adminMiddleware,
    theaterController.updateTheater
);

// Delete theater
router.post(
    "/delete/:id",
    authMiddleware,
    adminMiddleware,
    theaterController.deleteTheater
);

// ==============================
// SHOW MANAGEMENT
// ==============================

// View all shows
router.get(
    "/shows",
    authMiddleware,
    adminMiddleware,
    theaterController.getShowPage
);

// Show scheduling page
router.get(
    "/shows/add",
    authMiddleware,
    adminMiddleware,
    theaterController.getShowPage
);

// Schedule new show
router.post(
    "/shows/add",
    authMiddleware,
    adminMiddleware,
    theaterController.addShow
);

// View shows for a particular theater
router.get(
    "/:id/shows",
    authMiddleware,
    adminMiddleware,
    theaterController.getTheaterShows
);

module.exports = router;
