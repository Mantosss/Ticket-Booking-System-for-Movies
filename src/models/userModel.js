
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false
        },

        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Role",
            required: true
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        verificationToken: {
            type: String,
            default: null,
            select: false
        },

        verificationTokenExpiry: {
            type: Date,
            default: null,
            select: false
        },

        profilePicture: {
            type: String,
            default: "uploads/profiles/default.png"
        }
    },
    {
        timestamps: true
    }
);

// Automatically hide password and verification token
// when converting documents to JSON
userSchema.set("toJSON", {
    transform: function (doc, ret) {
        delete ret.password;
        delete ret.verificationToken;
        delete ret.verificationTokenExpiry;
        return ret;
    }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
