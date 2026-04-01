"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../../../config"));
const transporter = nodemailer_1.default.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: config_1.default.email?.user,
        pass: config_1.default.email?.app_password,
    },
    tls: { rejectUnauthorized: false },
});
const emailSender = async (to, html, subject = "iJob Bangladesh") => {
    try {
        await transporter.sendMail({
            from: `"iJob Bangladesh" <${config_1.default.email?.user}>`,
            to,
            subject,
            html,
        });
    }
    catch (err) {
        console.error("Problem sending email:", err);
        throw new Error("Failed to send email");
    }
};
exports.default = emailSender;
