import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

import {ConfigurationFile} from '../interfaces/configuration.interface';

export const getConfigurationFile = async (configFilePath: string) =>
  yaml.load(await fs.promises.readFile(path.resolve(configFilePath), 'utf8')) as ConfigurationFile;
