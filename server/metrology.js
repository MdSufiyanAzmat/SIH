/**
 * OIML R 76-1: 2006 Non-Automatic Weighing Instruments (NAWI)
 * Type Evaluation Metrology Calculations & Verification Rules
 */

export const ACCURACY_CLASSES = {
  CLASS_I: 'Class I',
  CLASS_II: 'Class II',
  CLASS_III: 'Class III',
  CLASS_IIII: 'Class IIII',
};

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

  const normalizedClass = String(classType || 'Class III')
    .toUpperCase()
    .replace(/[^IV\d]/g, '');

  const m = numLoad / numE;

  let multiplier = 0.5;

  if (normalizedClass === 'I' || normalizedClass === '1') {
    if (m <= 50000) multiplier = 0.5;
    else if (m <= 200000) multiplier = 1.0;
    else multiplier = 1.5;
  } else if (normalizedClass === 'II' || normalizedClass === '2') {
    if (m <= 5000) multiplier = 0.5;
    else if (m <= 20000) multiplier = 1.0;
    else multiplier = 1.5;
  } else if (normalizedClass === 'IIII' || normalizedClass === 'IV' || normalizedClass === '4') {
    if (m <= 50) multiplier = 0.5;
    else if (m <= 200) multiplier = 1.0;
    else multiplier = 1.5;
  } else {
    // Class III default
    if (m <= 500) multiplier = 0.5;
    else if (m <= 2000) multiplier = 1.0;
    else multiplier = 1.5;
  }

  const rawMpe = multiplier * numE;
  return Number(Math.round(Number(rawMpe + 'e10')) + 'e-10');
}

/**
 * Returns mpe (Maximum Permissible Error) in units of verification scale interval (e)
 * per OIML R 76-1 Table 6 (for initial verification / type evaluation).
 * @param {number} load Load in kg (or instrument units)
 * @param {number} e Verification scale interval in same units
 * @param {string} accuracyClass 'Class I' | 'Class II' | 'Class III' | 'Class IIII'
 * @returns {{ mpeInE: number, mpeValue: number, limitDescription: string }}
 */
export function calculateMPE(load, e, accuracyClass = ACCURACY_CLASSES.CLASS_III) {
  const mpeValue = getMPE(load, e, accuracyClass);
  const numE = Number(e) || 0.005;
  const mpeInE = numE > 0 ? Number((mpeValue / numE).toFixed(2)) : 0.5;
  return {
    mpeInE,
    mpeValue,
    limitDescription: `±${mpeInE}e`
  };
}

/**
 * Clean floating point arithmetic
 */
export function roundToPrecision(num, decimals = 4) {
  if (num === null || num === undefined || isNaN(num)) return 0;
  return Number(Math.round(Number(num + 'e' + decimals)) + 'e-' + decimals);
}

/**
 * Standard test load recommendations per OIML R 76 for an instrument
 */
export function getDefaultTestPoints(capacity, e, accuracyClass = ACCURACY_CLASSES.CLASS_III) {
  const cap = Number(capacity) || 15;
  const interval = Number(e) || 0.005;

  let minPoints = 20 * interval;
  let p1 = 500 * interval;
  let p2 = 2000 * interval;

  if (accuracyClass === ACCURACY_CLASSES.CLASS_I) {
    minPoints = 100 * interval;
    p1 = 50000 * interval;
    p2 = 200000 * interval;
  } else if (accuracyClass === ACCURACY_CLASSES.CLASS_II) {
    minPoints = 50 * interval;
    p1 = 5000 * interval;
    p2 = 20000 * interval;
  } else if (accuracyClass === ACCURACY_CLASSES.CLASS_IIII) {
    minPoints = 10 * interval;
    p1 = 50 * interval;
    p2 = 200 * interval;
  }

  const pHalf = cap * 0.5;
  const points = [
    { label: 'Min', load: roundToPrecision(minPoints, 4) },
    { label: 'Step 1 (mpe switch)', load: roundToPrecision(Math.min(p1, cap * 0.3), 4) },
    { label: 'Step 2 (mpe switch)', load: roundToPrecision(Math.min(p2, cap * 0.6), 4) },
    { label: '50% Max', load: roundToPrecision(pHalf, 4) },
    { label: 'Max', load: roundToPrecision(cap, 4) }
  ];

  return points.filter((pt, index, self) =>
    index === self.findIndex((t) => t.load === pt.load && t.load <= cap)
  );
}

/**
 * Evaluate all test observations against OIML R 76 criteria.
 */
