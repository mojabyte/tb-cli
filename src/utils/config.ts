import fs from 'fs';
import path from 'path';

import { Config } from '../types';

export const configFilePath: string = path.join(
  (process.env.LOCALAPPDATA || process.env.HOME) as string,
  '.tb-cli.config'
);

export const readConfigFile = (): Config => {
  try {
    const configFile = fs.readFileSync(configFilePath, { encoding: 'utf8' });
    return JSON.parse(configFile);
  } catch (e) {
    return {};
  }
};
