const VendorToken = require('../models/VendorToken');
const { createTokenRouter } = require('../utils/tokenHelper');
module.exports = createTokenRouter(VendorToken, 'vendor');
