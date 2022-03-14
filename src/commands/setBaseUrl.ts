import axios from 'axios';
import fs from 'fs';
import https from 'https';

import { Config } from '../types';

const setBaseUrl = async (
  url: string,
  insecure: boolean,
  config: Config,
  configFilePath: string
) => {
  let tbData = { status: 0, message: '' };
  if (insecure) {
    axios.defaults.httpsAgent = new https.Agent({ rejectUnauthorized: false });
  }

  try {
    const { data } = await axios.get(`${url}/api`);
    tbData = data;
  } catch (e) {
    tbData = e?.response?.data;
  }

  if (!(tbData?.status === 401) && !(tbData?.message === 'Authentication failed')) {
    console.log('error: provided URL is not for ThingsBoard');
    process.exit(1);
  }

  const configFile = JSON.stringify({ ...config, baseURL: url, insecure });
  fs.writeFileSync(configFilePath, configFile);

  config.baseURL = new URL('/api', url);
  console.log(`URL set successfully to "${url}"`);
};

export default setBaseUrl;
