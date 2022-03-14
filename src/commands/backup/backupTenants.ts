import fsPromise from 'fs/promises';
import path from 'path';

import { getEntityUsers, getTenants } from '../../services';
import { Tenant, User } from '../../types';

const backupTenantAdmins = async (tenant: Tenant, baseDir: string) => {
  let page = 0;
  let hasNext = true;
  let users: User[] = [];

  while (hasNext) {
    const { data } = await getEntityUsers('tenant', tenant.id.id, { page, pageSize: 100 });
    users = [...users, ...data.data];
    hasNext = data.hasNext;

    const dir = path.join(baseDir, 'tenants', tenant.name, 'admins');
    await fsPromise.mkdir(dir, { recursive: true });

    for (const user of data.data) {
      // const { data: userData } = await getUserById(user.id.id);
      await fsPromise.writeFile(
        path.join(dir, `${user.name}.json`),
        JSON.stringify(user, undefined, 2)
      );
    }

    page += 1;
  }

  return users[0]?.id.id;
};

export const backupTenants = async (baseDir: string) => {
  console.log('Backup Tenants...');

  let tenants: Tenant[] = [];
  let tenantAdmins = new Map<string, string>();

  try {
    let page = 0;
    let hasNext = true;

    while (hasNext) {
      const { data } = await getTenants({ page, pageSize: 100 });
      tenants = [...tenants, ...data.data];
      hasNext = data.hasNext;

      for (const tenant of data.data) {
        console.log(`> Backup ${tenant.name}...`);

        // const { data: tenantData } = await getTenantById(tenant.id.id);
        await fsPromise.writeFile(
          path.join(baseDir, 'tenants', `${tenant.name}.json`),
          JSON.stringify(tenant, undefined, 2)
        );

        const tenantAdmin = await backupTenantAdmins(tenant, baseDir);
        tenantAdmins.set(tenant.id.id, tenantAdmin);

        console.log(`Backup ${tenant.name} completed.`);
      }

      page += 1;
    }

    console.log('Tenants backup completed!');
  } catch (e) {
    console.log(e);
  }

  return { tenants, tenantAdmins };
};
