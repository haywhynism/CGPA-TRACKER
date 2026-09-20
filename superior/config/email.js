const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendActivationEmail = async (email, name, activationCode) => {
  const mailOptions = {
    from: `"CGPA Tracker" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Activate Your Student Account",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Activate Your Student Account</h2>

        <p>Hello ${name},</p>

        <p>
          Your student account has been created on the CGPA Tracker system.
        </p>

        <p>
          Use the activation code below to activate your account:
        </p>

        <h1 style="letter-spacing: 5px;">
          ${activationCode}
        </h1>

        <p>
          This activation code will expire in <strong>15 minutes</strong>.
        </p>

        <p>
          If you did not request this activation, please ignore this email.
        </p>

        <p>
          Regards,<br />
          CGPA Tracker
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendActivationEmail,
};