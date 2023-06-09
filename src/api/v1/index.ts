import express, {Router} from 'express';

import {status} from './status';
import {verse} from './verse';

export const v1: Router = express.Router();

v1.use('/status', status);
v1.use('/verse', verse);
