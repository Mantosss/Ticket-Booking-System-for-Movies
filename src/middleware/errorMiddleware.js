
class ErrorMiddleware {

    // Handle routes that do not exist
    notFound(req, res, next) {
        const error = new Error(`Page not found: ${req.originalUrl}`);
        error.statusCode = 404;
        next(error);
    }

    // Handle application errors
    handleError(err, req, res, next) {
        console.error("Application Error:", err);

        const statusCode = err.statusCode || err.status || 500;

        if (res.headersSent) {
            return next(err);
        }

        return res.status(statusCode).render("error", {
            statusCode: statusCode,
            message: err.message || "Something went wrong!"
        });
    }
}

module.exports = new ErrorMiddleware();
