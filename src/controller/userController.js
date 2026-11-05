
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

class UserController {

    // 1. Get User Profile
    async getProfile(req, res) {
        try {
            const userId = req.session.user.id;

            const user = await User.findById(userId)
                .populate("role")
                .select("-password -verificationToken");

            if (!user) {
                return res.status(404).render("error", {
                    message: "User not found"
                });
            }

            return res.render("user/profile", {
                user,
                success: null,
                error: null
            });

        } catch (error) {
            console.log("Get Profile Error:", error);
            return res.status(500).render("error", {
                message: "Unable to fetch profile"
            });
        }
    }

    // 2. Edit User Profile
    async updateProfile(req, res) {
        try {
            const userId = req.session.user.id;
            const { name, email, password } = req.body;

            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).render("error", {
                    message: "User not found"
                });
            }

            // Check if email is already used
            if (email && email !== user.email) {
                const existingUser = await User.findOne({
                    email,
                    _id: { $ne: userId }
                });

                if (existingUser) {
                    return res.status(400).render("user/profile", {
                        user,
                        success: null,
                        error: "Email already exists"
                    });
                }

                // Email changes should require re-verification
                user.email = email.toLowerCase().trim();
                user.isVerified = false;
            }

            if (name) {
                user.name = name.trim();
            }

            // Update password only if provided
            if (password && password.trim() !== "") {
                user.password = await bcrypt.hash(password, 10);
            }

            // Update profile picture
            if (req.file) {
                if (user.profilePicture) {
                    const oldImagePath = path.join(
                        process.cwd(),
                        "src/public",
                        user.profilePicture
                    );

                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }

                user.profilePicture = `uploads/profiles/${req.file.filename}`;
            }

            await user.save();

            // Update session information
            req.session.user.name = user.name;
            req.session.user.email = user.email;

            return res.redirect("/user/profile");

        } catch (error) {
            console.log("Update Profile Error:", error);
            return res.status(500).send("Unable to update profile");
        }
    }

}

module.exports = new UserController();
