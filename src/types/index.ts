export type ParsedToken = {
  scopes: ('TENANT_ADMIN' | 'SYS_ADMIN')[];
  userId: string;
  tenantId: string;
};

export type Config = {
  baseURL?: URL;
  insecure?: boolean;
  git?: Record<string, string>;
};

export type AttributesScope = 'SERVER_SCOPE' | 'SHARED_SCOPE' | 'CLIENT_SCOPE';

export type GetListParams = {
  pageSize?: number;
  page?: number;
  textSearch?: string;
};

export * from './commonTypes';
export * from './dashboardTypes';
export * from './deviceTypes';
export * from './ruleChainTypes';
export * from './tenantTypes';
export * from './userTypes';
export * from './widgetTypes';
