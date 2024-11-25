import { Router } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import crypto from 'crypto';
import { User } from '../db/schemas/User';

const router = Router();

passport.serializeUser((user, cb) => {
  process.nextTick(() => {
    cb(null, { id: user.id, email: user.email });
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

      const newUser = new User({
        email: req.body.email,
        salt: saltString,
        hash: hashString,
      });

      try {
        await newUser.save();
        req.login(newUser, err => {
          if (err) return next(err);
          res.redirect('/userPage');
        });
      } catch (err) {
        return next(err);
      }
    },
  );
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
router.get('/userPage', (req, res) => {
  console.log(req.flash('message'));
  console.log(req.session);
  return res.render('userPage');
});
router.get('/no', (req, res) => {
  console.log(req.flash('message'));
  res.render('no', { message: req.flash('message') });
});

export default router;
