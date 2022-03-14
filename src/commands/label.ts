import axios from 'axios';

import { getDashboardById, getDashboards, getDeviceAttributes, getDevices } from '../services';

const label = async (dashboardName: string, deviceName: string) => {
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

  const { data: attributes } = await getDeviceAttributes(device.id.id, ['LABELS']);
  const labels = attributes[0].value;

  const { data: dashboardData } = await getDashboardById(dashboard.id.id);

  const { widgets } = dashboardData.configuration;

  Object.keys(widgets).forEach(widgetID => {
    const widget = widgets[widgetID];
    if (widget.type === 'rpc') {
      const { valueKey, valueAttribute, method } = widget.config.settings;
      widget.config.showTitle = false;
      widget.config.settings.title =
        labels[valueKey || valueAttribute || method] ?? widget.config.settings.title;
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

  console.log(`Dashboard ${dashboardName} labeled successfully.`);
};

export default label;
