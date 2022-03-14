import axios from 'axios';
import { DEFAULT_GET_LIST_PARAMS } from '../constants';
import { Dashboard, DashboardData, GetListParams, ListResponse } from '../types';

export const getDashboards = (params: GetListParams = DEFAULT_GET_LIST_PARAMS) =>
  axios.get<ListResponse<Dashboard>>('/tenant/dashboards', { params: { page: 0, ...params } });

export const getDashboardById = (id: string) => axios.get<DashboardData>(`/dashboard/${id}`);

export const saveDashboard = (dashboard: any) => axios.post('/dashboard', dashboard);
