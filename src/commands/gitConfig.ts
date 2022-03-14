import fs from 'fs';

import { Config } from '../types';

const gitConfig = async (cmdObj: any, config: Config, configFilePath: string) => {
  if (cmdObj.add && cmdObj.add.length === 2) {
    const configFile = JSON.stringify({
      ...config,
      git: { ...config.git, [cmdObj.add[0]]: cmdObj.add[1] },
    });
    fs.writeFileSync(configFilePath, configFile);
  } else {
    console.log(config.git);
  }
};

export default gitConfig;
