// utils/sendEmail.js
const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
  // If no email credentials are configured, log the message instead (useful for local dev)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("No EMAIL_USER/PASS configured — logging email instead:");
    console.log({ to, subject, text });
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
};

module.exports = sendEmail;
