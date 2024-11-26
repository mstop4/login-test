import { Router } from 'express';
import { User } from '../db/schemas/User';
import { sendEmail } from '../helpers/mail';
import type { MailOptions } from 'nodemailer/lib/json-transport';

const router = Router();

router.get('/', (req, res) => res.render('index'));

router.get('/userPage', async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect('login'); // Redirect if not authenticated
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.redirect('login');
    }

    return res.render('userPage', {
      user: {
        username: user.username,
        email: user.email,
        verified: user.verified,
      },
    });
  } catch (err) {
    console.error('Error fetching user data:', err);
    return res.redirect('no');
  }
});
router.get('/no', (req, res) => {
  console.log(req.flash('message'));
  res.render('no', { message: req.flash('message') });
});

router.post('/testmailer', (req, res) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: req.body.recipientEmail,
    subject: 'Sending Email using Node.js',
    text: 'That was easy!',
  } as MailOptions;

  console.log(mailOptions);

  sendEmail(mailOptions);
  res.send('Yee');
});

export default router;
