import mongoose from 'mongoose';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

/**
 * Connects to MongoDB. Throws if the connection cannot be established within 10 seconds.
 */
export async function connectDB() {
  try {
    await mongoose.connect(config.db.uri, { serverSelectionTimeoutMS: 10_000 });
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.error('Failed to connect to MongoDB:', err.message);
    throw err;
  }
}
