import {createClient, RedisClientType} from 'redis';

export const REDIS_VERSE_EXPIRATION = () => Number(process.env.REDIS_VERSE_EXPRIRATION ?? 86400);

let redisClient: RedisClientType;
let isReady: boolean;

export const getRedisClient = async (): Promise<RedisClientType | null> => {
  if (process.env.USE_CACHING !== 'redis') {
    return null;
  }

  if (!isReady) {
    const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = createClient({url: REDIS_URL});

    redisClient.on('error', (err) => console.error(`💾[Redis]: ${err}`));
    redisClient.on('connect', () => console.log(`💾[Redis]: connected to ${REDIS_URL}!`));
    redisClient.on('reconnecting', () => console.log('💾[Redis]: reconnecting...'));
    redisClient.on('ready', () => {
      isReady = true;
      console.log('💾[Redis]: ready!');
      console.log(`💾[Redis]: verses cached for ${REDIS_VERSE_EXPIRATION()} seconds!`);
    });

    await redisClient.connect();
  }

  return redisClient;
};
