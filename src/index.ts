import express, { Express } from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { connectToDB } from './db';
import indexRouter from './routes/index';
import authRouter from './routes/auth';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(morgan('combined'));

app.use('/', indexRouter);
app.use('/', authRouter);

connectToDB();

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
