import fsPromise from 'fs/promises';
import path from 'path';

import { getDashboardById, getDashboards } from '../../services';
import { Dashboard } from '../../types';

const backupDashboard = async (dashboard: Dashboard, tenantDir: string) => {
  const { data: dashboardData } = await getDashboardById(dashboard.id.id);

  await fsPromise.writeFile(
    path.join(tenantDir, 'dashboards', `${dashboard.name}.json`),
    JSON.stringify(dashboardData, undefined, 2)
  );
};

export const backupDashboards = async (tenantDir: string) => {
  console.log('Backup Dashboards...');

  try {
    let page = 0;
    let hasNext = true;
    let totalElements = 0;

    while (hasNext) {
      const { data } = await getDashboards({ page, pageSize: 100 });
      const dashboards = data.data;
      hasNext = data.hasNext;
      totalElements = data.totalElements;

      await Promise.all(dashboards.map(dashboard => backupDashboard(dashboard, tenantDir)));

      page += 1;
    }

    console.log(`Successfully backed up ${totalElements} Dashboards!`);
  } catch (e) {
    console.log(e);
  }
};
