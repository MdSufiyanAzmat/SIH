/**
 * OIML R 76 Metrological Evaluation Utility
 *
 * Implements OIML R 76-1: 2006 (E) Table 6 Maximum Permissible Errors (mpe)
 * on initial verification and type evaluation.
 */

export const ACCURACY_CLASSES = {
  CLASS_I: 'Class I',
  CLASS_II: 'Class II',
  CLASS_III: 'Class III',
  CLASS_IIII: 'Class IIII',
};

export function round(num, decimals = 4) {
  if (num === null || num === undefined || isNaN(num) || num === '') return 0;
  return Number(Math.round(Number(num + 'e' + decimals)) + 'e-' + decimals);
}

/**
 * Pure function: Calculates Maximum Permissible Error (mpe) in kg per OIML R 76-1 Table 6.
 *
 * @param {number} load - Applied test load in kg
 * @param {number} e - Verification scale interval in kg
 * @param {string} [classType='Class III'] - Accuracy class ('Class I' | 'Class II' | 'Class III' | 'Class IIII')
 * @param {number} [maxCapacity=null] - Maximum capacity (Max) in kg (optional)
 * @returns {number} The maximum permissible error in kg
 */
export function getMPE(load, e, classType = 'Class III', maxCapacity = null) {
  const numLoad = Math.abs(Number(load) || 0);
  const numE = Number(e);
  if (!numE || numE <= 0) return 0;

  // Normalize classType (handles 'Class II', 'class ii', 'II', '2', etc.)
  const normalizedClass = String(classType || 'Class III')
    .toUpperCase()
    .replace(/[^IV\d]/g, '');

  const m = numLoad / numE; // Load in multiples of verification scale interval (e)

  let multiplier = 0.5;

  if (normalizedClass === 'I' || normalizedClass === '1') {
    // Class I (Special Accuracy): 0–50k: ±0.5e, 50k–200k: ±1.0e, >200k: ±1.5e
    if (m <= 50000) {
      multiplier = 0.5;
    } else if (m <= 200000) {
      multiplier = 1.0;
    } else {
      multiplier = 1.5;
    }
  } else if (normalizedClass === 'II' || normalizedClass === '2') {
    // Class II (High Accuracy): 0–5k: ±0.5e, 5k–20k: ±1.0e, >20k: ±1.5e
    if (m <= 5000) {
      multiplier = 0.5;
    } else if (m <= 20000) {
      multiplier = 1.0;
    } else {
      multiplier = 1.5;
    }
  } else if (normalizedClass === 'IIII' || normalizedClass === 'IV' || normalizedClass === '4') {
    // Class IIII (Ordinary Accuracy): 0–50: ±0.5e, 50–200: ±1.0e, >200: ±1.5e
    if (m <= 50) {
      multiplier = 0.5;
    } else if (m <= 200) {
      multiplier = 1.0;
    } else {
      multiplier = 1.5;
    }
  } else {
    // Class III (Medium Accuracy): 0–500: ±0.5e, 500–2000: ±1.0e, >2000: ±1.5e
    if (m <= 500) {
      multiplier = 0.5;
    } else if (m <= 2000) {
      multiplier = 1.0;
    } else {
      multiplier = 1.5;
    }
  }

  // Calculate mpe in kg with clean floating-point precision
  const rawMpe = multiplier * numE;
  return Number(Math.round(Number(rawMpe + 'e10')) + 'e-10');
}

/**
 * Helper to obtain limit description and multiplier for UI badges
 */
export function getMPEDetails(load, e, classType = 'Class III', maxCapacity = null) {
  const mpeValue = getMPE(load, e, classType, maxCapacity);
  const numE = Number(e) || 0.005;
  const mpeInE = numE > 0 ? Number((mpeValue / numE).toFixed(2)) : 0.5;
  return {
    mpeValue,
    mpeInE,
    limitDescription: `±${mpeInE}e`
  };
}

/**
 * Default OIML test points for weighing test: Min, 500e, 2000e, 50% Max, Max
 */
export function generateDefaultWeighingPoints(capacity, e, accuracyClass = ACCURACY_CLASSES.CLASS_III) {
  const cap = Number(capacity) || 15;
  const interval = Number(e) || 0.005;

  let minLoad = 20 * interval;
  let p1 = 500 * interval;
  let p2 = 2000 * interval;

  const normalized = String(accuracyClass || '').toUpperCase();
  if (normalized.includes('I') && !normalized.includes('II') && !normalized.includes('III')) {
    minLoad = 100 * interval;
    p1 = 50000 * interval;
    p2 = 200000 * interval;
  } else if (normalized.includes('II') && !normalized.includes('III') && !normalized.includes('IIII')) {
    minLoad = 50 * interval;
    p1 = 5000 * interval;
    p2 = 20000 * interval;
  } else if (normalized.includes('IIII') || normalized.includes('IV')) {
    minLoad = 10 * interval;
    p1 = 50 * interval;
    p2 = 200 * interval;
  }

  const pHalf = cap * 0.5;

  const points = [
    { pointLabel: 'Min (Minimum Capacity)', appliedLoad: round(minLoad, 4) },
    { pointLabel: 'Step 1 (mpe switch point)', appliedLoad: round(Math.min(p1, cap * 0.3), 4) },
    { pointLabel: '50% Max Capacity', appliedLoad: round(pHalf, 4) },
    { pointLabel: 'Step 2 (mpe switch point)', appliedLoad: round(Math.min(p2, cap * 0.7), 4) },
    { pointLabel: 'Max (Maximum Capacity)', appliedLoad: round(cap, 4) }
  ];

  // Return points sorted and deduped
  const unique = [];
  points.forEach(p => {
    if (p.appliedLoad > 0 && p.appliedLoad <= cap && !unique.some(u => u.appliedLoad === p.appliedLoad)) {
      unique.push(p);
    }
  });

  return unique.sort((a, b) => a.appliedLoad - b.appliedLoad);
}

