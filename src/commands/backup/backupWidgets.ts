import fsPromise from 'fs/promises';
import path from 'path';

import { getWidgetsBundles, getWidgetsBundlesData } from '../../services';
import { WidgetsBundle } from '../../types';

const backupWidget = async (widgetsBundle: WidgetsBundle, tenantDir: string) => {
  const { data: widgetBundleData } = await getWidgetsBundlesData(widgetsBundle.alias);

  await fsPromise.writeFile(
    path.join(tenantDir, 'widgets', `${widgetsBundle.title}.json`),
    JSON.stringify(widgetBundleData, undefined, 2)
  );
};

export const backupWidgets = async (tenantDir: string, tenantId: string) => {
  console.log('Backup Widgets...');

  try {
    let page = 0;
    let hasNext = true;
    let totalElements = 0;

    while (hasNext) {
      const { data } = await getWidgetsBundles({ page, pageSize: 100 });
      const widgetsBundles = data.data;
      hasNext = data.hasNext;
      totalElements = data.totalElements;

      await Promise.all(
        widgetsBundles
          .filter(widgetsBundle => tenantId === widgetsBundle.tenantId.id)
          .map(widgetsBundle => backupWidget(widgetsBundle, tenantDir))
      );

      page += 1;
    }

    console.log(`Successfully backed up ${totalElements} Widgets!`);
  } catch (e) {
    console.log(e);
  }
};
