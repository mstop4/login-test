import mongoose from 'mongoose';

export const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);
    console.log('MongoDB connected...');
  } catch (err) {
    console.log(err);
    return null;
  }
};
