#!/usr/bin/env node
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import moment from 'moment';
import keytar from 'keytar';
import fs from 'fs';
import { program } from 'commander';
import path from 'path';

let baseURL: URL;
let account: {
  tenantId: string;
};

const configFilePath: string = path.join(
  (process.env.LOCALAPPDATA || process.env.HOME) as string,
  '.tb-cli.config'
);

const readConfigFile = () => {
  let configFile = '{}';
  try {
    configFile = fs.readFileSync(configFilePath, { encoding: 'utf8' });
  } catch (e) {}
  return JSON.parse(configFile);
};

const config = readConfigFile();

const getBaseURL = () => {
  try {
    baseURL = new URL('/api', config.baseURL);
    axios.defaults.baseURL = baseURL.toString();
  } catch (e) {
    console.log("error: ThingsBoard URL is not set. set it by 'tb set-url <url>'");
    process.exit(1);
  }
};

const setBaseUrl = async (url: string) => {
  let tbData = { status: 0 };
  try {
    const { data } = await axios.get(`${url}/api`);
    tbData = data;
  } catch (e) {
    tbData = e.response.data;
  }
  if (tbData.status !== 401) {
    console.log('error: provided URL is not for ThingsBoard');
    process.exit(1);
  }

  baseURL = new URL('/api', url);
  config.baseURL = url;

  fs.writeFileSync(configFilePath, JSON.stringify(config));
};

const setToken = (token: string) => {
  account = jwtDecode(token);
  axios.defaults.headers.common = {
    'x-authorization': `Bearer ${token}`,
  };
};

const auth = async () => {
  const token = await keytar.findPassword('tb-token');
  const refreshToken = await keytar.findPassword('tb-refresh-token');

  if (token) {
    const decodedToken: any = jwtDecode(token);
    if (decodedToken.exp < moment().unix() - 60 && refreshToken) {
      if (refreshToken) {
        const { data } = await axios.post('/auth/token', { refreshToken });
        await keytar.setPassword('tb-token', 'default', data.token);
        await keytar.setPassword('tb-refresh-token', 'default', data.refreshToken);
        setToken(data.token);
        return;
      }
      console.log('Login token expired. Please login again by "tb login <username> <password>"');
      process.exit(1);
    }
    setToken(token);
    return;
  }

  console.log('You are not logged in. Please login by "tb login <username> <password>"');
  process.exit(1);
};

const login = async (username: string, password: string) => {
  const { data } = await axios.post('/auth/login', { username, password });
  await keytar.setPassword('tb-token', 'default', data.token);
  await keytar.setPassword('tb-refresh-token', 'default', data.refreshToken);
};

const logout = async () => {
  await keytar.deletePassword('tb-token', 'default');
  await keytar.deletePassword('tb-refresh-token', 'default');
};

