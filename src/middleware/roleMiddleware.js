
const roleMiddleware = (...allowedRoles) => {

    return (req, res, next) => {
        try {
            // Check whether user is logged in
            if (!req.session || !req.session.user) {
                req.flash("error", "Please login first.");
                return res.redirect("/login");
            }

            // Get logged-in user's role
            const userRole = req.session.user.role;

            // Check whether the role is allowed
            if (!allowedRoles.includes(userRole)) {
                req.flash(
                    "error",
                    "You are not authorized to access this page."
                );

                return res.status(403).render("error", {
                    message: "Access denied. Admin permission required."
                });
            }

            next();

        } catch (error) {
            console.error("Role Middleware Error:", error);

            return res.status(500).render("error", {
                message: "Something went wrong while checking permissions."
            });
        }
    };
};

module.exports = roleMiddleware;
