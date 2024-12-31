import { Router } from 'express';
import { User } from '../db/schemas/User';
import { oops } from './indexController';

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

router.get('/error', (req, res, next) => {
  try {
    oops();
    res.json('ok');
  } catch (err) {
    next(err);
  }
});

export default router;
