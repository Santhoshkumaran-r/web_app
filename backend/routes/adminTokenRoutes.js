const AdminToken = require('../models/AdminToken');
const { createTokenRouter } = require('../utils/tokenHelper');
module.exports = createTokenRouter(AdminToken, 'admin');
