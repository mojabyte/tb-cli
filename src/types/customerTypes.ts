export interface Customer {
  id: {
    entityType: 'CUSTOMER';
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
  tenantId: {
    entityType: 'TENANT';
    id: string;
  };
  name: string;
}
