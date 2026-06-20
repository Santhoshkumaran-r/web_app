const express    = require('express');
const User       = require('../models/User');
const AdminToken  = require('../models/AdminToken');
const VendorToken = require('../models/VendorToken');
const UserToken   = require('../models/UserToken');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard/admin  — Admin stats (3-panel layout)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/admin', protect, restrictTo('admin'), async (req, res) => {
  try {
    const [
      totalAdmins,
      totalVendors,
      totalUsers,
      adminTokensGenerated,
      vendorTokensGenerated,
      userTokensGenerated,
      allVendors,
      allUsers,
    ] = await Promise.all([
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'vendor' }),
      User.countDocuments({ role: 'user' }),
      AdminToken.countDocuments({}),
      VendorToken.countDocuments({}),
      UserToken.countDocuments({}),
      User.find({ role: 'vendor' }).select('tokenLimit tokensUsed'),
      User.find({ role: 'user' }).select('tokenLimit tokensUsed'),
    ]);

    // Admin panel: tokens allocated = sum of all vendor tokenLimits; generated = AdminToken count
    const adminAllocatedTokens = allVendors.reduce((sum, v) => sum + (v.tokenLimit || 0), 0);

    // Vendor panel: total allocated = sum of all vendor tokenLimits (same), generated = VendorToken count
    const vendorTotalAllocated = adminAllocatedTokens;
    const vendorTotalUsed      = allVendors.reduce((sum, v) => sum + (v.tokensUsed || 0), 0);
    const vendorTotalRemaining = allVendors.reduce((sum, v) => {
      if (v.tokenLimit === null) return sum;
      return sum + Math.max(0, (v.tokenLimit || 0) - (v.tokensUsed || 0));
    }, 0);

    // User panel: total allocated = sum of all user tokenLimits, generated = UserToken count
    const userTotalAllocated  = allUsers.reduce((sum, u) => sum + (u.tokenLimit || 0), 0);
    const userTotalUsed       = allUsers.reduce((sum, u) => sum + (u.tokensUsed || 0), 0);
    const userTotalRemaining  = allUsers.reduce((sum, u) => {
      if (u.tokenLimit === null) return sum;
      return sum + Math.max(0, (u.tokenLimit || 0) - (u.tokensUsed || 0));
    }, 0);

    // Recent activity
    const [recentAdmin, recentVendor, recentUser] = await Promise.all([
      AdminToken.find({}).sort({ createdAt: -1 }).limit(5)
        .select('employeeEmail generatedByEmail sentAt status createdAt'),
      VendorToken.find({}).sort({ createdAt: -1 }).limit(5)
        .select('employeeEmail generatedByEmail sentAt status createdAt'),
      UserToken.find({}).sort({ createdAt: -1 }).limit(5)
        .select('employeeEmail generatedByEmail sentAt status createdAt'),
    ]);

    const recentActivity = [...recentAdmin, ...recentVendor, ...recentUser]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8)
      .map(t => ({
        employeeEmail:    t.employeeEmail,
        generatedByEmail: t.generatedByEmail,
        status:           t.status,
        sentAt:           t.sentAt || t.createdAt,
      }));

    res.json({
      success: true,
      stats: {
        // Admin section
        totalAdmins,
        adminAllocatedTokens,
        adminTokensGenerated,

        // Vendor section
        totalVendors,
        vendorTotalAllocated,
        vendorTokensGenerated,
        vendorTotalRemaining,

        // User section
        totalUsers,
        userTotalAllocated,
        userTokensGenerated,
        userTotalUsed,
        userTotalRemaining,

        // legacy / backwards-compat
        totalTokensGenerated: adminTokensGenerated + vendorTokensGenerated + userTokensGenerated,
      },
      recentActivity,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard/vendor  — Vendor stats
// ─────────────────────────────────────────────────────────────────────────────
router.get('/vendor', protect, restrictTo('vendor'), async (req, res) => {
  try {
    const vendorId = req.user._id;
    const vendor   = await User.findById(vendorId).select('tokenLimit tokensUsed');

    const [usersUnderVendor, tokensGeneratedDocs] = await Promise.all([
      User.find({ vendorId, role: 'user' }).select('name email tokenLimit tokensUsed createdAt isActive'),
      VendorToken.find({ generatedBy: vendorId }).sort({ createdAt: -1 }).limit(8)
        .select('employeeEmail generatedByEmail sentAt status createdAt'),
    ]);

    const vendorTokensGeneratedCount = await VendorToken.countDocuments({ generatedBy: vendorId });

    const usedTokens      = vendor.tokensUsed || 0;
    const allocatedLimit  = vendor.tokenLimit;
    const tokensRemaining = allocatedLimit !== null
      ? Math.max(0, allocatedLimit - usedTokens)
      : null;

    res.json({
      success: true,
      stats: {
        // Vendor token summary
        totalAllocated:   allocatedLimit,   // what admin gave this vendor
        tokensUsed:       usedTokens,       // how many vendor has consumed
        tokensRemaining,                     // remaining for vendor

        // user sub-panel (kept for possible future use)
        totalUsers:       usersUnderVendor.length,
        tokensGenerated:  vendorTokensGeneratedCount,

        // legacy aliases
        vendorLimit:      allocatedLimit,
        vendorUsed:       usedTokens,
        tokensAllocated:  allocatedLimit,
        tokensAvailable:  tokensRemaining,
      },
      users:          usersUnderVendor,
      recentActivity: tokensGeneratedDocs.map(t => ({
        employeeEmail:    t.employeeEmail,
        generatedByEmail: t.generatedByEmail,
        status:           t.status,
        sentAt:           t.sentAt || t.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard/user  — User stats
// ─────────────────────────────────────────────────────────────────────────────
router.get('/user', protect, restrictTo('user'), async (req, res) => {
  try {
    const userId = req.user._id;
    const user   = await User.findById(userId).select('tokenLimit tokensUsed name email vendorId');

    const recentTokens = await UserToken.find({ generatedBy: userId })
      .sort({ createdAt: -1 })
      .limit(8)
      .select('employeeEmail sentAt status createdAt');

    const totalGenerated  = await UserToken.countDocuments({ generatedBy: userId });
    const tokensRemaining = user.tokenLimit !== null
      ? Math.max(0, user.tokenLimit - user.tokensUsed)
      : null;

    res.json({
      success: true,
      stats: {
        totalAllocated:   user.tokenLimit,     // what vendor gave this user
        tokensUsed:       user.tokensUsed,     // how many used
        tokensRemaining,                        // remaining

        // legacy aliases
        tokensGenerated:  totalGenerated,
        tokenLimit:       user.tokenLimit,
      },
      recentActivity: recentTokens.map(t => ({
        employeeEmail: t.employeeEmail,
        status:        t.status,
        sentAt:        t.sentAt || t.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
