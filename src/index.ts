import dotEnvExtended from 'dotenv-extended';
import express, {Express} from 'express';

import {api} from './api';
import {getRedisClient} from './helpers/redis.helper';

dotEnvExtended.load();

const port = process.env.PORT ?? 3000;

export const app: Express = express();

app.use(express.json());

app.use('/api', api);

app.listen(port, async () => {
  await getRedisClient();
  console.log(`⚡️[Server]: Server is running at http://localhost:${port}`);
});
