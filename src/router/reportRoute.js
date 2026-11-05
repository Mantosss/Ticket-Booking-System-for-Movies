const express = require("express");
const router = express.Router();

const reportController = require("../controller/reportController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get(
    "/",
    authMiddleware,
    roleMiddleware("Admin"),
    reportController.getReports
);

router.get(
    "/movies",
    authMiddleware,
    roleMiddleware("Admin"),
    reportController.getMovieReport
);

router.get(
    "/theaters",
    authMiddleware,
    roleMiddleware("Admin"),
    reportController.getTheaterReport
);

router.get(
    "/shows",
    authMiddleware,
    roleMiddleware("Admin"),
    reportController.getShowReport
);

router.post(
    "/email-summary",
    authMiddleware,
    roleMiddleware("Admin"),
    reportController.sendBookingSummary
);

module.exports = router;