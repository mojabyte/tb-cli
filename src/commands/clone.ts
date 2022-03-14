import axios from 'axios';

import { getDashboardById, getDashboards, getDevices } from '../services';

const clone = async (dashboardName: string, deviceName: string, name?: string) => {
  const {
    data: { data: dashboards },
  } = await getDashboards({ pageSize: 1, textSearch: dashboardName });

  if (!dashboards[0]) {
    console.log(`Dashboard ${dashboardName} not found!`);
    process.exit(1);
  }
  const dashboard = dashboards[0];

  const {
    data: { data: devices },
  } = await getDevices({ pageSize: 1, textSearch: deviceName });

  if (!devices[0]) {
    console.log(`Device ${deviceName} not found!`);
    process.exit(1);
  }
  const device = devices[0];

  const clonedDashboardName = name || device.name;

  const { data: dashboardData } = await getDashboardById(dashboard.id.id);
  const dashboardEntityAliasID = Object.keys(dashboardData.configuration.entityAliases)[0];
  dashboardData.configuration.entityAliases[dashboardEntityAliasID].filter.singleEntity.id =
    device.id.id;
  dashboardData.configuration.entityAliases[dashboardEntityAliasID].alias = device.name;
  dashboardData.name =
    dashboardData.title =
    dashboardData.configuration.states.default.name =
      clonedDashboardName;
  delete dashboardData.id;

  await axios.post('dashboard', dashboardData);

  console.log(`Dashboard ${clonedDashboardName} created successfully`);
};

export default clone;
