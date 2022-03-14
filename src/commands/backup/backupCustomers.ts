import fsPromise from 'fs/promises';
import path from 'path';

import { getCustomerById, getCustomers, getEntityUsers } from '../../services';
import { User } from '../../types';
import { Customer } from '../../types/customerTypes';

const backupCustomerUsers = async (customer: Customer, tenantDir: string) => {
  let page = 0;
  let hasNext = true;
  let users: User[] = [];

  while (hasNext) {
    const { data } = await getEntityUsers('customer', customer.id.id, { page, pageSize: 100 });
    users = [...users, ...data.data];
    hasNext = data.hasNext;

    const dir = path.join(tenantDir, 'customers', customer.name);
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

const backupCustomer = async (customer: Customer, tenantDir: string) => {
  const { data: customerData } = await getCustomerById(customer.id.id);

  await fsPromise.writeFile(
    path.join(tenantDir, 'customers', `${customer.name}.json`),
    JSON.stringify(customerData, undefined, 2)
  );

  await backupCustomerUsers(customer, tenantDir);
};

export const backupCustomers = async (tenantDir: string) => {
  console.log('Backup Customers...');

  try {
    let page = 0;
    let hasNext = true;
    let totalElements = 0;

    while (hasNext) {
      const { data } = await getCustomers({ page, pageSize: 100 });
      const customers = data.data;
      hasNext = data.hasNext;
      totalElements = data.totalElements;

      await Promise.all(customers.map(customer => backupCustomer(customer, tenantDir)));

      page += 1;
    }

    console.log(`Successfully backed up ${totalElements} Customers!`);
  } catch (e) {
    console.log(e);
  }
};
