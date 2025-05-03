const nodemailer = require('nodemailer');

const sendOTPEmail = async ({ to, name, otp }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: 'icmobile.company@gmail.com',
        pass: 'jcuu qwsh jvpe ncaz', 
      },
    });

    await transporter.sendMail({
      from: 'IC Mobile <icmobile.company@gmail.com>',
      to,
      subject: "رمز التحقق الخاص بك",
      text: `مرحبًا ${name}، رمز التحقق الخاص بك هو: ${otp}. صالح لمدة 10 دقائق.`,
      html: `
        <!DOCTYPE html>
        <html lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background: #f9f9f9;
              margin: 0;
              padding: 0;
            }
            .email-container {
              max-width: 500px;
              margin: 50px auto;
              background: #fff;
              padding: 30px;
              border-radius: 15px;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
              text-align: center;
            }
            h1 {
              color: #4a90e2;
              margin-bottom: 20px;
            }
            .otp-code {
              font-size: 30px;
              font-weight: bold;
              color: #333;
              background: #f0f0f0;
              padding: 15px 25px;
              border-radius: 10px;
              display: inline-block;
              letter-spacing: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <h1>تأكيد البريد الإلكتروني</h1>
            <p>مرحبًا <strong>${name}</strong>،</p>
            <p>رمز التحقق الخاص بك هو:</p>
            <div class="otp-code">${otp}</div>
            <p>الرمز صالح لمدة <strong>10 دقائق</strong>.</p>
            <div class="footer">
              <p>إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة.</p>
              <p>&copy; 2025 IC Mobile. جميع الحقوق محفوظة.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(" Email sent successfully to:", to);
  } catch (error) {
    console.error(" Error sending email:", error.message);
    console.error(error);
  }
};

module.exports = sendOTPEmail;
