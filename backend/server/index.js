import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import db, { getNextReportNumber } from './db.js';
import { hashPassword, comparePassword, generateToken, authenticateToken, requireAdmin } from './auth.js';
import { evaluateReport, calculateMPE, roundToPrecision } from './metrology.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads directory
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer storage for image attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'nawi-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// ==========================================
// 1. AUTH ROUTES
// ==========================================

app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const assignedRole = role === 'Admin' ? 'Admin' : 'Tester';
    const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?');
    const existing = checkStmt.get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = hashPassword(password);
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO users (email, password, name, role, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = insertStmt.run(email.toLowerCase().trim(), hashedPassword, name.trim(), assignedRole, now);

    const user = {
      id: Number(info.lastInsertRowid),
      email: email.toLowerCase().trim(),
      name: name.trim(),
      role: assignedRole
    };

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email.toLowerCase().trim());

    if (!user || !comparePassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const token = generateToken(safeUser);
    res.json({ user: safeUser, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const stmt = db.prepare('SELECT id, email, name, role, createdAt FROM users WHERE id = ?');
  const user = stmt.get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

// Admin: Manage users
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
  const stmt = db.prepare('SELECT id, email, name, role, createdAt FROM users ORDER BY createdAt DESC');
  const users = stmt.all();
  res.json({ users });
});

app.patch('/api/users/:id/role', authenticateToken, requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!['Tester', 'Admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  const stmt = db.prepare('UPDATE users SET role = ? WHERE id = ?');
  stmt.run(role, req.params.id);
  res.json({ success: true, message: `User role updated to ${role}` });
});

// ==========================================
// 2. FILE UPLOADS
// ==========================================

app.post('/api/upload', authenticateToken, upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

// ==========================================
// 3. METROLOGY CALCULATION ROUTE
// ==========================================

app.post('/api/metrology/calculate', (req, res) => {
  try {
    const reportData = req.body;
    const results = evaluateReport(reportData);
    res.json(results);
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate metrology parameters' });
  }
});

// ==========================================
// 4. REPORTS ROUTES
// ==========================================

// Preview next report number
app.get('/api/reports/next-number', authenticateToken, (req, res) => {
  const currentYear = new Date().getFullYear();
  const getSeqStmt = db.prepare('SELECT lastSeq FROM report_sequences WHERE year = ?');
  const existing = getSeqStmt.get(currentYear);
  const nextSeq = (existing ? existing.lastSeq : 0) + 1;
  const paddedSeq = String(nextSeq).padStart(4, '0');
  res.json({ nextNumber: `LAB/R76/${currentYear}/${paddedSeq}` });
});

// Stats for dashboard cards
app.get('/api/reports/stats', authenticateToken, (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin';
    let baseSql = 'FROM reports';
    let params = [];

    if (!isAdmin) {
      baseSql += ' WHERE userId = ?';
      params.push(req.user.id);
    }

    const totalStmt = db.prepare(`SELECT COUNT(*) as count ${baseSql}`);
    const completedStmt = db.prepare(`SELECT COUNT(*) as count ${baseSql} ${!isAdmin ? 'AND' : 'WHERE'} status = 'Completed' AND verdict = 'PASS'`);
    const draftStmt = db.prepare(`SELECT COUNT(*) as count ${baseSql} ${!isAdmin ? 'AND' : 'WHERE'} status = 'Draft'`);
    const failedStmt = db.prepare(`SELECT COUNT(*) as count ${baseSql} ${!isAdmin ? 'AND' : 'WHERE'} verdict = 'FAIL'`);

    const total = totalStmt.get(...params)?.count || 0;
    const completed = completedStmt.get(...params)?.count || 0;
    const draft = draftStmt.get(...params)?.count || 0;
    const failed = failedStmt.get(...params)?.count || 0;

    res.json({ total, completed, draft, failed });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch report stats' });
  }
});

// List & Search reports with case-insensitive filters and pagination (20/page)
app.get('/api/reports', authenticateToken, (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin';
    const {
      q,
      status,
      from,
      to,
      startDate,
      endDate,
      manufacturer,
      model,
      serialNo,
      serialNumber,
      reportNo,
      reportNumber,
      verdict,
      accuracyClass
    } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (!isAdmin) {
      whereClause += ' AND userId = ?';
      params.push(req.user.id);
    }

    // 1. General search across manufacturer, model, serialNo, reportNo, tester
    if (q && String(q).trim() !== '') {
      const term = `%${String(q).trim().toLowerCase()}%`;
      whereClause += ` AND (
        LOWER(manufacturer) LIKE ? OR
        LOWER(model) LIKE ? OR
        LOWER(serialNumber) LIKE ? OR
        LOWER(reportNumber) LIKE ? OR
        LOWER(testerName) LIKE ?
      )`;
      params.push(term, term, term, term, term);
    }

    // 2. Specific case-insensitive field filters
    if (manufacturer && String(manufacturer).trim() !== '') {
      whereClause += ' AND LOWER(manufacturer) LIKE ?';
      params.push(`%${String(manufacturer).trim().toLowerCase()}%`);
    }

    if (model && String(model).trim() !== '') {
      whereClause += ' AND LOWER(model) LIKE ?';
      params.push(`%${String(model).trim().toLowerCase()}%`);
    }

    const serialFilter = serialNo || serialNumber;
    if (serialFilter && String(serialFilter).trim() !== '') {
      whereClause += ' AND LOWER(serialNumber) LIKE ?';
      params.push(`%${String(serialFilter).trim().toLowerCase()}%`);
    }

    const reportNoFilter = reportNo || reportNumber;
    if (reportNoFilter && String(reportNoFilter).trim() !== '') {
      whereClause += ' AND LOWER(reportNumber) LIKE ?';
      params.push(`%${String(reportNoFilter).trim().toLowerCase()}%`);
    }

    // 3. Status filter
    if (status && status !== 'All' && String(status).trim() !== '') {
      whereClause += ' AND LOWER(status) = LOWER(?)';
      params.push(String(status).trim());
    }

    // 4. Verdict filter
    if (verdict && verdict !== 'All' && String(verdict).trim() !== '') {
      whereClause += ' AND LOWER(verdict) = LOWER(?)';
      params.push(String(verdict).trim());
    }

    // 5. Accuracy class filter
    if (accuracyClass && accuracyClass !== 'All' && String(accuracyClass).trim() !== '') {
      whereClause += ' AND accuracyClass = ?';
      params.push(String(accuracyClass).trim());
    }

    // 6. Date range filter (from / to or startDate / endDate)
    const fromDate = (from || startDate || '').trim();
    if (fromDate) {
      whereClause += " AND COALESCE(NULLIF(testDate, ''), DATE(createdAt)) >= ?";
      params.push(fromDate);
    }

    const toDate = (to || endDate || '').trim();
    if (toDate) {
      whereClause += " AND COALESCE(NULLIF(testDate, ''), DATE(createdAt)) <= ?";
      params.push(toDate);
    }

    // Pagination parameters (default: 20 per page)
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const offset = (page - 1) * limit;

    // 1. Get total matching count
    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM reports ${whereClause}`);
    const total = countStmt.get(...params)?.total || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // 2. Fetch paginated records
    const listStmt = db.prepare(`
      SELECT * FROM reports
      ${whereClause}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `);
    const rows = listStmt.all(...params, limit, offset);

    const reports = rows.map(r => ({
      ...r,
      data: JSON.parse(r.data)
    }));

    res.json({
      reports,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('List reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get single report
app.get('/api/reports/:id', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM reports WHERE id = ?');
    const report = stmt.get(req.params.id);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (req.user.role !== 'Admin' && report.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this report' });
    }

    res.json({
      ...report,
      data: JSON.parse(report.data)
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to retrieve report' });
  }
});

// Create report (Draft or Completed)
app.post('/api/reports', authenticateToken, (req, res) => {
  try {
    const { status = 'Draft', instrument, environment, tests, attachments, notes } = req.body;

    const evaluation = evaluateReport({ instrument, tests });
    const verdict = status === 'Draft' ? 'PENDING' : (evaluation.overallPass ? 'PASS' : 'FAIL');
    const reportNumber = getNextReportNumber();
    const now = new Date().toISOString();

    const fullData = {
      instrument: instrument || {},
      environment: environment || {},
      tests: tests || {},
      attachments: attachments || [],
      evaluation,
      notes: notes || ''
    };

    const insertStmt = db.prepare(`
      INSERT INTO reports (
        reportNumber, userId, userEmail, userName, status, verdict,
        manufacturer, model, serialNumber, capacity, verificationInterval,
        accuracyClass, instrumentType, labName, testDate, testerName,
        temperature, humidity, pressure, data, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
    `);

    const result = insertStmt.run(
      reportNumber,
      req.user.id,
      req.user.email,
      req.user.name,
      status,
      verdict,
      instrument?.manufacturer || '',
      instrument?.model || '',
      instrument?.serialNumber || '',
      Number(instrument?.capacity) || 0,
      Number(instrument?.verificationInterval) || 0,
      instrument?.accuracyClass || '',
      instrument?.type || '',
      environment?.labName || '',
      environment?.date || now.split('T')[0],
      environment?.testerName || req.user.name,
      Number(environment?.temperature) || null,
      Number(environment?.humidity) || null,
      Number(environment?.pressure) || null,
      JSON.stringify(fullData),
      now,
      now
    );

    res.status(201).json({
      id: Number(result.lastInsertRowid),
      reportNumber,
      status,
      verdict,
      data: fullData
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Update report
app.put('/api/reports/:id', authenticateToken, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (req.user.role !== 'Admin' && existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: You can only edit your own reports' });
    }

    const { status = existing.status, instrument, environment, tests, attachments, notes } = req.body;
    const evaluation = evaluateReport({ instrument, tests });
    const verdict = status === 'Draft' ? 'PENDING' : (evaluation.overallPass ? 'PASS' : 'FAIL');
    const now = new Date().toISOString();

    const fullData = {
      instrument: instrument || {},
      environment: environment || {},
      tests: tests || {},
      attachments: attachments || [],
      evaluation,
      notes: notes || ''
    };

    const updateStmt = db.prepare(`
      UPDATE reports SET
        status = ?, verdict = ?, manufacturer = ?, model = ?, serialNumber = ?,
        capacity = ?, verificationInterval = ?, accuracyClass = ?, instrumentType = ?,
        labName = ?, testDate = ?, testerName = ?, temperature = ?, humidity = ?, pressure = ?,
        data = ?, updatedAt = ?
      WHERE id = ?
    `);

    updateStmt.run(
      status,
      verdict,
      instrument?.manufacturer || existing.manufacturer,
      instrument?.model || existing.model,
      instrument?.serialNumber || existing.serialNumber,
      Number(instrument?.capacity) || existing.capacity,
      Number(instrument?.verificationInterval) || existing.verificationInterval,
      instrument?.accuracyClass || existing.accuracyClass,
      instrument?.type || existing.instrumentType,
      environment?.labName || existing.labName,
      environment?.date || existing.testDate,
      environment?.testerName || existing.testerName,
      Number(environment?.temperature) || existing.temperature,
      Number(environment?.humidity) || existing.humidity,
      Number(environment?.pressure) || existing.pressure,
      JSON.stringify(fullData),
      now,
      req.params.id
    );

    res.json({
      id: Number(req.params.id),
      reportNumber: existing.reportNumber,
      status,
      verdict,
      data: fullData
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// Delete report
app.delete('/api/reports/:id', authenticateToken, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (req.user.role !== 'Admin' && existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: You can only delete your own reports' });
    }

    db.prepare('DELETE FROM reports WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`[NAWI Metrology Server] running on http://localhost:${PORT}`);
});