export function evaluateReport(reportData) {
  const { instrument, tests } = reportData;
  const e = Number(instrument?.verificationInterval) || 0.005;
  const accuracyClass = instrument?.accuracyClass || ACCURACY_CLASSES.CLASS_III;
  const epsilon = 1e-7;

  const results = {
    zeroTest: { pass: true, error: null, tarePass: true },
    eccentricity: { pass: true, rows: [], maxDeviation: 0, mpe: 0 },
    weighing: { pass: true, increasingRows: [], decreasingRows: [] },
    repeatability: { pass: true, rows: [], range: 0, mpe: 0, maxReading: 0, minReading: 0 },
    overallPass: true,
    summary: []
  };

  // 1. Zero-setting / Tare Test
  if (tests?.zeroTest) {
    const zeroIndicated = Number(tests.zeroTest.zeroIndicated ?? 0);
    const zeroError = roundToPrecision(zeroIndicated - 0, 5);
    const zeroMpe = roundToPrecision(0.25 * e, 5); // OIML R 76-1 4.5.1: error of zero setting <= 0.25e
    const zeroPass = Math.abs(zeroError) <= zeroMpe + epsilon;

    let tarePass = true;
    let tareError = 0;
    let tareMpe = 0;
    if (tests.zeroTest.tareApplied !== undefined && tests.zeroTest.tareApplied !== null && tests.zeroTest.tareApplied !== '') {
      const tareApplied = Number(tests.zeroTest.tareApplied);
      const tareIndicated = Number(tests.zeroTest.tareIndicated ?? tareApplied);
      tareError = roundToPrecision(tareIndicated - tareApplied, 5);
      const mpeInfo = calculateMPE(tareApplied, e, accuracyClass);
      tareMpe = mpeInfo.mpeValue;
      tarePass = Math.abs(tareError) <= tareMpe + epsilon;
    }

    results.zeroTest = {
      pass: zeroPass && tarePass,
      zeroError,
      zeroMpe,
      zeroPass,
      tareError,
      tareMpe,
      tarePass
    };

    if (!results.zeroTest.pass) {
      results.overallPass = false;
      results.summary.push('Zero-setting or Tare test exceeded permissible error limit.');
    }
  }

  // 2. Eccentricity Test (Positions 1 to 5)
  if (tests?.eccentricity && Array.isArray(tests.eccentricity.rows)) {
    const rows = tests.eccentricity.rows;
    const centerRow = rows.find(r => r.position === 1 || r.positionName?.toLowerCase().includes('center')) || rows[0];
    const centerIndicated = centerRow ? Number(centerRow.indicatedValue) : 0;
    const eccLoad = centerRow ? Number(centerRow.appliedLoad) : (Number(instrument.capacity) / 3);
    const { mpeValue: eccMpe } = calculateMPE(eccLoad, e, accuracyClass);

    let eccPass = true;
    let maxDev = 0;

    const evaluatedEccRows = rows.map((row) => {
      const load = Number(row.appliedLoad || 0);
      const indicated = Number(row.indicatedValue || 0);
      const error = roundToPrecision(indicated - load, 5);
      const devFromCenter = roundToPrecision(Math.abs(indicated - centerIndicated), 5);
      if (devFromCenter > maxDev) maxDev = devFromCenter;

      const { mpeValue } = calculateMPE(load, e, accuracyClass);
      // OIML R 76 3.6.2: error at any position shall not exceed mpe, and difference from center shall not exceed mpe
      const rowPass = Math.abs(error) <= mpeValue + epsilon && devFromCenter <= mpeValue + epsilon;
      if (!rowPass) eccPass = false;

      return {
        ...row,
        error,
        mpe: mpeValue,
        devFromCenter,
        pass: rowPass
      };
    });

    results.eccentricity = {
      pass: eccPass,
      rows: evaluatedEccRows,
      maxDeviation: maxDev,
      mpe: eccMpe
    };

    if (!eccPass) {
      results.overallPass = false;
      results.summary.push('Eccentricity test exceeded permissible error or center deviation limit.');
    }
  }

  // 3. Weighing Tests (Increasing and Decreasing)
  const evalWeighingRows = (rows, direction) => {
    let dirPass = true;
    const evalRows = (rows || []).map((row) => {
      const load = Number(row.appliedLoad || 0);
      const indicated = Number(row.indicatedValue || 0);
      const error = roundToPrecision(indicated - load, 5);
      const { mpeValue, limitDescription } = calculateMPE(load, e, accuracyClass);
      const pass = Math.abs(error) <= mpeValue + epsilon;
      if (!pass) dirPass = false;

      return {
        ...row,
        direction,
        error,
        mpe: mpeValue,
        mpeRule: limitDescription,
        pass
      };
    });
    return { dirPass, evalRows };
  };

  if (tests?.weighing) {
    const inc = evalWeighingRows(tests.weighing.increasing, 'Increasing (↑)');
    const dec = evalWeighingRows(tests.weighing.decreasing, 'Decreasing (↓)');

    const weighingPass = inc.dirPass && dec.dirPass;
    results.weighing = {
      pass: weighingPass,
      increasingRows: inc.evalRows,
      decreasingRows: dec.evalRows
    };

    if (!weighingPass) {
      results.overallPass = false;
      results.summary.push('Weighing test (increasing or decreasing) exceeded maximum permissible error.');
    }
  }

  // 4. Repeatability Test (5 successive runs)
  if (tests?.repeatability && Array.isArray(tests.repeatability.rows) && tests.repeatability.rows.length > 0) {
    const rows = tests.repeatability.rows;
    const indicatedValues = rows.map(r => Number(r.indicatedValue || 0));
    const maxReading = Math.max(...indicatedValues);
    const minReading = Math.min(...indicatedValues);
    const range = roundToPrecision(maxReading - minReading, 5);

    const testLoad = Number(rows[0]?.appliedLoad || 0);
    const { mpeValue } = calculateMPE(testLoad, e, accuracyClass);

    // OIML R 76-1 3.6.1: difference between results of several weighings of same load shall not be greater than absolute value of mpe
    let allIndividualPass = true;
    const evalRows = rows.map((row, idx) => {
      const load = Number(row.appliedLoad || testLoad);
      const indicated = Number(row.indicatedValue || 0);
      const error = roundToPrecision(indicated - load, 5);
      const pass = Math.abs(error) <= mpeValue + epsilon;
      if (!pass) allIndividualPass = false;
      return {
        ...row,
        runNumber: idx + 1,
        error,
        pass
      };
    });

    const repeatabilityPass = (range <= mpeValue + epsilon) && allIndividualPass;
    results.repeatability = {
      pass: repeatabilityPass,
      rows: evalRows,
      range,
      mpe: mpeValue,
      maxReading,
      minReading
    };

    if (!repeatabilityPass) {
      results.overallPass = false;
      results.summary.push(`Repeatability test range (${range}) exceeded mpe (${mpeValue}).`);
    }
  }

  return results;
}
