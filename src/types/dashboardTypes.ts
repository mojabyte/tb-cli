type customersList = {
  customerId: {
    entityType: 'CUSTOMER';
    id: string;
  };
  title: string;
  public: boolean;
}[];

export interface Dashboard {
  id: {
    entityType: 'DASHBOARD';
    id: string;
  };
  createdTime: number;
  tenantId: {
    entityType: 'TENANT';
    id: string;
  };
  title: string;
  assignedCustomers: customersList;
  name: string;
}

interface DashboardWidget {
  isSystemType: boolean;
  bundleAlias: string;
  typeAlias: string;
  type: string;
  title: string;
  sizeX: number;
  sizeY: number;
  config: {
    targetDeviceAliases: []; //TODO
    showTitle: boolean;
    backgroundColor: string;
    color: string;
    padding: string;
    settings: {
      requestTimeout: number;
    };
    title: string;
    dropShadow: boolean;
    enableFullscreen: boolean;
    widgetStyle: {}; //TODO
    titleStyle: {
      fontSize: string;
      fontWeight: number;
    };
    useDashboardTimewindow: boolean;
    showLegend: boolean;
    actions: {}; //TODO
    datasources: []; //TODO
    targetDeviceAliasIds: string[];
    showTitleIcon: boolean;
    iconColor: string;
    iconSize: string;
    titleTooltip: string;
  };
  row: number;
  col: number;
  id: string;
}

interface DashboardsWidgetState {
  sizeX: number;
  sizeY: number;
  row: number;
  col: number;
}

interface DashboardStateItem {
  name: string;
  root: boolean;
  layouts: {
    main: {
      widgets: Record<string, DashboardsWidgetState>;
      gridSettings: {
        backgroundColor: string;
        color: string;
        columns: number;
        margin: number;
        backgroundSizeMode: string;
      };
    };
  };
}

interface DashboardState extends Record<string, DashboardStateItem> {
  default: DashboardStateItem;
}

interface DashboardEntityAlias {
  id: string;
  alias: string;
  filter: {
    type: string;
    resolveMultiple: boolean;
    singleEntity: {
      entityType: string;
      id: string;
    };
  };
}

interface DashboardTimewindow {
  displayValue: string;
  hideInterval: boolean;
  hideAggregation: boolean;
  hideAggInterval: boolean;
  selectedTab: number;
  realtime: {
    interval: number;
    timewindowMs: number;
  };
  history: {
    historyType: number;
    interval: number;
    timewindowMs: number;
    fixedTimewindow: {
      startTimeMs: number;
      endTimeMs: number;
    };
  };
  aggregation: {
    type: string;
    limit: number;
  };
}

interface DashboardSettings {
  stateControllerId: string;
  showTitle: boolean;
  showDashboardsSelect: boolean;
  showEntitiesSelect: boolean;
  showDashboardTimewindow: boolean;
  showDashboardExport: boolean;
  toolbarAlwaysOpen: boolean;
}

export interface DashboardData {
  id: {
    entityType: 'DASHBOARD';
    id: string;
  };
  createdTime: number;
  tenantId: {
    entityType: 'TENANT';
    id: string;
  };
  title: string;
  assignedCustomers: customersList;
  configuration: {
    description: string;
    widgets: Record<string, DashboardWidget>;
    states: DashboardState;
    entityAliases: Record<string, DashboardEntityAlias>;
    filters: {}; //TODO
    timewindow: DashboardTimewindow;
    settings: DashboardSettings;
  };
  name: string;
}
