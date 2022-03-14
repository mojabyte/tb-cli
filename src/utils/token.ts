import axios from 'axios';
import jwtDecode from 'jwt-decode';

import { ParsedToken } from '../types';

export let parsedToken: ParsedToken = {
  scopes: [],
  userId: '',
  tenantId: '',
};

export const setToken = (token: string) => {
  parsedToken = jwtDecode(token);
  axios.defaults.headers.common = {
    'x-authorization': `Bearer ${token}`,
  };
};
