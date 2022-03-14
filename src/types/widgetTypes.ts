export interface WidgetsBundle {
  id: {
    entityType: 'WIDGETS_BUNDLE';
    id: string;
  };
  createdTime: number;
  tenantId: {
    entityType: 'TENANT';
    id: string;
  };
  alias: string;
  title: string;
  image: string;
}

export interface WidgetsBundleDataItem {
  id: {
    entityType: 'WIDGET_TYPE';
    id: string;
  };
  createdTime: number;
  tenantId: {
    entityType: 'TENANT';
    id: string;
  };
  bundleAlias: string;
  alias: string;
  name: string;
  descriptor: {
    type: string;
    sizeX: number;
    sizeY: number;
    resources: {
      url: string;
    }[];
    templateHtml: string;
    templateCss: string;
    controllerScript: string;
    settingsSchema: string;
    dataKeySettingsSchema: string;
    defaultConfig: string;
  };
}

export type WidgetsBundleData = WidgetsBundleDataItem[];
