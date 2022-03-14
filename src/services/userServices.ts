import axios from 'axios';
import { DEFAULT_GET_LIST_PARAMS } from '../constants';
import { GetListParams, ListResponse, User } from '../types';

export const getEntityUsers = (
  entity: 'customer' | 'tenant',
  entityId: string,
  params: GetListParams = DEFAULT_GET_LIST_PARAMS
) =>
  axios.get<ListResponse<User>>(`/${entity}/${entityId}/users`, { params: { page: 0, ...params } });

export const getUserById = (id: string) => axios.get<User>(`/user/${id}`);

export const getUserToken = (id: string) => axios.get(`/user/${id}/token`);
