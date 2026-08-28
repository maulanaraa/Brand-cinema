import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

export const connectTestDatabase = async (): Promise<void> => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await mongoose.connect(process.env.MONGO_URI);
};

export const disconnectTestDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};

export const clearTestDatabase = async (): Promise<void> => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
};
