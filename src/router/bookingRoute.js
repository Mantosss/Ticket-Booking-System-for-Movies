
const express = require("express");
const router = express.Router();

// Controllers
const bookingController = require("../controller/bookingController");

// Middlewares
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// ==========================================
// USER BOOKING ROUTES
// ==========================================

// 1. Open booking page for a selected show
// GET /bookings/select/:showId
router.get(
    "/select/:showId",
    authMiddleware,
    bookingController.getBookingPage
);

// 2. Display available shows for a selected movie
// GET /bookings/shows/:movieId
router.get(
    "/shows/:movieId",
    authMiddleware,
    bookingController.getAvailableShows
);

// 3. Confirm ticket booking
// POST /bookings/book
router.post(
    "/book",
    authMiddleware,
    bookingController.bookTickets
);

// 4. Display booking details
// GET /bookings/details/:id
router.get(
    "/details/:id",
    authMiddleware,
    bookingController.getBookingDetails
);

// 5. Cancel a booking
// POST /bookings/cancel/:id
router.post(
    "/cancel/:id",
    authMiddleware,
    bookingController.cancelBooking
);

// 6. Display logged-in user's booking history
// GET /bookings/history
router.get(
    "/history",
    authMiddleware,
    bookingController.getBookingHistory
);


// ==========================================
// ADMIN BOOKING ROUTES
// ==========================================

// 7. Display all bookings (Admin only)
// GET /bookings/admin/all
router.get(
    "/admin/all",
    authMiddleware,
    roleMiddleware("Admin"),
    bookingController.getAllBookings
);


// Export router
module.exports = router;
