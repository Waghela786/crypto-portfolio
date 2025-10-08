import nodemailer from "nodemailer";

const sendEmail = async (to, subject, text) => {
  // If no email credentials are configured, log instead (for local dev)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("No EMAIL_USER/PASS configured — logging email instead:");
    console.log({ to, subject, text });
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
};

export default sendEmail;
