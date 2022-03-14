import axios from 'axios';
import jwtDecode from 'jwt-decode';
import keytar from 'keytar';
import moment from 'moment';

import { setToken } from './token';
import { logout } from '../commands';

export const auth = async (storeKey: string) => {
  const token = await keytar.getPassword('tb-token', storeKey);
  const refreshToken = await keytar.getPassword('tb-refresh-token', storeKey);

  if (token) {
    const decodedToken: any = jwtDecode(token);
    if (decodedToken.exp > moment().unix() + 60) {
      setToken(token);
    } else if (refreshToken) {
      const decodedRefreshToken: any = jwtDecode(refreshToken);
      if (decodedRefreshToken.exp > moment().unix() + 10) {
        // ! This API call is not working
        try {
          const { data } = await axios.post('/auth/token', { refreshToken });
          await keytar.setPassword('tb-token', storeKey, data.token);
          await keytar.setPassword('tb-refresh-token', storeKey, data.refreshToken);
          setToken(data.token);
        } catch (e) {
          console.log('There is a problem to refresh your token. Please login again by "tb login"');
          process.exit(1);
        }
      } else {
        await logout(storeKey);
        console.log('Login token expired. Please login again by "tb login"');
        process.exit(1);
      }
    } else {
      await logout(storeKey);
      console.log('Login token expired. Please login again by "tb login"');
      process.exit(1);
    }
  } else {
    console.log('You are not logged in. Please login by "tb login"');
    process.exit(1);
  }
};
