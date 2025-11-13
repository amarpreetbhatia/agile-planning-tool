import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

type MongoClientCache = {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
};

declare global {
  var mongoose: MongooseCache | undefined;
  var mongoClient: MongoClientCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI && process.env.NODE_ENV !== 'production') {
  console.warn('Warning: MONGODB_URI environment variable is not defined. Database features will not work.');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// MongoDB client for Auth.js adapter
let clientCached: MongoClientCache = global.mongoClient || { client: null, promise: null };

if (!global.mongoClient) {
  global.mongoClient = clientCached;
}

async function getMongoClient(): Promise<MongoClient> {
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  if (clientCached.client) {
    return clientCached.client;
  }

  if (!clientCached.promise) {
    const client = new MongoClient(MONGODB_URI);
    clientCached.promise = client.connect();
  }

  try {
    clientCached.client = await clientCached.promise;
  } catch (e) {
    clientCached.promise = null;
    throw e;
  }

  return clientCached.client;
}

// Export a promise that resolves to the MongoClient for Auth.js adapter
export const clientPromise = getMongoClient();

export default connectDB;
