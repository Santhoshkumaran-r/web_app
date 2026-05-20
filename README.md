# Multi-Role Auth System
**Admin · Vendor · User Login with React + Node.js + MongoDB**

---

## Project Structure

```
auth-project/
├── backend/                  ← Node.js + Express API
│   ├── config/
│   │   └── db.js             ← MongoDB connection
│   ├── middleware/
│   │   └── authMiddleware.js ← JWT protection & role check
│   ├── models/
│   │   └── User.js           ← Mongoose user schema (all roles)
│   ├── routes/
│   │   └── authRoutes.js     ← /login, /register, /me endpoints
│   ├── .env.example          ← Copy to .env and fill in values
│   ├── seed.js               ← Creates default accounts (run once)
│   └── server.js             ← Entry point
│
└── frontend/                 ← React app
    └── src/
        ├── components/
        │   ├── LoginForm.js      ← Reusable login form
        │   └── ProtectedRoute.js ← Guards dashboard pages
        ├── context/
        │   └── AuthContext.js    ← Global auth state
        ├── pages/
        │   ├── PortalSelection.js ← Home: choose role
        │   ├── LoginPages.js      ← Admin, Vendor, User login
        │   └── Dashboards.js      ← Post-login screens
        ├── utils/
        │   └── api.js            ← Axios + JWT interceptors
        ├── App.js                ← Routes
        └── styles.css            ← All styles
```

---

## Quick Start

### Prerequisites
- Node.js v18+ installed
- MongoDB installed locally (or a free MongoDB Atlas account)

---

### Step 1 — Backend Setup

```bash
cd auth-project/backend
npm install

# Create your .env file
cp .env.example .env
# Edit .env and set MONGO_URI and JWT_SECRET
```

**Edit `.env`:**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/auth_db
JWT_SECRET=pick_a_long_random_string_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

```bash
# Seed the database with default accounts (run ONCE)
node seed.js

# Start the backend server
npm run dev     # development (auto-restart)
# or
npm start       # production
```

Server runs at: `http://localhost:5000`

---

### Step 2 — Frontend Setup

```bash
cd auth-project/frontend
npm install
npm start
```

App runs at: `http://localhost:3000`

---

### Step 3 — Test Login

After running `node seed.js`, use these credentials:

| Role   | Email                  | Password    |
|--------|------------------------|-------------|
| Admin  | admin@example.com      | Admin@123   |
| Vendor | vendor@example.com     | Vendor@123  |
| User   | user@example.com       | User@123    |

> ⚠️ Change these passwords in production!

---

## API Endpoints

| Method | URL                        | Access         | Description              |
|--------|----------------------------|----------------|--------------------------|
| POST   | /api/auth/register         | Public         | Register new user        |
| POST   | /api/auth/login            | Public         | Login (any role)         |
| GET    | /api/auth/me               | Private        | Get current user profile |
| POST   | /api/auth/create-admin     | Admin only     | Create new admin account |

### Login Request Body
```json
{
  "email": "admin@example.com",
  "password": "Admin@123",
  "role": "admin"
}
```

### Login Response
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "Super Admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

---

## How It Works

1. **User visits** `/` → sees three portal cards (Admin / Vendor / User)
2. **Clicks a portal** → goes to role-specific login screen
3. **Enters credentials** → frontend sends `POST /api/auth/login` with `{ email, password, role }`
4. **Backend checks:**
   - Email exists in MongoDB?
   - Password matches (bcrypt compare)?
   - User's actual role matches the requested role?
5. **On success** → JWT token returned, stored in `localStorage`
6. **AuthContext** stores user info globally
7. **ProtectedRoute** guards dashboards — if not logged in, redirects to `/`

---

## Security Notes

- Passwords are hashed with **bcrypt** (12 rounds) before storing
- JWT tokens expire in 7 days
- Users cannot self-register as `admin` — only existing admins can create admin accounts via `/api/auth/create-admin`
- Each portal validates that the user has the correct role
- The `password` field is excluded from all MongoDB queries by default (`select: false`)

---

## MongoDB Atlas Setup (Cloud)

If you prefer cloud MongoDB instead of local:

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `MONGO_URI` in your `.env`:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/auth_db
   ```
