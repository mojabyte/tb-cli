import keytar from 'keytar';

const logout = async (storeKey: string) => {
  await keytar.deletePassword('tb-token', storeKey);
  await keytar.deletePassword('tb-refresh-token', storeKey);

  console.log('You have logged out successfully.');
};

export default logout;
