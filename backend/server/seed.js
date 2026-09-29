import db from './db.js';
import { hashPassword } from './auth.js';
import { evaluateReport } from './metrology.js';

console.log('Seeding NAWI Metrology database...');

// Clear existing tables
db.exec(`
  DELETE FROM reports;
  DELETE FROM users;
  DELETE FROM report_sequences;
`);

// 1. Seed Users
const adminPassword = hashPassword('admin123');
const testerPassword = hashPassword('tester123');
const now = new Date().toISOString();

const insertUser = db.prepare(`
  INSERT INTO users (email, password, name, role, createdAt)
  VALUES (?, ?, ?, ?, ?)
`);

const adminInfo = insertUser.run(
  'admin@metrology.lab',
  adminPassword,
  'Dr. Evelyn Reed (Chief Metrologist)',
  'Admin',
  now
);

const testerInfo = insertUser.run(
  'tester@metrology.lab',
  testerPassword,
  'Alex Vance (Verification Officer)',
  'Tester',
  now
);

console.log('Seeded users:');
console.log(' - Admin: admin@metrology.lab (password: admin123)');
console.log(' - Tester: tester@metrology.lab (password: tester123)');

// 2. Seed Sample Completed Report
const sampleInstrument = {
  manufacturer: 'Mettler Toledo',
  model: 'bC-U215 Precision Counter Scale',
  serialNumber: 'MT-2026-NAWI-9481',
  capacity: 15, // 15 kg
  verificationInterval: 0.005, // e = 5 g (0.005 kg)
  unit: 'kg',
  accuracyClass: 'Class III',
  type: 'Electronic Counter Scale',
  minCapacity: 0.1 // 20e = 0.1 kg
};

const sampleEnvironment = {
  labName: 'National Metrology Institute - NAWI Division',
  date: '2026-09-28',
  testerName: 'Alex Vance (Verification Officer)',
  temperature: 21.8, // °C
  humidity: 52.4, // %
  pressure: 1013.25 // hPa
};

const sampleTests = {
  zeroTest: {
    zeroIndicated: 0.000,
    tareApplied: 3.000,
    tareIndicated: 3.000,
    notes: 'Zero setting accurate within ±0.25e. Tare mechanism balanced.'
  },
  eccentricity: {
    appliedLoad: 5.0, // 1/3 Max
    rows: [
      { position: 1, positionName: 'Position 1 (Center)', appliedLoad: 5.000, indicatedValue: 5.000 },
      { position: 2, positionName: 'Position 2 (Front-Left)', appliedLoad: 5.000, indicatedValue: 5.001 },
      { position: 3, positionName: 'Position 3 (Back-Left)', appliedLoad: 5.000, indicatedValue: 4.999 },
      { position: 4, positionName: 'Position 4 (Back-Right)', appliedLoad: 5.000, indicatedValue: 5.001 },
      { position: 5, positionName: 'Position 5 (Front-Right)', appliedLoad: 5.000, indicatedValue: 5.000 }
    ]
  },
  weighing: {
    increasing: [
      { step: 1, pointLabel: 'Min (20e)', appliedLoad: 0.100, indicatedValue: 0.100 },
      { step: 2, pointLabel: '500e (mpe switch)', appliedLoad: 2.500, indicatedValue: 2.501 },
      { step: 3, pointLabel: '50% Max', appliedLoad: 7.500, indicatedValue: 7.501 },
      { step: 4, pointLabel: '2000e (mpe switch)', appliedLoad: 10.000, indicatedValue: 10.002 },
      { step: 5, pointLabel: 'Max Capacity', appliedLoad: 15.000, indicatedValue: 15.003 }
    ],
    decreasing: [
      { step: 1, pointLabel: 'Max Capacity', appliedLoad: 15.000, indicatedValue: 15.002 },
      { step: 2, pointLabel: '2000e (mpe switch)', appliedLoad: 10.000, indicatedValue: 10.001 },
      { step: 3, pointLabel: '50% Max', appliedLoad: 7.500, indicatedValue: 7.501 },
      { step: 4, pointLabel: '500e (mpe switch)', appliedLoad: 2.500, indicatedValue: 2.500 },
      { step: 5, pointLabel: 'Min (20e)', appliedLoad: 0.100, indicatedValue: 0.100 }
    ]
  },
  repeatability: {
    appliedLoad: 7.500,
    rows: [
      { runNumber: 1, appliedLoad: 7.500, indicatedValue: 7.501 },
      { runNumber: 2, appliedLoad: 7.500, indicatedValue: 7.500 },
      { runNumber: 3, appliedLoad: 7.500, indicatedValue: 7.501 },
      { runNumber: 4, appliedLoad: 7.500, indicatedValue: 7.501 },
      { runNumber: 5, appliedLoad: 7.500, indicatedValue: 7.502 }
    ]
  }
};

const evaluation1 = evaluateReport({ instrument: sampleInstrument, tests: sampleTests });

const report1Data = {
  instrument: sampleInstrument,
  environment: sampleEnvironment,
  tests: sampleTests,
  attachments: [
    {
      name: 'Instrument_Front_Overview.png',
      caption: 'Mettler Toledo bC-U215 - Front view of platter and primary indicator display',
      type: 'photo'
    },
    {
      name: 'Verification_Data_Plate.png',
      caption: 'Stamped metrology data plate showing Max 15kg, e=5g, Class III mark',
      type: 'stamped_plate'
    }
  ],
  evaluation: evaluation1,
  notes: 'Instrument satisfies all metrological criteria of OIML R 76-1: 2006 for Class III NAWI type evaluation.'
};

const insertReport = db.prepare(`
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

insertReport.run(
  'LAB/R76/2026/0001',
  testerInfo.lastInsertRowid,
  'tester@metrology.lab',
  'Alex Vance (Verification Officer)',
  'Completed',
  'PASS',
  sampleInstrument.manufacturer,
  sampleInstrument.model,
  sampleInstrument.serialNumber,
  sampleInstrument.capacity,
  sampleInstrument.verificationInterval,
  sampleInstrument.accuracyClass,
  sampleInstrument.type,
  sampleEnvironment.labName,
  sampleEnvironment.date,
  sampleEnvironment.testerName,
  sampleEnvironment.temperature,
  sampleEnvironment.humidity,
  sampleEnvironment.pressure,
  JSON.stringify(report1Data),
  now,
  now
);

// 3. Initialize sequence table
db.prepare('INSERT INTO report_sequences (year, lastSeq) VALUES (?, ?)').run(2026, 1);

console.log('Seeded sample report: LAB/R76/2026/0001 (Verdict: PASS, Status: Completed)');
console.log('Database seed completed successfully!');
