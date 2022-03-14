import axios from 'axios';
import { DEFAULT_GET_LIST_PARAMS } from '../constants';
import { GetListParams, ListResponse } from '../types';
import { Customer } from '../types/customerTypes';

export const getCustomers = (params: GetListParams = DEFAULT_GET_LIST_PARAMS) =>
  axios.get<ListResponse<Customer>>('/customers', { params: { page: 0, ...params } });

export const getCustomerById = (id: string) => axios.get<Customer>(`/customer/${id}`);
