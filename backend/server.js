require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const connectDB = require('./config/db');

const authRoutes        = require('./routes/authRoutes');
const adminTokenRoutes  = require('./routes/adminTokenRoutes');
const vendorTokenRoutes = require('./routes/vendorTokenRoutes');
const userTokenRoutes   = require('./routes/userTokenRoutes');
const credentialRoutes  = require('./routes/credentialRoutes');
const dashboardRoutes   = require('./routes/dashboardRoutes');
const emailConfigRoutes = require('./routes/emailConfigRoutes');

const app = express();

connectDB();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://192.168.1.9:3000',
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',               authRoutes);
app.use('/api/admin/token',        adminTokenRoutes);
app.use('/api/vendor/token',       vendorTokenRoutes);
app.use('/api/user/token',         userTokenRoutes);
app.use('/api/admin/credentials',  credentialRoutes);
app.use('/api/vendor/credentials', credentialRoutes);
app.use('/api/dashboard',          dashboardRoutes);
app.use('/api/admin/email-config', emailConfigRoutes);

app.get('/', (req, res) => res.json({ message: '🚀 Auth API running', status: 'OK' }));

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong.' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));