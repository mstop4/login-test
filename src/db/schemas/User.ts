import type { Document } from 'mongoose';
import { Schema, model } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  salt: string;
  hash: string;
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
