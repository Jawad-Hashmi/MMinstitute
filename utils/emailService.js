// utils/emailService.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Store this in .env

exports.sendEmail = async ({ to, subject, text }) => {
  const msg = {
    to,
    from: process.env.SENDGRID_SENDER, // Verified sender email
    subject,
    text,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('SendGrid Error:', error.response?.body || error.message);
    throw new Error('Failed to send email');
  }
};
