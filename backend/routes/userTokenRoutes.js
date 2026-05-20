const UserToken = require('../models/UserToken');
const { createTokenRouter } = require('../utils/tokenHelper');
module.exports = createTokenRouter(UserToken, 'user');
