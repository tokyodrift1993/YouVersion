import express, {Router} from 'express';

import {v1} from './v1';

export const api: Router = express.Router();

api.use('/v1', v1);
