
const transporter = require("../config/mailConfig");

const sendEmail = async ({ to, subject, html }) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);

        console.log("Email sent successfully:", info.messageId);

        return info;
    } catch (error) {
        console.error("Email sending failed:", error.message);
        throw error;
    }
};

module.exports = sendEmail;
