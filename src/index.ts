#!/usr/bin/env node
import axios from 'axios';
import { program } from 'commander';
import https from 'https';

import {
  backup,
  clone,
  convert,
  gitConfig,
  label,
  login,
  logout,
  restore,
  setBaseUrl,
} from './commands';
import { auth, configFilePath, readConfigFile } from './utils';

let storeKey = '';

const config = readConfigFile();

const getBaseURL = () => {
  try {
    config.baseURL = new URL('/api', config.baseURL);
    axios.defaults.baseURL = config.baseURL.toString();
    storeKey = config.baseURL.host;

    if (config.insecure) {
      axios.defaults.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    }
  } catch (e) {
    console.log("error: ThingsBoard URL not found. Set it by 'tb set-url <url>'");
    process.exit(1);
  }
};

program
  .command('set-url <url>')
  .description('Set ThingsBoard URL')
  .option('-k, --insecure', 'Allow insecure server connections when using SSL')
  .action(async (url: string, cmdObj?: any) => {
    setBaseUrl(url, cmdObj.insecure, config, configFilePath);
  });

program
  .command('login')
  .description('Login to ThingsBoard')
  .action(async () => {
    getBaseURL();
    await login(storeKey);
  });

program
  .command('logout')
  .description('logout from ThingsBoard')
  .action(async () => {
    getBaseURL();
    await logout(storeKey);
  });

program
  .command('git-config')
  .description('Git configs used for backups repository')
  .option('--add <value...>', 'add a new variable: name value')
  .action(async (cmdObj: any) => {
    gitConfig(cmdObj, config, configFilePath);
  });

program
  .command('backup')
  .option('-o, --output <directory>', 'Directory to store backups')
  .description('Backup Rule Chains, Widgets & Dashboards')
  .action(async (cmdObj?: any) => {
    getBaseURL();
    await auth(storeKey);
    await backup(cmdObj.output, config);
  });

program
  .command('restore')
  .option('-i, --input <directory>', 'Directory to restore data from')
  .option('-b, --dashboards', 'Restore dashboards')
  .option('-r, --rulechains', 'Restore rule chains')
  .option('-w, --widgets', 'Restore widgets')
  .option('-d, --devices', 'Restore devices')
  .description('Restore backup data')
  .action(async (cmdObj: any) => {
    getBaseURL();
    await auth(storeKey);

    const ALL_OPTIONS = ['dashboards', 'rulechains', 'widgets', 'devices'];
    let options = ALL_OPTIONS.filter(option => cmdObj[option]);
    options = options.length > 0 ? options : ALL_OPTIONS;

    await restore(cmdObj.input, options);
  });

program
  .storeOptionsAsProperties(false)
  .command('clone <dashboardName> <deviceName>')
  .option('-n, --name <name>', 'Name of Cloned Dashboard')
  .description('Clone Dashboards')
  .action(async (dashboardName: string, deviceName: string, cmdObj?: any) => {
    getBaseURL();
    await auth(storeKey);
    await clone(dashboardName.toLowerCase(), deviceName.toLowerCase(), cmdObj.name);
  });

program
  .command('label <dashboardName> <deviceName>')
  .description('Update Dashboard labels')
  .action(async (dashboardName: string, deviceName: string) => {
    getBaseURL();
    await auth(storeKey);
    await label(dashboardName.toLowerCase(), deviceName.toLowerCase());
  });

program
  .command('convert <input>')
  .option('-o, --output <directory>', 'Directory to store converted data')
  .description('Convert Rule Chains, Widgets & Dashboards from TB v2 to v3')
  .action(async (input: string, cmdObj?: any) => {
    getBaseURL();
    await auth(storeKey);
    await convert(input, cmdObj.output);
  });

program.parse(process.argv);
