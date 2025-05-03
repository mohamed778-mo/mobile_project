const nodemailer = require('nodemailer');

const sendOTPEmail = async ({ to, name, otp }) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service: "gmail",
    auth: {
      user: 'icmobile.company@gmail.com',
      pass: process.env.USER_PASS,
    },
  });

  await transporter.sendMail({
    from: 'icmobile.company@gmail.com',
    to,
    subject: "Verify Your Email",
    html: `
      <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                }
                .email-container {
                    max-width: 500px;
                    background: #fff;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                    text-align: center;
                }
                h1 {
                    color: #333;
                    font-size: 22px;
                    margin-bottom: 10px;
                }
                p {
                    color: #555;
                    font-size: 16px;
                    line-height: 1.6;
                }
                .otp-code {
                    font-size: 28px;
                    font-weight: bold;
                    color: #4a90e2;
                    background: #f3f4f6;
                    padding: 15px;
                    border-radius: 8px;
                    display: inline-block;
                    letter-spacing: 5px;
                    margin: 20px 0;
                }
                .footer {
                    margin-top: 20px;
                    font-size: 13px;
                    color: #777;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <h1>🔐Verify Your Email</h1>
                <p>Hello <strong>${name}</strong>,</p>
                <p>Use the following OTP 🤫 to verify your email address:</p>
                <div class="otp-code">${otp}</div>
                <p>This code is valid for <strong>10 minutes</strong>.</p>
                <div class="footer">
                    <p>If you did not request this, please ignore this email.</p>
                    <p>&copy; 2025 IC MOBILE. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `,
  });

 
};

module.exports = sendOTPEmail;
