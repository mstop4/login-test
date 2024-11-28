import { Router } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import crypto from 'crypto';
import { User } from '../db/schemas/User';
import { sendVerificationEmail } from '../helpers/mail';
import type { MailOptions } from 'nodemailer/lib/json-transport';

const router = Router();

passport.serializeUser((user, cb) => {
  process.nextTick(() => {
    cb(null, { id: user.id });
  });
});

passport.deserializeUser((user: Express.User, cb) => {
  process.nextTick(() => {
    return cb(null, user);
  });
});

passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' }, // Specify custom fields
    async (email, password, cb) => {
      try {
        const user = await User.findOne({ email }).exec();

        if (!user) {
          return cb(null, false, { message: 'Incorrect email or password.' });
        }

        crypto.pbkdf2(
          password,
          Buffer.from(user.salt, 'hex'),
          310000,
          32,
          'sha256',
          (err, hashedPassword) => {
            if (err) {
              return cb(err, false, { message: 'Hash error' });
            }

            if (
              !crypto.timingSafeEqual(
                Buffer.from(user.hash, 'hex'),
                hashedPassword,
              )
            ) {
              return cb(null, false, {
                message: 'Incorrect email or password.',
              });
            }

            return cb(null, user, {
              message: 'OK.',
            });
          },
        );
      } catch (err) {
        return cb(err, false, {
          message: 'Server Error',
        });
      }
    },
  ),
);

router.get('/signup', (req, res) => res.render('signup'));

router.post('/signup', (req, res, next) => {
  const salt = crypto.randomBytes(16);

  crypto.pbkdf2(
    req.body.password,
    salt,
    310000,
    32,
    'sha256',
    async (err, hashedPassword) => {
      if (err) return next(err);

      const hashString = hashedPassword.toString('hex');
      const saltString = salt.toString('hex');
      const verificationToken = crypto.randomBytes(16).toString('hex');

      const newUser = new User({
        email: req.body.email,
        salt: saltString,
        hash: hashString,
        verificationToken,
      });

      try {
        await newUser.save();

        const mailOptions = {
          from: `"Login Test" ${process.env.EMAIL_FROM}`,
          to: req.body.email,
          subject: 'Verify your account',
          text: `Click on the link to verify your account: ${process.env.BASE_URL}/verifyAccount?token=${verificationToken}\n\nIf you believe you received this email by mistake, please ignore it.`,
          html: `<p>Click on the link below to verify your account:</p><p><a href="${process.env.BASE_URL}/verifyAccount?token=${verificationToken}">Verify your account</a></p><p>If you believe you received this email by mistake, please ignore it.</p>`,
        } as MailOptions;

        sendVerificationEmail(mailOptions);

        req.login(newUser, err => {
          if (err) return next(err);
          res.redirect('/accountCreated');
        });
      } catch (err) {
        return next(err);
      }
    },
  );
});

router.get('/accountCreated', (req, res) => {
  res.render('accountCreated');
});

router.get('/invalidToken', (req, res) => {
  res.render('invalidToken');
});

router.get('/verifyAccount', async (req, res) => {
  const { token } = req.query;
  const user = await User.findOne({ verificationToken: token });

  if (!user) {
    return res.redirect('/invalidToken');
  }

  user.verified = true;
  user.verificationToken = '';
  user.save();

  res.redirect('/userPage');
});

router.get('/login', (req, res) => {
  console.log(req.flash('message'));
  res.render('login');
});

router.post(
  '/login/password',
  passport.authenticate('local', {
    successRedirect: '/userPage',
    failureRedirect: '/no',
    successFlash: true,
    failureFlash: true,
  }),
);

router.post('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

export default router;
