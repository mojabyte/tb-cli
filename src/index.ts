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
    if (decodedToken.exp > moment().unix() + 60) {
      setToken(token);
    } else if (refreshToken) {
      const decodedRefreshToken: any = jwtDecode(refreshToken);
      if (decodedRefreshToken.exp > moment().unix() + 10) {
        // ! This API call is not working
        const { data } = await axios.post('/auth/token', { refreshToken });
        await keytar.setPassword('tb-token', 'default', data.token);
        await keytar.setPassword('tb-refresh-token', 'default', data.refreshToken);
        setToken(data.token);
      } else {
        console.log('Login token expired. Please login again by "tb login <username> <password>"');
        process.exit(1);
      }
    } else {
      console.log('Login token expired. Please login again by "tb login <username> <password>"');
      process.exit(1);
    }
  } else {
    console.log('You are not logged in. Please login by "tb login <username> <password>"');
    process.exit(1);
  }
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

const backup = async (output: string) => {
  const baseDir = output || './backups';
  const dir = `${baseDir}/${moment()
    .format('YY-MM-DD HH:mm:ss')
    .replace(/[^0-9]/g, '')}`;

  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(`${dir}/ruleChains`);
  fs.mkdirSync(`${dir}/widgets`);
  fs.mkdirSync(`${dir}/dashboards`);
  fs.mkdirSync(`${dir}/devices/attributes`, { recursive: true });

  // Backup Rule Chains
  const {
    data: { data: ruleChains },
  } = await axios.get('/ruleChains?limit=1000&textSearch=');

  ruleChains.forEach(async (ruleChain: any) => {
    const { data: ruleChainData } = await axios.get(`/ruleChain/${ruleChain.id.id}/metadata`);
    fs.writeFile(
      `${dir}/ruleChains/${ruleChain.name}.json`,
      JSON.stringify(ruleChainData),
      (err: any) => {
        if (err) throw err;
        // console.log(`Rule "${ruleChain.name}" Saved!`);
      }
    );
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

  devices.forEach(async (device: any) => {
    const { data: serverAttributes } = await axios.get(
      `/plugins/telemetry/DEVICE/${device.id.id}/values/attributes/SERVER_SCOPE`
    );
    serverAttributes.forEach((item: any) => {
      delete item.lastUpdateTs;
    });

    const { data: sharedAttributes } = await axios.get(
      `/plugins/telemetry/DEVICE/${device.id.id}/values/attributes/SERVER_SCOPE`
    );
    sharedAttributes.forEach((item: any) => {
      delete item.lastUpdateTs;
    });

    const { data: clientAttributes } = await axios.get(
      `/plugins/telemetry/DEVICE/${device.id.id}/values/attributes/CLIENT_SCOPE`
    );
    clientAttributes.forEach((item: any) => {
      delete item.lastUpdateTs;
    });

    const attributes = {
      server: serverAttributes,
      shared: sharedAttributes,
      client: clientAttributes,
    };

    fs.writeFile(
      `${dir}/devices/attributes/${device.name}.json`,
      JSON.stringify(attributes),
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
    console.log(`Device ${deviceName} not found!`);
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

const label = async (dashboardName: string, deviceName: string) => {
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
    console.log(`Device ${deviceName} not found!`);
    process.exit(1);
  }
  const device = devices[0];

  const { data: attributes } = await axios.get(
    `/plugins/telemetry/DEVICE/${device.id.id}/values/attributes?keys=labels`
  );
  const labels = JSON.parse(attributes[0].value);

  const { data: dashboardData } = await axios.get(`/dashboard/${dashboard.id.id}`);

  const { widgets } = dashboardData.configuration;

  Object.keys(widgets).forEach(widgetID => {
    const widget = widgets[widgetID];
    if (widget.type === 'rpc') {
      const { valueKey, valueAttribute } = widget.config.settings;
      widget.config.title = labels[valueKey || valueAttribute];
    } else if (widget.type === 'latest' || 'timeseries') {
      if (widget.config.datasources.length === 1) {
        widget.config.title =
          labels[widget.config.datasources[0].dataKeys[0].name] || widget.config.title;
      } else {
        widget.config.datasources.forEach(({ dataKeys }: any, i: number) => {
          dataKeys.forEach(({ name }: { name: string }, j: number) => {
            widget.config.datasources[i].dataKeys[j].label =
              labels[name] || widget.config.datasources[i].dataKeys[j].label;
          });
        });
      }
    }
    widgets[widgetID] = widget;
  });

  dashboardData.configuration.widgets = widgets;

  await axios.post('dashboard', dashboardData);

  console.log(`Dashboard ${dashboardName} labeled successfully`);
};

const convert = async (input: string, output: string) => {
  const baseDir = output || './converts';
  const dir = `${baseDir}/${moment()
    .format('YY-MM-DD HH:mm:ss')
    .replace(/[^0-9]/g, '')}`;

  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(`${dir}/ruleChains`);
  fs.mkdirSync(`${dir}/widgets`);
  fs.mkdirSync(`${dir}/dashboards`);

  // Convert Rule Chains
  fs.readdir(`${input}/ruleChains`, (err, filenames) => {
    if (err) {
      throw err;
    }
    filenames.forEach(filename => {
      fs.readFile(`${input}/ruleChains/${filename}`, 'utf-8', (err, content) => {
        if (err) {
          throw err;
        }
        const ruleChain = JSON.parse(content);
        delete ruleChain.ruleChainId;
        ruleChain.nodes.forEach((_node: any, index: number) => {
          delete ruleChain.nodes[index].id;
          delete ruleChain.nodes[index].createdTime;
          delete ruleChain.nodes[index].ruleChainId;
        });
        const convertedRuleChain = {
          ruleChain: {
            additionalInfo: null,
            name: path.parse(filename).name,
            firstRuleNodeId: null,
            root: false,
            debugMode: false,
            configuration: null,
          },
          metadata: ruleChain,
        };
        fs.writeFile(
          `${dir}/ruleChains/${filename}`,
          JSON.stringify(convertedRuleChain),
          (err: any) => {
            if (err) throw err;
          }
        );
      });
    });
  });
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
  .option('-o, --output <directory>', 'Directory to store backups')
  .description('Backup Rule Chains, Widgets & Dashboards')
  .action(async (cmdObj?: any) => {
    getBaseURL();
    await auth();
    await backup(cmdObj.output);
  });

program
  .passCommandToAction(false)
  .storeOptionsAsProperties(false)
  .command('clone <dashboardName> <deviceName>')
  .option('-n, --name <name>', 'Name of Cloned Dashboard')
  .description('Clone Dashboards')
  .action(async (dashboardName: string, deviceName: string, cmdObj?: any) => {
    getBaseURL();
    await auth();
    await clone(dashboardName.toLowerCase(), deviceName.toLowerCase(), cmdObj.name);
  });

program
  .command('label <dashboardName> <deviceName>')
  .description('Update Dashboard labels')
  .action(async (dashboardName: string, deviceName: string) => {
    getBaseURL();
    await auth();
    await label(dashboardName.toLowerCase(), deviceName.toLowerCase());
  });

program
  .command('convert <input>')
  .option('-o, --output <directory>', 'Directory to store converted data')
  .description('Convert Rule Chains, Widgets & Dashboards from TB v2 to v3')
  .action(async (input: string, cmdObj?: any) => {
    getBaseURL();
    await auth();
    await convert(input, cmdObj.output);
  });

program.parse(process.argv);
