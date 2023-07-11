import {connect, createConnection, Mongoose} from 'mongoose';

let database: Mongoose;
let isReady: boolean;

export const getMongoDb = async (): Promise<Mongoose | null> => {
  if (process.env.USE_CACHING !== 'mongo') {
    return null;
  }

  if (!isReady) {
    const MONGO_DATABASE_URL = process.env.MONGO_DATABASE_URL || 'mongodb://youversion:youversion@127.0.0.1:27017/youversion';

    const connection = createConnection(MONGO_DATABASE_URL);

    connection.on('error', (err) => console.error(`💾[Mongo]: ${err}`));
    connection.on('connect', () => console.log(`💾[Mongo]: connected to ${MONGO_DATABASE_URL}!`));
    connection.on('connecting', () => console.log('💾[Mongo]: connecting...'));
    connection.on('reconnecting', () => console.log('💾[Mongo]: reconnecting...'));
    connection.on('connected', () => {
      isReady = true;
      console.log('💾[Mongo]: ready!');
    });

    try {
      await connection.openUri(MONGO_DATABASE_URL);
      database = await connect(MONGO_DATABASE_URL);
    } catch (err) {
      console.error(`💾[Mongo]: ${err}`);
    }
  }

  return database;
};
