export interface Tenant {
  id: {
    entityType: 'TENANT';
    id: string;
  };
  createdTime: number;
  additionalInfo: {
    description: string;
  };
  country: string;
  state: string;
  city: string;
  address: string;
  address2: string;
  zip: string;
  phone: string;
  email: string;
  title: string;
  region: string;
  tenantProfileId: {
    entityType: 'TENANT_PROFILE';
    id: string;
  };
  name: string;
}
