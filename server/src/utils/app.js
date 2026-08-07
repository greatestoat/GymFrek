const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const gymRoutes = require('./routes/gym.routes');
const memberRoutes = require('./routes/member.routes');
const planRoutes = require('./routes/plan.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const duesRoutes = require('./routes/dues.routes');
const adminRoutes = require('./routes/admin.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Behind a proxy (Heroku/Render/Nginx) - needed for correct req.ip & secure cookies.
app.set('trust proxy', 1);

// --- Security middleware -------------------------------------------------
app.use(helmet()); // sensible security headers (CSP, no-sniff, HSTS, etc.)
app.use(hpp()); // protects against HTTP parameter pollution
app.use(xss()); // sanitizes req.body/query/params against XSS payloads
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true, // allow the refresh-token cookie to be sent
  })
);

// General API rate limit (auth routes have their own stricter limiter too)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.json({ limit: '10kb' })); // small limit blunts payload-based DoS
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Publicly served, uploaded images (gym logos, member photos). Not under
// /api, and read-only from the client's perspective - writes only ever
// happen through the authenticated upload endpoints below.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Routes ---------------------------------------------------------------
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'gym_frek-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/gym', gymRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/dues', duesRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use(errorHandler);

module.exports = app;
