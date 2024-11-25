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
  new LocalStrategy(async (email, password, cb) => {
    try {
      const user = await User.findOne({ email }).exec();

      if (!user) {
        return cb(null, false, { message: 'Incorrect email or password.' });
      }

      crypto.pbkdf2(
        password,
        user.salt,
        310000,
        32,
        'sha256',
        (err, hashedPassword) => {
          if (err) {
            return cb(err);
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

          return cb(null, user);
        },
      );
    } catch (err) {
      return cb(err);
    }
  }),
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

router.get('/login', (req, res) => res.render('login'));
router.post(
  '/login/password',
  passport.authenticate('local', {
    successRedirect: '/userPage',
    failureRedirect: '/no',
  }),
);
router.get('/userPage', (req, res) => res.render('userPage'));
router.get('/no', (req, res) => res.render('no'));

export default router;
