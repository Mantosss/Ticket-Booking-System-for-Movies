
const User = require("../models/userModel");
const Role = require("../models/roleModel");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Create email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: Number(process.env.EMAIL_PORT) === 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

class AuthController {

    // 1. Signup Page
    async signupPage(req, res) {
        try {
            return res.render("auth/signup");
        } catch (error) {
            console.error("Signup Page Error:", error);
            return res.status(500).send("Something went wrong.");
        }
    }

    // 2. User Signup
    async signup(req, res) {
        try {
            const { name, email, password, confirmPassword } = req.body;

            if (!name || !email || !password || !confirmPassword) {
                return res.status(400).render("auth/signup", {
                    error: "All fields are required."
                });
            }

            if (password !== confirmPassword) {
                return res.status(400).render("auth/signup", {
                    error: "Passwords do not match."
                });
            }

            if (password.length < 6) {
                return res.status(400).render("auth/signup", {
                    error: "Password must contain at least 6 characters."
                });
            }

            const normalizedEmail = email.trim().toLowerCase();

            // Check existing user
            const existingUser = await User.findOne({
                email: normalizedEmail
            });

            if (existingUser) {
                return res.status(400).render("auth/signup", {
                    error: "Email already registered."
                });
            }

            // Find User role
            const userRole = await Role.findOne({ name: "User" });

            if (!userRole) {
                return res.status(500).render("auth/signup", {
                    error: "User role not found. Please run seedRoles.js."
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Generate verification token
            const verificationToken = crypto.randomBytes(32).toString("hex");

            const verificationTokenExpiry = new Date(
                Date.now() + 24 * 60 * 60 * 1000
            );

            // Save user in MongoDB
            const newUser = await User.create({
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                role: userRole._id,
                verificationToken,
                verificationTokenExpiry,
                isVerified: false
            });

            console.log("USER REGISTERED SUCCESSFULLY:", newUser.email);

            // Generate verification link
            const verificationLink =
                `${process.env.CLIENT_URL}/auth/verify-email/${verificationToken}`;

            // Send verification email
            try {
                const transporter = createTransporter();

                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                    to: normalizedEmail,
                    subject: "Verify Your Movie Ticket Booking Account",
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px;">
                            <h2>Welcome ${name.trim()}!</h2>
                            <p>Thank you for registering with Movie Ticket Booking.</p>
                            <p>Please click the button below to verify your email:</p>

                            <a href="${verificationLink}"
                               style="background: #0d6efd;
                                      color: white;
                                      padding: 12px 20px;
                                      text-decoration: none;
                                      border-radius: 5px;">
                                Verify Email
                            </a>

                            <p>This verification link expires in 24 hours.</p>
                        </div>
                    `
                });

                console.log("VERIFICATION EMAIL SENT:", normalizedEmail);

                return res.status(201).render("auth/login", {
                    success: "Registration successful! Please check your email and verify your account before logging in."
                });

            } catch (emailError) {
                console.error("Verification Email Error:", emailError);

                // User is already saved in MongoDB
                return res.status(201).render("auth/login", {
                    error: "Your account was created, but the verification email could not be sent. Please contact the administrator."
                });
            }

        } catch (error) {
            console.error("Signup Error:", error);

            if (error.code === 11000) {
                return res.status(400).render("auth/signup", {
                    error: "This email address is already registered."
                });
            }

            return res.status(500).render("auth/signup", {
                error: "Unable to register. Please try again."
            });
        }
    }

    // 3. Verify Email
    async verifyEmail(req, res) {
        try {
            const { token } = req.params;

            const user = await User.findOne({
                verificationToken: token,
                verificationTokenExpiry: { $gt: new Date() }
            }).select("+verificationToken +verificationTokenExpiry");

            if (!user) {
                return res.status(400).render("auth/emailVerified", {
                    success: false,
                    message: "Invalid or expired verification link."
                });
            }

            user.isVerified = true;
            user.verificationToken = null;
            user.verificationTokenExpiry = null;

            await user.save();

            console.log("EMAIL VERIFIED:", user.email);

            return res.render("auth/emailVerified", {
                success: true,
                message: "Your email has been verified successfully. You can now login."
            });

        } catch (error) {
            console.error("Email Verification Error:", error);
            return res.status(500).send("Email verification failed.");
        }
    }

    // 4. Login Page
    async loginPage(req, res) {
        try {
            return res.render("auth/login");
        } catch (error) {
            console.error("Login Page Error:", error);
            return res.status(500).send("Something went wrong.");
        }
    }

    // 5. User/Admin Login
    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).render("auth/login", {
                    error: "Email and password are required."
                });
            }

            const normalizedEmail = email.trim().toLowerCase();

            const user = await User.findOne({
                email: normalizedEmail
            })
                .select("+password")
                .populate("role");

            if (!user) {
                return res.status(400).render("auth/login", {
                    error: "Invalid email or password."
                });
            }

            if (!user.isVerified) {
                return res.status(403).render("auth/login", {
                    error: "Please verify your email before logging in."
                });
            }

            const isMatch = await bcrypt.compare(
                password,
                user.password
            );

            if (!isMatch) {
                return res.status(400).render("auth/login", {
                    error: "Invalid email or password."
                });
            }

            if (!user.role) {
                return res.status(403).render("auth/login", {
                    error: "User role is not assigned. Contact administrator."
                });
            }

            // Regenerate session
            req.session.regenerate((err) => {
                if (err) {
                    console.error("Session Regeneration Error:", err);

                    return res.status(500).render("auth/login", {
                        error: "Login failed. Please try again."
                    });
                }

                req.session.user = {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role.name
                };

                // Save session before redirect
                req.session.save((saveError) => {
                    if (saveError) {
                        console.error("Session Save Error:", saveError);

                        return res.status(500).render("auth/login", {
                            error: "Unable to save login session."
                        });
                    }

                    console.log("LOGIN SUCCESSFUL:", user.email);
                    console.log("USER ROLE:", user.role.name);

                    if (user.role.name === "Admin") {
                        return res.redirect("/movies/admin/dashboard");
                    }

                    return res.redirect("/movies");
                });
            });

        } catch (error) {
            console.error("Login Error:", error);

            return res.status(500).render("auth/login", {
                error: "Unable to login. Please try again."
            });
        }
    }

    // 6. Logout
    async logout(req, res) {
        try {
            if (!req.session) {
                return res.redirect("/auth/login");
            }

            req.session.destroy((err) => {
                if (err) {
                    console.error("Logout Error:", err);
                    return res.status(500).send("Logout failed.");
                }

                res.clearCookie("movie.sid");

                return res.redirect("/auth/login");
            });

        } catch (error) {
            console.error("Logout Error:", error);
            return res.status(500).send("Something went wrong.");
        }
    }
}

module.exports = new AuthController();
