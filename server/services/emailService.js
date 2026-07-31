const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'demo@apexcrm.internal',
    pass: 'demopass'
  }
});

async function sendEmailFallback({ toEmail, subject, body }) {
  try {
    const info = await transporter.sendMail({
      from: '"Apex CRM Notification System" <notifications@apexcrm.internal>',
      to: toEmail,
      subject: subject,
      text: body,
      html: `<div style="font-family: sans-serif; padding: 20px; background: #0b0d12; color: #ffffff;">
        <h2 style="color: #e8702a;">Apex CRM Notification</h2>
        <p style="font-size: 16px;">${body}</p>
        <hr style="border-color: #333;" />
        <small style="color: #888;">This email was sent via automated fallback delivery queue.</small>
      </div>`
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendEmailFallback
};
