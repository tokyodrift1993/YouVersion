import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

import {ConfigurationFile} from '../interfaces/configuration.interface';

export const getConfigurationFile = async (configFilePath: string) =>
  yaml.load(await fs.promises.readFile(path.resolve(configFilePath), 'utf8')) as ConfigurationFile;
