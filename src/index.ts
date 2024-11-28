import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import express, { Express } from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import flash from 'connect-flash';
import { createStream } from 'rotating-file-stream';
import { connectToDB } from './db';
import indexRouter from './routes/index';
import authRouter from './routes/auth';
import { createMailTransporter } from './helpers/mail';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const logDir = path.resolve(process.cwd(), process.env.LOG_PATH || 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const rfsStream = createStream(process.env.LOG_FILENAME || 'logs/path.txt', {
  path: logDir,
  size: process.env.LOG_SIZE || '10M',
  interval: process.env.LOG_INTERVAL || '1d',
  compress: 'gzip',
});

app.use(
  morgan(process.env.LOG_FORMAT || 'combined', {
    stream: process.env.LOG_FILE ? rfsStream : process.stdout,
  }),
);

if (process.env.LOG_FILE) {
  app.use(morgan(process.env.LOG_FORMAT || 'combined'));
}

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
