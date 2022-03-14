import fs from 'fs';
import fsPromise from 'fs/promises';
import path from 'path';

import * as api from '../services';

const restore = async (dir: string, options: string[]) => {
  if (!dir) {
    console.log(
      'Input directory does not specified. Please ensure to pass the input directory by "-i <directory>".'
    );
    process.exit(1);
  }
  if (!fs.existsSync(dir)) {
    console.log('Input directory does not exist.');
    process.exit(1);
  }

  // TODO: Restore Rule Chains

  // Restore Widgets
  if (options.includes('widgets')) {
    const widgetsDir = path.join(dir, 'widgets');
    if (!fs.existsSync(widgetsDir)) {
      console.log('Input directory does not contain any "widgets/" directory.');
      process.exit(1);
    }

    fsPromise
      .readdir(widgetsDir)
      .then(files => {
        files.forEach(file => {
          const filePath = path.join(widgetsDir, file);
          if (fs.lstatSync(filePath).isFile()) {
            fsPromise.readFile(filePath, 'utf-8').then(async content => {
              try {
                const widgetTypes = JSON.parse(content);
                const widgetsBundleName = file.split('.').slice(0, -1).join('.');
                await api.saveWidgetsBundle({
                  alias: widgetsBundleName.toLowerCase(),
                  image: null,
                  title: widgetsBundleName,
                });
                widgetTypes.forEach(async (widgetType: any) => {
                  delete widgetType.id;
                  delete widgetType.createdTime;
                  delete widgetType.tenantId;
                  await api.saveWidgetType(widgetType);
                });
              } catch (e) {}
            });
          }
        });
      })
      .catch(e => {
        console.log(e);
      });
  }

  // Restore Devices
  if (options.includes('devices')) {
    const devicesDir = path.join(dir, 'devices');
    if (!fs.existsSync(devicesDir)) {
      console.log('Input directory does not contain any "devices/" directory.');
      process.exit(1);
    }

    fsPromise
      .readdir(devicesDir)
      .then(files => {
        files.forEach(file => {
          fsPromise.readFile(path.join(devicesDir, file), 'utf-8').then(async content => {
            try {
              const device = JSON.parse(content);
              const deviceName = file.split('.').slice(0, -1).join('.');

              let deviceId = null;

              try {
                const { data } = await api.saveDevice(
                  {
                    name: deviceName,
                    type: 'AT_CORE',
                  },
                  device.accessToken
                );
                deviceId = data.id.id;
              } catch (e) {
                // If device already exists just restore its accessToken
                if (e.response?.data?.errorCode === 31) {
                  const {
                    data: { data: devices },
                  } = await api.getDevices({ pageSize: 1, textSearch: deviceName });
                  deviceId = devices[0].id.id;
                  try {
                    const { data: credentials } = await api.getDeviceCredentials(deviceId);
                    await api.saveDeviceCredentials({
                      ...credentials,
                      credentialsId: device.accessToken,
                    });
                  } catch (e) {
                    console.log(e.response?.data?.message);
                  }
                } else console.log(e.response?.data?.message);
              }

              const getAttributesObject = (attributesArray: any[]) => {
                const attributesObject: any = {};
                attributesArray.forEach(({ key, value }: { key: string; value: any }) => {
                  attributesObject[key] = value;
                });
                return attributesObject;
              };

              if (device.attributes.server.length > 0) {
                await api.saveDeviceAttributes(
                  deviceId,
                  'SERVER_SCOPE',
                  getAttributesObject(device.attributes.server)
                );
              }
              if (device.attributes.shared.length > 0) {
                await api.saveDeviceAttributes(
                  deviceId,
                  'SHARED_SCOPE',
                  getAttributesObject(device.attributes.shared)
                );
              }
              if (device.attributes.client.length > 0) {
                await api.saveDeviceAttributes(
                  deviceId,
                  'CLIENT_SCOPE',
                  getAttributesObject(device.attributes.client)
                );
              }
            } catch (e) {}
          });
        });
      })
      .catch(e => {
        console.log(e);
      });
  }

  // Restore Dashboards
  if (options.includes('dashboards')) {
    const dashboardsDir = path.join(dir, 'dashboards');
    if (!fs.existsSync(dashboardsDir)) {
      console.log('Input directory does not contain any "dashboards/" directory.');
      process.exit(1);
    }

    fsPromise
      .readdir(dashboardsDir)
      .then(files => {
        files.forEach(file => {
          fsPromise.readFile(path.join(dashboardsDir, file), 'utf-8').then(async content => {
            try {
              const dashboard = JSON.parse(content);
              delete dashboard.id;
              delete dashboard.createdTime;
              delete dashboard.tenantId;

              // TODO: restore entity alias by entity id & for any entity type
              await Promise.all(
                Object.keys(dashboard.configuration.entityAliases).map(async key => {
                  if (
                    dashboard.configuration.entityAliases[key].filter.type === 'singleEntity' &&
                    dashboard.configuration.entityAliases[key].filter.singleEntity.entityType ===
                      'DEVICE'
                  ) {
                    const deviceName = dashboard.configuration.entityAliases[key].alias;
                    const {
                      data: { data: devices },
                    } = await api.getDevices({ pageSize: 1, textSearch: deviceName });
                    if (devices[0]) {
                      dashboard.configuration.entityAliases[key].filter.singleEntity.id =
                        devices[0].id.id;
                      return;
                    }
                  }
                })
              );

              if (dashboard.assignedCustomers) {
                await Promise.all(
                  dashboard.assignedCustomers.map(
                    async ({ title }: { title: string }, index: number) => {
                      const {
                        data: { data: customers },
                      } = await api.getCustomers({ pageSize: 1, textSearch: title });
                      if (customers[0]) {
                        dashboard.assignedCustomers[index].customerId.id = customers[0].id.id;
                        return;
                      }
                      dashboard.assignedCustomers.splice(index, 1);
                    }
                  )
                );
              }

              await api.saveDashboard(dashboard);
            } catch (e) {}
          });
        });
      })
      .catch(e => {
        console.log(e);
      });
  }
};

export default restore;
