import dotenv from 'dotenv';

dotenv.config();

if (!process.env.MONGO_URI) {
  console.error('Error: MONGO_URI is not defined in environment variables');
  process.exit(1); // Exit process with failure
}

if (!process.env.JWT_SECRET) {  
  console.error('Error: JWT_SECRET is not defined in environment variables');
  process.exit(1); // Exit process with failure
}

const config = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
};

export default config;