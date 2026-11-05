
const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            enum: ["User", "Admin"],
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const Role = mongoose.model("Role", roleSchema);

module.exports = Role;
