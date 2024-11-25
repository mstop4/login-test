import { Router } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import crypto from 'crypto';
import { User } from '../db/schemas/User';

const router = Router();

passport.use(
  new LocalStrategy(async (username, password, cb) => {
    try {
      console.log('Log in');
      const user = await User.findOne({ username }).exec();

      if (!user) {
        console.log('User not found');
        return cb(null, false, { message: 'Incorrect username or password.' });
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
            console.log('Password incorrect');
            return cb(null, false, {
              message: 'Incorrect username or password.',
            });
          }

          console.log('OK');
          return cb(null, user);
        },
      );
    } catch (err) {
      return cb(err);
    }
  }),
);

router.get('/login', (req, res) => res.render('login'));
router.post(
  '/login/password',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/no',
  }),
);
router.get('/no', (req, res) => res.render('no'));

export default router;
