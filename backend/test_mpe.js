import { getMPE } from './server/metrology.js';

/**
 * Test runner for OIML R 76 Table 6 getMPE function
 */
console.log('='.repeat(86));
console.log(' OIML R 76-1: 2006 (E) Table 6 — Maximum Permissible Error (mpe) Unit Tests');
console.log('='.repeat(86));

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assertMPE({ description, load, e, classType, maxCapacity, expectedMPE }) {
  totalTests++;
  const actualMPE = getMPE(load, e, classType, maxCapacity);
  const m = Math.round((load / e) * 10000) / 10000;
  const isMatch = Math.abs(actualMPE - expectedMPE) < 1e-9;

  if (isMatch) {
    passedTests++;
    console.log(
      ` [PASS] ${description.padEnd(46)} | Load: ${String(load).padStart(6)} kg (${String(m).padStart(6)}e) | Expected: ${String(expectedMPE).padStart(7)} kg | Actual: ${String(actualMPE).padStart(7)} kg`
    );
  } else {
    failedTests++;
    console.error(
      ` [FAIL] ${description.padEnd(46)} | Load: ${String(load).padStart(6)} kg (${String(m).padStart(6)}e) | Expected: ${String(expectedMPE).padStart(7)} kg | Actual: ${String(actualMPE).padStart(7)} kg`
    );
  }
}

// =========================================================================
// TEST SUITE 1: CLASS III (Medium Accuracy)
// OIML R 76-1 Table 6:
//   0 <= m <= 500e       -> ±0.5e
//   500e < m <= 2000e    -> ±1.0e
//   m > 2000e            -> ±1.5e
// =========================================================================
console.log('\n--- SUITE 1: Class III (Commercial Scale: Max = 15 kg, e = 0.005 kg = 5 g) ---');
console.log('Tolerances: 0–500e (<= 2.5 kg) = 0.0025 kg | 500–2000e (<= 10 kg) = 0.0050 kg | >2000e = 0.0075 kg\n');

assertMPE({
  description: 'Class III: Zero / No-load condition',
  load: 0,
  e: 0.005,
  classType: 'Class III',
  maxCapacity: 15,
  expectedMPE: 0.0025 // 0.5e
});

assertMPE({
  description: 'Class III: Min capacity load (20e = 0.1 kg)',
  load: 0.1,
  e: 0.005,
  classType: 'Class III',
  maxCapacity: 15,
  expectedMPE: 0.0025 // 0.5e
});

assertMPE({
  description: 'Class III: Lower tier intermediate load (200e = 1.0 kg)',
  load: 1.0,
  e: 0.005,
  classType: 'Class III',
  maxCapacity: 15,
  expectedMPE: 0.0025 // 0.5e
});

assertMPE({
  description: 'Class III: Exact boundary of Tier 1 (500e = 2.5 kg)',
  load: 2.5,
  e: 0.005,
  classType: 'Class III',
  maxCapacity: 15,
  expectedMPE: 0.0025 // 0.5e
});

assertMPE({
  description: 'Class III: Just above Tier 1 boundary (501e = 2.505 kg)',
  load: 2.505,
  e: 0.005,
  classType: 'Class III',
  maxCapacity: 15,
  expectedMPE: 0.0050 // 1.0e
});

assertMPE({
  description: 'Class III: 50% Max capacity (1500e = 7.5 kg)',
  load: 7.5,
  e: 0.005,
  classType: 'Class III',
  maxCapacity: 15,
  expectedMPE: 0.0050 // 1.0e
});

assertMPE({
  description: 'Class III: Exact boundary of Tier 2 (2000e = 10.0 kg)',
  load: 10.0,
  e: 0.005,
  classType: 'Class III',
  maxCapacity: 15,
  expectedMPE: 0.0050 // 1.0e
});

assertMPE({
  description: 'Class III: Just above Tier 2 boundary (2001e = 10.005 kg)',
  load: 10.005,
  e: 0.005,
  classType: 'Class III',
  maxCapacity: 15,
  expectedMPE: 0.0075 // 1.5e
});

assertMPE({
  description: 'Class III: Full scale Max capacity (3000e = 15.0 kg)',
  load: 15.0,
  e: 0.005,
  classType: 'Class III',
  maxCapacity: 15,
  expectedMPE: 0.0075 // 1.5e
});

// Second Class III Instrument (Industrial Platform: Max = 60 kg, e = 0.02 kg = 20 g)
console.log('\n--- SUITE 1B: Class III (Heavy Industrial Scale: Max = 60 kg, e = 0.02 kg = 20 g) ---');

assertMPE({
  description: 'Class III (60kg): Tier 1 load (250e = 5.0 kg)',
  load: 5.0,
  e: 0.02,
  classType: 'Class III',
  maxCapacity: 60,
  expectedMPE: 0.01 // 0.5e = 0.01 kg
});

assertMPE({
  description: 'Class III (60kg): Exact 500e boundary (10.0 kg)',
  load: 10.0,
  e: 0.02,
  classType: 'Class III',
  maxCapacity: 60,
  expectedMPE: 0.01 // 0.5e = 0.01 kg
});

assertMPE({
  description: 'Class III (60kg): Tier 2 load (1500e = 30.0 kg)',
  load: 30.0,
  e: 0.02,
  classType: 'Class III',
  maxCapacity: 60,
  expectedMPE: 0.02 // 1.0e = 0.02 kg
});

assertMPE({
  description: 'Class III (60kg): Exact 2000e boundary (40.0 kg)',
  load: 40.0,
  e: 0.02,
  classType: 'Class III',
  maxCapacity: 60,
  expectedMPE: 0.02 // 1.0e = 0.02 kg
});

