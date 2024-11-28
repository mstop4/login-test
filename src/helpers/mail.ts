import { Transporter, createTransport } from 'nodemailer';
import type { MailOptions } from 'nodemailer/lib/json-transport';

let transporter: Transporter;

export const createMailTransporter = () => {
  const transportOptions = {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    secure: true,
    logger: true,
    debug: true,
  };

  transporter = createTransport(transportOptions);
};

export const sendVerificationEmail = (mailOptions: MailOptions) => {
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(`Error: ${error}`);
    } else {
      console.log(`Email sent: ${info.response}`);
    }
  });
};
