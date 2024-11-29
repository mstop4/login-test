import dotenv from 'dotenv';
import path from 'path';
import express, { Express } from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import flash from 'connect-flash';
import { connectToDB } from './db';
import indexRouter from './routes/index';
import authRouter from './routes/auth';
import { createMailTransporter } from './helpers/mail';
import { setupLogger } from './helpers/logger';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

setupLogger(app);

app.use(
  bodyParser.urlencoded({
    limit: '5000mb',
    extended: true,
    parameterLimit: 100000000000,
  }),
);

app.use(cookieParser());
app.use(passport.initialize());

connectToDB();
app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URL,
    }),
  }),
);
app.use(passport.authenticate('session'));
app.use(flash());

createMailTransporter();

app.use('/', indexRouter);
app.use('/', authRouter);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
