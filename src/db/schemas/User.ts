import 'express';
import type { ObjectId } from 'mongoose';
import { Schema, model } from 'mongoose';

export interface IUser {
  id: ObjectId;
  username: string;
  email: string;
  salt: string;
  hash: string;
}

declare global {
  namespace Express {
    interface User extends IUser {}
  }
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    default: 'User',
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  salt: {
    type: String,
    required: true,
  },
  hash: {
    type: String,
    required: true,
  },
});

export const User = model('User', userSchema);
