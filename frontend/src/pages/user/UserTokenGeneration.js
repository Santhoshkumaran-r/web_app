import React from 'react';
import TokenPage from '../../components/TokenPage';

const UserTokenGeneration = () => (
  <TokenPage
    apiBase="/user/token"
    accentColor="#fef9e7"
    role="User"
  />
);

export default UserTokenGeneration;
