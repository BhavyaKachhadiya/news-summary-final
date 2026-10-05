import mongoose from "mongoose";
import { env } from "@/lib/env";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables.");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log("[MongoDB] Connected successfully");
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error("[MongoDB] Connection error:", error);
    throw error;
  }

  return cached.conn;
}

export async function isDatabaseConnected(): Promise<boolean> {
  try {
    await connectToDatabase();
    return mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
}
