export interface User {
  id: {
    entityType: 'USER';
    id: string;
  };
  createdTime: number;
  additionalInfo: {
    description: string;
    defaultDashboardId: string;
    defaultDashboardFullscreen: boolean;
    userPasswordHistory: Record<string, string>;
    lastLoginTs: number;
    failedLoginAttempts: number;
    lang: string;
  };
  tenantId: {
    entityType: 'TENANT';
    id: string;
  };
  customerId: {
    entityType: 'CUSTOMER';
    id: string;
  };
  email: string;
  authority: 'TENANT_ADMIN'; // TODO: fix this
  firstName: string;
  lastName: string;
  name: string;
}
