import { Router } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import crypto from 'crypto';
import { User } from '../db/schemas/User';
import { sendVerificationLink } from './authController';

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
        username: req.body.username,
        email: req.body.email,
        salt: saltString,
        hash: hashString,
        verificationToken,
      });

      try {
        await newUser.save();
        sendVerificationLink(
          req.body.email,
          req.body.username,
          verificationToken,
        );
        res.redirect('/accountCreated');
      } catch (err) {
        return next(err);
      }
    },
  );
});

router.post('/resendVerificationEmail', async (req, res, next) => {
  if (!req.user) {
    return res.redirect('/login');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.redirect('/no');
  }

  const verificationToken = crypto.randomBytes(16).toString('hex');
  user.verificationToken = verificationToken;

  try {
    await user.save();
    sendVerificationLink(user.email, user.username, verificationToken);
    res.redirect('/verificationSent');
  } catch (err) {
    return next(err);
  }
});

router.get('/accountCreated', (req, res) => {
  res.render('accountCreated');
});

router.get('/verificationSent', (req, res) => {
  res.render('verificationSent');
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

  if (req.user) {
    res.redirect('/userPage');
  } else {
    res.redirect('/login');
  }
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
