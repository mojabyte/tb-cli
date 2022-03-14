import axios from 'axios';
import { DEFAULT_GET_LIST_PARAMS } from '../constants';
import { GetListParams, ListResponse, Tenant } from '../types';

export const getTenants = (params: GetListParams = DEFAULT_GET_LIST_PARAMS) =>
  axios.get<ListResponse<Tenant>>('/tenantInfos', { params: { page: 0, ...params } });

export const getTenantById = (id: string) => axios.get<Tenant>(`/tenant/${id}`);
