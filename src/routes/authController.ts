import { sendVerificationEmail } from '../helpers/mail';
import type { MailOptions } from 'nodemailer/lib/json-transport';

export const sendVerificationLink = (
  email: string,
  username: string,
  token: string,
) => {
  const mailOptions = {
    from: `"Login Test" ${process.env.EMAIL_FROM}`,
    to: email,
    subject: 'Verify your account',
    text: `Hello ${username}!\n\nClick on the link to verify your account: ${process.env.BASE_URL}/verifyAccount?token=${token}\n\nIf you believe you received this email by mistake, please ignore it.`,
    html: `<p>Hello ${username}!</p><p>Click on the link below to verify your account:</p><p><a href="${process.env.BASE_URL}/verifyAccount?token=${token}">Verify your account</a></p><p>If you believe you received this email by mistake, please ignore it.</p>`,
  } as MailOptions;

  sendVerificationEmail(mailOptions);
};