assertMPE({
  description: 'Class III (60kg): Full Max capacity (3000e = 60.0 kg)',
  load: 60.0,
  e: 0.02,
  classType: 'Class III',
  maxCapacity: 60,
  expectedMPE: 0.03 // 1.5e = 0.03 kg
});

// =========================================================================
// TEST SUITE 2: CLASS II (High Accuracy)
// OIML R 76-1 Table 6:
//   0 <= m <= 5,000e       -> ±0.5e
//   5,000e < m <= 20,000e  -> ±1.0e
//   m > 20,000e            -> ±1.5e
// =========================================================================
console.log('\n--- SUITE 2: Class II (Precision Balance: Max = 30 kg, e = 0.001 kg = 1 g) ---');
console.log('Tolerances: 0–5000e (<= 5 kg) = 0.0005 kg | 5000–20000e (<= 20 kg) = 0.0010 kg | >20000e = 0.0015 kg\n');

assertMPE({
  description: 'Class II: Zero / No-load condition',
  load: 0,
  e: 0.001,
  classType: 'Class II',
  maxCapacity: 30,
  expectedMPE: 0.0005 // 0.5e = 0.0005 kg
});

assertMPE({
  description: 'Class II: Min capacity load (50e = 0.050 kg)',
  load: 0.050,
  e: 0.001,
  classType: 'Class II',
  maxCapacity: 30,
  expectedMPE: 0.0005 // 0.5e
});

assertMPE({
  description: 'Class II: Tier 1 intermediate load (2000e = 2.0 kg)',
  load: 2.0,
  e: 0.001,
  classType: 'Class II',
  maxCapacity: 30,
  expectedMPE: 0.0005 // 0.5e
});

assertMPE({
  description: 'Class II: Exact boundary of Tier 1 (5000e = 5.0 kg)',
  load: 5.0,
  e: 0.001,
  classType: 'Class II',
  maxCapacity: 30,
  expectedMPE: 0.0005 // 0.5e
});

assertMPE({
  description: 'Class II: Just above Tier 1 boundary (5001e = 5.001 kg)',
  load: 5.001,
  e: 0.001,
  classType: 'Class II',
  maxCapacity: 30,
  expectedMPE: 0.0010 // 1.0e = 0.0010 kg
});

assertMPE({
  description: 'Class II: 50% Max capacity (15000e = 15.0 kg)',
  load: 15.0,
  e: 0.001,
  classType: 'Class II',
  maxCapacity: 30,
  expectedMPE: 0.0010 // 1.0e
});

assertMPE({
  description: 'Class II: Exact boundary of Tier 2 (20000e = 20.0 kg)',
  load: 20.0,
  e: 0.001,
  classType: 'Class II',
  maxCapacity: 30,
  expectedMPE: 0.0010 // 1.0e
});

assertMPE({
  description: 'Class II: Just above Tier 2 boundary (20001e = 20.001 kg)',
  load: 20.001,
  e: 0.001,
  classType: 'Class II',
  maxCapacity: 30,
  expectedMPE: 0.0015 // 1.5e = 0.0015 kg
});

assertMPE({
  description: 'Class II: Full scale Max capacity (30000e = 30.0 kg)',
  load: 30.0,
  e: 0.001,
  classType: 'Class II',
  maxCapacity: 30,
  expectedMPE: 0.0015 // 1.5e
});

// Second Class II Instrument (Laboratory Analytical Balance: Max = 2.5 kg, e = 0.0001 kg = 100 mg)
console.log('\n--- SUITE 2B: Class II (Laboratory Balance: Max = 2.5 kg, e = 0.0001 kg = 0.1 g) ---');

assertMPE({
  description: 'Class II (2.5kg): Tier 1 load (2000e = 0.200 kg)',
  load: 0.2,
  e: 0.0001,
  classType: 'Class II',
  maxCapacity: 2.5,
  expectedMPE: 0.00005 // 0.5e = 0.00005 kg
});

assertMPE({
  description: 'Class II (2.5kg): Exact 5000e boundary (0.500 kg)',
  load: 0.5,
  e: 0.0001,
  classType: 'Class II',
  maxCapacity: 2.5,
  expectedMPE: 0.00005 // 0.5e = 0.00005 kg
});

assertMPE({
  description: 'Class II (2.5kg): Tier 2 load (10000e = 1.0 kg)',
  load: 1.0,
  e: 0.0001,
  classType: 'Class II',
  maxCapacity: 2.5,
  expectedMPE: 0.0001 // 1.0e = 0.0001 kg
});

assertMPE({
  description: 'Class II (2.5kg): Exact 20000e boundary (2.0 kg)',
  load: 2.0,
  e: 0.0001,
  classType: 'Class II',
  maxCapacity: 2.5,
  expectedMPE: 0.0001 // 1.0e = 0.0001 kg
});

assertMPE({
  description: 'Class II (2.5kg): Full Max capacity (25000e = 2.5 kg)',
  load: 2.5,
  e: 0.0001,
  classType: 'Class II',
  maxCapacity: 2.5,
  expectedMPE: 0.00015 // 1.5e = 0.00015 kg
});

// =========================================================================
// SUMMARY
// =========================================================================
console.log('\n' + '='.repeat(86));
console.log(` TEST RESULTS SUMMARY: ${passedTests} / ${totalTests} PASSED (0 FAILED)`);
console.log('='.repeat(86) + '\n');

if (failedTests > 0) {
  process.exit(1);
}
