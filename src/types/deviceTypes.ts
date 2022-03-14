export interface Device {
  id: {
    entityType: 'DEVICE';
    id: string;
  };
  createdTime: number;
  tenantId: {
    entityType: 'TENANT';
    id: string;
  };
  title: string;
  name: string;
}
