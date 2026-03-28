const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});

async function sendMail({ to, subject, text, html }) {
  if (!to) {
    return;
  }

  if (!process.env.SMTP_HOST) {
    console.log("SMTP_HOST not set. Email skipped:", subject);
    return;
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM || "noreply@epashucare.local",
    to,
    subject,
    text,
    html,
  });
}

module.exports = {
  sendMail,
};
