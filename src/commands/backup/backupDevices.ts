import fsPromise from 'fs/promises';
import path from 'path';

import { getDevices, getDeviceAttributesByScope, getDeviceCredentials } from '../../services';
import { Device } from '../../types';

const backupDevice = async (device: Device, tenantDir: string) => {
  const { data: serverAttributes } = await getDeviceAttributesByScope(device.id.id, 'SERVER_SCOPE');
  const { data: sharedAttributes } = await getDeviceAttributesByScope(device.id.id, 'SHARED_SCOPE');
  const { data: clientAttributes } = await getDeviceAttributesByScope(device.id.id, 'CLIENT_SCOPE');
  const { data: credentials } = await getDeviceCredentials(device.id.id);

  serverAttributes.forEach((item: any) => {
    delete item.lastUpdateTs;
  });
  sharedAttributes.forEach((item: any) => {
    delete item.lastUpdateTs;
  });
  clientAttributes.forEach((item: any) => {
    delete item.lastUpdateTs;
  });

  const attributes = {
    server: serverAttributes,
    shared: sharedAttributes,
    client: clientAttributes,
  };

  const accessToken = credentials.credentialsId;

  await fsPromise.writeFile(
    path.join(tenantDir, 'devices', `${device.name}.json`),
    JSON.stringify({ data: device, accessToken, attributes }, undefined, 2)
  );
};

export const backupDevices = async (tenantDir: string) => {
  console.log('Backup Devices...');

  try {
    let page = 0;
    let hasNext = true;
    let totalElements = 0;

    while (hasNext) {
      const { data } = await getDevices({ page, pageSize: 50 });
      const devices = data.data;
      hasNext = data.hasNext;
      totalElements = data.totalElements;

      await Promise.all(devices.map(device => backupDevice(device, tenantDir)));

      page += 1;
    }

    console.log(`Successfully backed up ${totalElements} Devices!`);
  } catch (e) {
    console.log(e);
  }
};
