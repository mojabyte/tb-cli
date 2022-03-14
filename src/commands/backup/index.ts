import fs from 'fs';
import fsPromise from 'fs/promises';
import git from 'isomorphic-git';
import moment from 'moment';
import path from 'path';

import * as api from '../../services';
import gitignore from '../../data/gitignore';
import { parsedToken, setToken } from '../../utils';
import { Config } from '../../types';
import { backupTenants } from './backupTenants';
import { backupRuleChains } from './backupRuleChains';
import { backupWidgets } from './backupWidgets';
import { backupDashboards } from './backupDashboards';
import { backupDevices } from './backupDevices';
import { backupCustomers } from './backupCustomers';

// TODO: Implement paginated fetch to improve backups
// TODO: backup use export/download API
const backup = async (output: string, config: Config) => {
  let baseDir = output || './backups';
  baseDir = path.join(baseDir, config.baseURL?.host || '');

  await fsPromise.mkdir(baseDir, { recursive: true });

  let doCommit = false;

  if (config.git && config.git['user.name'] && config.git['user.email']) {
    const gitRoot = await git.findRoot({ fs, filepath: baseDir });

    if (gitRoot !== baseDir) {
      await git.init({ fs, dir: baseDir });

      await git.setConfig({ fs, dir: baseDir, path: 'user.name', value: config.git['user.name'] });
      await git.setConfig({
        fs,
        dir: baseDir,
        path: 'user.email',
        value: config.git['user.email'],
      });

      await fsPromise.writeFile(path.join(baseDir, '.gitignore'), gitignore);
    }

    doCommit = true;
  } else {
    console.log('Add git user configs to initialize git repository and commit automatically:');
    console.log('tb git-config --add user.name <git user name>');
    console.log('tb git-config --add user.email <git user email>');
  }

  let tenants: {
    id: { id: string };
    name: string;
  }[] = [];

  let tenantTokens = new Map<string, string>();

  if (parsedToken.scopes[0] === 'SYS_ADMIN') {
    console.log('******** SysAdmin ********');

    const dirs = ['tenants'];

    // TODO: Create a new temp directory and replace the current one on success and remove it on fail
    await Promise.all(
      dirs.map(
        dir =>
          new Promise<void>((resolve, reject) => {
            const currentDir = path.join(baseDir, dir);
            fsPromise
              .rm(currentDir, { recursive: true, force: true })
              .then(() => {
                fsPromise.mkdir(currentDir).then(resolve);
              })
              .catch(reject);
          })
      )
    );

    // Backup tenants and their admins
    const { tenants: tenantsList, tenantAdmins } = await backupTenants(baseDir);
    tenants = tenantsList;

    // Get token of first tenant admin of each tenant
    await Promise.all(
      Array.from(tenantAdmins).map(
        ([tenantId, adminId]: [string, string]) =>
          new Promise<void>((resolve, reject) => {
            api
              .getUserToken(adminId)
              .then(({ data: { token } }) => {
                tenantTokens.set(tenantId, token);
                resolve();
              })
              .catch(e => {
                console.log(e.response.message);
                reject(e);
              });
          })
      )
    );
  } else if (parsedToken.scopes[0] === 'TENANT_ADMIN') {
    const { data: tenant } = await api.getTenantById(parsedToken.tenantId);
    tenants = [tenant];
  } else {
    console.log('Please login with a Tenant or a SysAdmin account!');
  }

  for (const tenant of tenants) {
    const token = tenantTokens.get(tenant.id.id);
    if (token) {
      setToken(token);
    }

    console.log(`******** Tenant ${tenant.name} ********`);
    const tenantDir = path.join(baseDir, 'tenants', tenant.name);
    await fsPromise.mkdir(tenantDir, { recursive: true });
    const dirs = ['ruleChains', 'widgets', 'dashboards', 'devices', 'customers'];

    await Promise.all(
      dirs.map(
        dir =>
          new Promise<void>((resolve, reject) => {
            const currentDir = path.join(tenantDir, dir);
            fsPromise
              .rm(currentDir, { recursive: true, force: true })
              .then(() => {
                fsPromise.mkdir(currentDir).then(resolve);
              })
              .catch(reject);
          })
      )
    );

    // Backup RuleChains
    await backupRuleChains(tenantDir);

    // Backup widgets
    await backupWidgets(tenantDir, parsedToken.tenantId);

    // Backup Dashboards
    await backupDashboards(tenantDir);

    // Backup Devices
    await backupDevices(tenantDir);

    // Backup Devices
    await backupCustomers(tenantDir);

    // TODO: Add backup assets
  }

  if (doCommit) {
    // Add & Commit backup changes
    git.add({ fs, dir: baseDir, filepath: '.' });
    git.commit({
      fs,
      dir: baseDir,
      message: `backup ${moment().format('DD-MM-YYYY HH:mm')}`,
    });
  }

  console.log('Done!');
};

export default backup;
