import axios from 'axios';
import keytar from 'keytar';
import { prompt } from '../utils';

const login = async (storeKey: string) => {
  try {
    const username = await prompt('Username: ');
    const password = await prompt('Password: ', true);
    const { data } = await axios.post('/auth/login', { username, password });

    await keytar.setPassword('tb-token', storeKey, data.token);
    await keytar.setPassword('tb-refresh-token', storeKey, data.refreshToken);

    console.log('You have logged in successfully.');
  } catch (e) {
    console.log(e.response.data.message);
  }
};

export default login;
