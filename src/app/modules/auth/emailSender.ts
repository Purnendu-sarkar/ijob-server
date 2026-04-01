import nodemailer from "nodemailer";
import config from "../../../config";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: config.email?.user,
        pass: config.email?.app_password,
    },
    tls: { rejectUnauthorized: false },
});

const emailSender = async (to: string, html: string, subject = "iJob Bangladesh") => {
    try {
        await transporter.sendMail({
            from: `"iJob Bangladesh" <${config.email?.user}>`,
            to,
            subject,
            html,
        });
    } catch (err) {
        console.error("Problem sending email:", err);
        throw new Error("Failed to send email");
    }
};

export default emailSender;