const backup = async () => {
  const dir = `./backups/${moment().format('YYYY-MM-DD HH:mm:ss')}`;

  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(`${dir}/rules`);
  fs.mkdirSync(`${dir}/widgets`);
  fs.mkdirSync(`${dir}/dashboards`);
  fs.mkdirSync(`${dir}/devices/attributes`, { recursive: true });

  // Backup Rules
  const {
    data: { data: rules },
  } = await axios.get('/ruleChains?limit=1000&textSearch=');

  rules.forEach(async (rule: any) => {
    const { data: ruleData } = await axios.get(`/ruleChain/${rule.id.id}/metadata`);
    fs.writeFile(`${dir}/rules/${rule.name}.json`, JSON.stringify(ruleData), (err: any) => {
      if (err) throw err;
      // console.log(`Rule "${rule.name}" Saved!`);
    });
  });

  // Backup widgets
  const { data: widgetBundles } = await axios.get('/widgetsBundles');

  widgetBundles.forEach(async (widgetBundle: any) => {
    const { data: widgetBundleData } = await axios.get(
      `widgetTypes?isSystem=${account.tenantId !== widgetBundle.tenantId.id}&bundleAlias=${
        widgetBundle.alias
      }`
    );
    fs.writeFile(
      `${dir}/widgets/${widgetBundle.title}.json`,
      JSON.stringify(widgetBundleData),
      (err: any) => {
        if (err) throw err;
      }
    );

    const widgetsDir = `${dir}/widgets/${widgetBundle.title}`;
    fs.mkdirSync(widgetsDir);
    widgetBundleData.forEach((widget: any) => {
      fs.writeFile(`${widgetsDir}/${widget.name}.json`, JSON.stringify(widget), (err: any) => {
        if (err) throw err;
      });
    });
  });

  // Backup Dashboards
  const {
    data: { data: dashboards },
  } = await axios.get('/tenant/dashboards?limit=1000&textSearch=');

  dashboards.forEach(async (dashboard: any) => {
    const { data: dashboardData } = await axios.get(`/dashboard/${dashboard.id.id}`);
    fs.writeFile(
      `${dir}/dashboards/${dashboard.name}.json`,
      JSON.stringify(dashboardData),
      (err: any) => {
        if (err) throw err;
      }
    );
  });

  // Backup device attributes
  const {
    data: { data: devices },
  } = await axios.get('/tenant/devices?limit=1000&textSearch=');

  const attributeKeys = [
    'automation',
    'activityCheck',
    'filterKeys',
    'inactivitySMS',
    'inactivityTimeout',
    'passageCheck',
    'passageKeys',
    'passageSMS',
    'passageTimeout',
    'phoneNumber',
    'rules',
    'schedule',
    'TH_MAX',
    'TH_MIN',
    'TM_MAX',
    'TH_MIN',
  ];

  devices.forEach(async (device: any) => {
    const { data: attributes } = await axios.get(
      `/plugins/telemetry/DEVICE/${device.id.id}/values/attributes/SERVER_SCOPE`
    );
    const desiredAttributes = attributes.filter(({ key }: { key: string }) =>
      attributeKeys.includes(key)
    );
    desiredAttributes.forEach((item: any) => {
      delete item.lastUpdateTs;
    });

    fs.writeFile(
      `${dir}/devices/attributes/${device.name}.json`,
      JSON.stringify(desiredAttributes),
      (err: any) => {
        if (err) throw err;
      }
    );
  });
};

const clone = async (dashboardName: string, deviceName: string, name?: string) => {
  const {
    data: { data: dashboards },
  } = await axios.get(`/tenant/dashboards?limit=1&textSearch=${dashboardName}`);

  if (!dashboards[0]) {
    console.log(`Dashboard ${dashboardName} not found!`);
    process.exit(1);
  }
  const dashboard = dashboards[0];

  const {
    data: { data: devices },
  } = await axios.get(`/tenant/devices?limit=1&textSearch=${deviceName}`);

  if (!devices[0]) {
    console.log(`Devices ${deviceName} not found!`);
    process.exit(1);
  }
  const device = devices[0];

  const clonedDashboardName = name || device.name;

  const { data: dashboardData } = await axios.get(`/dashboard/${dashboard.id.id}`);
  const dashboardEntityAliasID = Object.keys(dashboardData.configuration.entityAliases)[0];
  dashboardData.configuration.entityAliases[dashboardEntityAliasID].filter.singleEntity.id =
    device.id.id;
  dashboardData.configuration.entityAliases[dashboardEntityAliasID].alias = device.name;
  dashboardData.name = dashboardData.title = dashboardData.configuration.states.default.name = clonedDashboardName;
  delete dashboardData.id;

  await axios.post('dashboard', dashboardData);

  console.log(`Dashboard ${clonedDashboardName} created successfully`);
};

program
  .command('set-url <url>')
  .description('Set ThingsBoard URL')
  .action(async (url: string) => {
    setBaseUrl(url);
  });

program
  .command('login <username> <password>')
  .description('Login to ThingsBoard')
  .action(async (username: string, password: string) => {
    getBaseURL();
    await login(username, password);
  });

program
  .command('logout')
  .description('logout from ThingsBoard')
  .action(async () => {
    await logout();
  });

program
  .command('backup')
  .description('Backup ThingsBoard Rules, Widgets & Dashboards')
  .action(async () => {
    getBaseURL();
    await auth();
    await backup();
  });

program
  .passCommandToAction(false)
  .storeOptionsAsProperties(false)
  .command('clone <dashboardName> <deviceName>')
  .option('-n, --name <name>', 'Name of Cloned Dashboard')
  .description('Clone ThingsBoard Dashboards')
  .action(async (dashboardName: string, deviceName: string, cmdObj?: any) => {
    getBaseURL();
    await auth();
    await clone(dashboardName.toLowerCase(), deviceName.toLowerCase(), cmdObj.name);
  });

program.parse(process.argv);