/**
 * Client-side evaluation helper for instant UI feedback
 */
export function evaluateAllTests(instrument, tests) {
  const e = Number(instrument?.verificationInterval) || 0.005;
  const accuracyClass = instrument?.accuracyClass || ACCURACY_CLASSES.CLASS_III;
  const capacity = Number(instrument?.capacity) || 15;
  const epsilon = 1e-7;

  let overallPass = true;
  const failures = [];

  // 1. Zero test
  const zeroIndicated = Number(tests?.zeroTest?.zeroIndicated ?? 0);
  const zeroError = round(zeroIndicated, 5);
  const zeroMpe = round(0.25 * e, 5);
  const zeroPass = Math.abs(zeroError) <= zeroMpe + epsilon;
  if (!zeroPass) {
    overallPass = false;
    failures.push('Zero-setting error exceeds ±0.25e');
  }

  let tarePass = true;
  let tareError = 0;
  let tareMpe = 0;
  if (tests?.zeroTest?.tareApplied !== undefined && tests?.zeroTest?.tareApplied !== '') {
    const tareLoad = Number(tests.zeroTest.tareApplied);
    const tareInd = Number(tests.zeroTest.tareIndicated ?? tareLoad);
    tareError = round(tareInd - tareLoad, 5);
    tareMpe = getMPE(tareLoad, e, accuracyClass, capacity);
    tarePass = Math.abs(tareError) <= tareMpe + epsilon;
    if (!tarePass) {
      overallPass = false;
      failures.push('Tare test error exceeds mpe');
    }
  }

  // 2. Eccentricity
  const eccRows = (tests?.eccentricity?.rows || []).map((row, idx) => {
    const load = Number(row.appliedLoad || 0);
    const indicated = Number(row.indicatedValue || 0);
    const error = round(indicated - load, 5);
    const centerRow = tests.eccentricity.rows[0];
    const centerVal = centerRow ? Number(centerRow.indicatedValue || 0) : 0;
    const devFromCenter = round(Math.abs(indicated - centerVal), 5);
    const mpe = getMPE(load, e, accuracyClass, capacity);
    const pass = Math.abs(error) <= mpe + epsilon && devFromCenter <= mpe + epsilon;
    if (!pass) {
      overallPass = false;
    }
    return { ...row, error, devFromCenter, mpe, pass };
  });

  // 3. Weighing
  const evalWeighingList = (list) => {
    return (list || []).map(row => {
      const load = Number(row.appliedLoad || 0);
      const indicated = Number(row.indicatedValue || 0);
      const error = round(indicated - load, 5);
      const mpeValue = getMPE(load, e, accuracyClass, capacity);
      const details = getMPEDetails(load, e, accuracyClass, capacity);
      const pass = Math.abs(error) <= mpeValue + epsilon;
      if (!pass) overallPass = false;
      return { ...row, error, mpe: mpeValue, limitDescription: details.limitDescription, pass };
    });
  };

  const incRows = evalWeighingList(tests?.weighing?.increasing);
  const decRows = evalWeighingList(tests?.weighing?.decreasing);

  // 4. Repeatability
  const repRows = (tests?.repeatability?.rows || []);
  const repIndicated = repRows.map(r => Number(r.indicatedValue || 0));
  const maxRep = repIndicated.length ? Math.max(...repIndicated) : 0;
  const minRep = repIndicated.length ? Math.min(...repIndicated) : 0;
  const repRange = round(maxRep - minRep, 5);
  const repLoad = Number(repRows[0]?.appliedLoad || 0);
  const repMpe = getMPE(repLoad, e, accuracyClass, capacity);

  let repAllPass = true;
  const evaluatedRepRows = repRows.map(row => {
    const load = Number(row.appliedLoad || repLoad);
    const indicated = Number(row.indicatedValue || 0);
    const error = round(indicated - load, 5);
    const pass = Math.abs(error) <= repMpe + epsilon;
    if (!pass) repAllPass = false;
    return { ...row, error, pass };
  });

  const repPass = (repRange <= repMpe + epsilon) && repAllPass;
  if (!repPass) overallPass = false;

  return {
    overallPass,
    failures,
    zero: { zeroError, zeroMpe, zeroPass, tareError, tareMpe, tarePass },
    eccentricity: { rows: eccRows },
    weighing: { increasing: incRows, decreasing: decRows },
    repeatability: { rows: evaluatedRepRows, range: repRange, mpe: repMpe, pass: repPass }
  };
}
