import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    console.log('MONGODB_URI:', process.env.MONGO_URI); // debug
    await mongoose.connect(process.env.MONGO_URI); // no options needed
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

export default connectDB;
