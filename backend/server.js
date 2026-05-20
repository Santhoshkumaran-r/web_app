require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const connectDB = require('./config/db');

const authRoutes        = require('./routes/authRoutes');
const adminTokenRoutes  = require('./routes/adminTokenRoutes');
const vendorTokenRoutes = require('./routes/vendorTokenRoutes');
const userTokenRoutes   = require('./routes/userTokenRoutes');

const app = express();

connectDB();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/admin/token',  adminTokenRoutes);   // → admintokens  collection
app.use('/api/vendor/token', vendorTokenRoutes);  // → vendortokens collection
app.use('/api/user/token',   userTokenRoutes);    // → usertokens   collection

app.get('/', (req, res) => res.json({ message: '🚀 Auth API running', status: 'OK' }));

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong.' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
