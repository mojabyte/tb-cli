import axios from 'axios';
import { DEFAULT_GET_LIST_PARAMS } from '../constants';
import { Device, GetListParams, ListResponse } from '../types';

export const getDevices = (params: GetListParams = DEFAULT_GET_LIST_PARAMS) =>
  axios.get<ListResponse<Device>>('/tenant/devices', { params: { page: 0, ...params } });

export const saveDevice = (device: any, accessToken?: string) =>
  axios.post<Device>('/device', device, {
    params: {
      accessToken,
    },
  });

export const getDeviceCredentials = (id: string) => axios.get(`/device/${id}/credentials`);

export const saveDeviceCredentials = (credentials: any) =>
  axios.post('/device/credentials', credentials);
