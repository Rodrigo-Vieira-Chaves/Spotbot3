import 'reflect-metadata';
import * as dotenv from 'dotenv';

dotenv.config();

import { strategy } from '@strategy/strategy.factory';

strategy.start();
