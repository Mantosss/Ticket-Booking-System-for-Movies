
const User = require("../models/userModel");

const authMiddleware = async (req, res, next) => {
    try {
        // 1. Check whether the user is logged in
        if (!req.session || !req.session.user) {
            req.flash("error", "Please login first.");
            return res.redirect("/auth/login");
        }

        // 2. Find the logged-in user in MongoDB
        const user = await User.findById(req.session.user.id)
            .populate("role", "name");

        // 3. Check whether the user exists
        if (!user) {
            return req.session.destroy(() => {
                res.clearCookie("movie.sid");
                return res.redirect("/auth/login");
            });
        }

        // 4. Check email verification
        if (!user.isVerified) {
            req.flash("error", "Please verify your email first.");
            return res.redirect("/auth/login");
        }

        // 5. Check whether the user has a role
        if (!user.role) {
            return res.status(403).send("User role not found.");
        }

        // 6. Update session information
        req.session.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role.name
        };

        // 7. Allow the request to continue
        return next();

    } catch (error) {
        console.error("Authentication Middleware Error:", error);

        return res.status(500).render("error", {
            statusCode: 500,
            message: "Authentication failed."
        });
    }
};

// Export middleware function
module.exports = authMiddleware;
