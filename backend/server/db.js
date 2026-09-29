import 'dotenv/config';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve database file path
const rawDbUrl = process.env.DATABASE_URL || './data/nawi.db';
const dbPath = path.isAbsolute(rawDbUrl)
  ? rawDbUrl
  : path.resolve(__dirname, '..', rawDbUrl);

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure uploads directory exists
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Tester',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reportNumber TEXT UNIQUE NOT NULL,
    userId INTEGER NOT NULL,
    userEmail TEXT NOT NULL,
    userName TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft',
    verdict TEXT DEFAULT 'PENDING',
    manufacturer TEXT,
    model TEXT,
    serialNumber TEXT,
    capacity REAL,
    verificationInterval REAL,
    accuracyClass TEXT,
    instrumentType TEXT,
    labName TEXT,
    testDate TEXT,
    testerName TEXT,
    temperature REAL,
    humidity REAL,
    pressure REAL,
    data TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS report_sequences (
    year INTEGER PRIMARY KEY,
    lastSeq INTEGER NOT NULL DEFAULT 0
  );
`);

/**
 * Generate next report number in format: LAB/R76/YYYY/NNNN
 */
export function getNextReportNumber() {
  const currentYear = new Date().getFullYear();
  
  const getSeqStmt = db.prepare('SELECT lastSeq FROM report_sequences WHERE year = ?');
  const existing = getSeqStmt.get(currentYear);

  let nextSeq = 1;
  if (existing) {
    nextSeq = existing.lastSeq + 1;
    const updateStmt = db.prepare('UPDATE report_sequences SET lastSeq = ? WHERE year = ?');
    updateStmt.run(nextSeq, currentYear);
  } else {
    const insertStmt = db.prepare('INSERT INTO report_sequences (year, lastSeq) VALUES (?, ?)');
    insertStmt.run(currentYear, nextSeq);
  }

  const paddedSeq = String(nextSeq).padStart(4, '0');
  return `LAB/R76/${currentYear}/${paddedSeq}`;
}

export default db;
