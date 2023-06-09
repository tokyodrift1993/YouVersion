import express, {Request, Response, Router} from 'express';

export const status: Router = express.Router();

status.get('/', (req: Request, res: Response) => {
  res.sendStatus(200);
});
