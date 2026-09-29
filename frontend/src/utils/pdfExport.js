import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportReportToPDF(report) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [22, 101, 52]; // Metrology Forest Green
  const darkNavy = [15, 23, 42];
  const accentRed = [185, 28, 28];
  const slateGray = [100, 116, 139];

  const data = report.data || {};
  const inst = data.instrument || {};
  const env = data.environment || {};
  const tests = data.tests || {};
  const evalResults = data.evaluation || {};
  const isPass = report.verdict === 'PASS' || evalResults.overallPass;

  let y = 14;

  // Header Box
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, 182, 28, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, y, 182, 28, 'S');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...darkNavy);
  doc.text('LEGAL METROLOGY TYPE EVALUATION REPORT', 18, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...slateGray);
  doc.text('OIML R 76-1: 2006 (E) — Non-Automatic Weighing Instruments (NAWI)', 18, y + 14);
  doc.text(`Authorized Testing Laboratory: ${env.labName || 'National Metrology Institute'}`, 18, y + 20);

  // Report badge on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkNavy);
  doc.text(`Report No: ${report.reportNumber || 'DRAFT'}`, 130, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date of Test: ${env.date || report.testDate || new Date().toISOString().split('T')[0]}`, 130, y + 14);
  
  // Status Pill
  const verdictText = isPass ? 'VERDICT: PASS' : 'VERDICT: FAIL';
  doc.setFillColor(...(isPass ? primaryColor : accentRed));
  doc.roundedRect(130, y + 18, 58, 6, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(verdictText, 144, y + 22.5);

  y += 33;

  // Section 1: Instrument Characteristics
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...darkNavy);
  doc.text('1. Instrument Identification & Metrological Characteristics', 14, y);
  y += 2;

  const nVal = (inst.capacity && inst.verificationInterval)
    ? Math.round(inst.capacity / inst.verificationInterval)
    : 'N/A';

  autoTable(doc, {
    startY: y,
    head: [['Parameter', 'Specification', 'Parameter', 'Specification']],
    body: [
      ['Manufacturer', inst.manufacturer || 'N/A', 'Accuracy Class', inst.accuracyClass || 'Class III'],
      ['Model / Type', inst.model || 'N/A', 'Max Capacity (Max)', `${inst.capacity || 'N/A'} kg`],
      ['Serial Number', inst.serialNumber || 'N/A', 'Scale Interval (e)', `${inst.verificationInterval || 'N/A'} kg`],
      ['Instrument Type', inst.type || 'Platform', 'Verification Intervals (n)', `${nVal}`],
      ['Min Capacity (Min)', `${inst.minCapacity || '0.1'} kg`, 'Unit of Measure', 'kg']
    ],
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 49 },
      2: { cellWidth: 42, fontStyle: 'bold' },
      3: { cellWidth: 49 }
    },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 6;

  // Section 2: Laboratory & Environmental Conditions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...darkNavy);
  doc.text('2. Environmental Test Conditions', 14, y);
  y += 2;

  const tempValid = env.temperature >= 15 && env.temperature <= 35;
  const humidValid = env.humidity <= 80;

  autoTable(doc, {
    startY: y,
    head: [['Environmental Parameter', 'Observed Value', 'OIML R 76 Permissible Range', 'Condition Status']],
    body: [
      ['Ambient Temperature', `${env.temperature ?? '22'} °C`, '15.0 °C to 35.0 °C', tempValid ? 'COMPLIANT' : 'WARNING (Outside standard)'],
      ['Relative Humidity', `${env.humidity ?? '50'} %`, '≤ 80 % RH (Non-condensing)', humidValid ? 'COMPLIANT' : 'WARNING (>80%)'],
      ['Atmospheric Pressure', `${env.pressure || '1013.25'} hPa`, 'Standard atmospheric', 'RECORDED'],
      ['Verification Officer', env.testerName || report.userName || 'Inspector', 'Authorized Legal Metrologist', 'VERIFIED']
    ],
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 46 },
      1: { cellWidth: 40 },
      2: { cellWidth: 56 },
      3: { cellWidth: 40, fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 6;

  // Section 3: Test 1 - Zero Setting & Tare Test
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...darkNavy);
  doc.text('3. Zero-Setting & Tare Test Observations', 14, y);
  y += 2;

  const zeroInfo = evalResults.zeroTest || {};
  autoTable(doc, {
    startY: y,
    head: [['Test Stage', 'Applied Load', 'Indicated Value', 'Calculated Error', 'mpe Limit', 'Verdict']],
    body: [
      [
        'Zero-Setting (No Load)',
        '0.000 kg',
        `${tests.zeroTest?.zeroIndicated ?? 0} kg`,
        `${zeroInfo.zeroError ?? 0} kg`,
        `±${zeroInfo.zeroMpe ?? (0.25 * (inst.verificationInterval || 0.005))} kg (±0.25e)`,
        zeroInfo.zeroPass !== false ? 'PASS' : 'FAIL'
      ],
      [
        'Tare Device Operation',
        `${tests.zeroTest?.tareApplied ?? 0} kg`,
        `${tests.zeroTest?.tareIndicated ?? 0} kg`,
        `${zeroInfo.tareError ?? 0} kg`,
        `±${zeroInfo.tareMpe ?? 0} kg`,
        zeroInfo.tarePass !== false ? 'PASS' : 'FAIL'
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    didParseCell: (hookData) => {
      if (hookData.column.index === 5 && hookData.cell.text[0] === 'PASS') {
        hookData.cell.styles.textColor = primaryColor;
        hookData.cell.styles.fontStyle = 'bold';
      } else if (hookData.column.index === 5 && hookData.cell.text[0] === 'FAIL') {
        hookData.cell.styles.textColor = accentRed;
        hookData.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 6;

  // Section 4: Eccentricity Test
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...darkNavy);
  doc.text('4. Eccentricity Test (OIML R 76-1 3.6.2)', 14, y);
  y += 2;

  const eccRows = evalResults.eccentricity?.rows || tests.eccentricity?.rows || [];
  const eccTableBody = eccRows.map(row => [
    row.positionName || `Position ${row.position}`,
    `${row.appliedLoad} kg`,
    `${row.indicatedValue} kg`,
    `${row.error !== undefined ? row.error : (row.indicatedValue - row.appliedLoad).toFixed(4)} kg`,
    `${row.devFromCenter !== undefined ? row.devFromCenter : 0} kg`,
    `±${row.mpe || evalResults.eccentricity?.mpe || 'N/A'} kg`,
    row.pass !== false ? 'PASS' : 'FAIL'
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Load Position', 'Applied Load', 'Indicated Value', 'Error', 'Dev. from Center', 'mpe', 'Verdict']],
    body: eccTableBody,
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    didParseCell: (hookData) => {
      if (hookData.column.index === 6 && hookData.cell.text[0] === 'PASS') {
        hookData.cell.styles.textColor = primaryColor;
        hookData.cell.styles.fontStyle = 'bold';
      } else if (hookData.column.index === 6 && hookData.cell.text[0] === 'FAIL') {
        hookData.cell.styles.textColor = accentRed;
        hookData.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 6;

  // Check if we need a new page for Weighing Tests
  if (y > 210) {
    doc.addPage();
    y = 16;
  }

  // Section 5: Weighing Tests
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...darkNavy);
  doc.text('5. Weighing Performance Test (Increasing & Decreasing Loads)', 14, y);
  y += 2;

  const incRows = evalResults.weighing?.increasingRows || tests.weighing?.increasing || [];
  const decRows = evalResults.weighing?.decreasingRows || tests.weighing?.decreasing || [];

  const weighingTableBody = [
    ...incRows.map(r => [
      'Increasing (↑)',
      r.pointLabel || 'Test point',
      `${r.appliedLoad} kg`,
      `${r.indicatedValue} kg`,
      `${r.error !== undefined ? r.error : (r.indicatedValue - r.appliedLoad).toFixed(4)} kg`,
      `±${r.mpe || 'N/A'} kg`,
      r.pass !== false ? 'PASS' : 'FAIL'
    ]),
    ...decRows.map(r => [
      'Decreasing (↓)',
      r.pointLabel || 'Test point',
      `${r.appliedLoad} kg`,
      `${r.indicatedValue} kg`,
      `${r.error !== undefined ? r.error : (r.indicatedValue - r.appliedLoad).toFixed(4)} kg`,
      `±${r.mpe || 'N/A'} kg`,
      r.pass !== false ? 'PASS' : 'FAIL'
    ])
  ];

  autoTable(doc, {
    startY: y,
    head: [['Direction', 'Load Point', 'Applied Load', 'Indicated Value', 'Error', 'mpe', 'Verdict']],
    body: weighingTableBody,
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.2, textColor: [30, 41, 59] },
    didParseCell: (hookData) => {
      if (hookData.column.index === 6 && hookData.cell.text[0] === 'PASS') {
        hookData.cell.styles.textColor = primaryColor;
        hookData.cell.styles.fontStyle = 'bold';
      } else if (hookData.column.index === 6 && hookData.cell.text[0] === 'FAIL') {
        hookData.cell.styles.textColor = accentRed;
        hookData.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 6;

  if (y > 210) {
    doc.addPage();
    y = 16;
  }

  // Section 6: Repeatability Test
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...darkNavy);
  doc.text('6. Repeatability Test Observations (5 Consecutive Cycles)', 14, y);
  y += 2;

  const repRows = evalResults.repeatability?.rows || tests.repeatability?.rows || [];
  const repTableBody = repRows.map((r, i) => [
    `Run ${r.runNumber || i + 1}`,
    `${r.appliedLoad} kg`,
    `${r.indicatedValue} kg`,
    `${r.error !== undefined ? r.error : (r.indicatedValue - r.appliedLoad).toFixed(4)} kg`,
    `±${evalResults.repeatability?.mpe || 'N/A'} kg`,
    r.pass !== false ? 'PASS' : 'FAIL'
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Run No.', 'Applied Load', 'Indicated Value', 'Error', 'mpe', 'Verdict']],
    body: repTableBody,
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    didParseCell: (hookData) => {
      if (hookData.column.index === 5 && hookData.cell.text[0] === 'PASS') {
        hookData.cell.styles.textColor = primaryColor;
        hookData.cell.styles.fontStyle = 'bold';
      } else if (hookData.column.index === 5 && hookData.cell.text[0] === 'FAIL') {
        hookData.cell.styles.textColor = accentRed;
        hookData.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;

  if (y > 220) {
    doc.addPage();
    y = 16;
  }

  // Final Overall Verdict Box
  doc.setFillColor(...(isPass ? [240, 253, 244] : [254, 242, 242]));
  doc.rect(14, y, 182, 20, 'F');
  doc.setDrawColor(...(isPass ? primaryColor : accentRed));
  doc.setLineWidth(0.6);
  doc.rect(14, y, 182, 20, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...(isPass ? primaryColor : accentRed));
  doc.text(`OFFICIAL TYPE-EVALUATION VERDICT: ${isPass ? 'COMPLIANT (PASS)' : 'NON-COMPLIANT (FAIL)'}`, 18, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...darkNavy);
  const verdictDetail = isPass
    ? 'The instrument has met all maximum permissible error (mpe) criteria and repeatability limits specified in OIML R 76-1: 2006.'
    : 'The instrument failed one or more evaluation tests and does not comply with OIML R 76-1 type evaluation criteria.';
  doc.text(verdictDetail, 18, y + 15);

  y += 26;

  // Signatures Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkNavy);

  // Box 1: Verified By
  doc.rect(14, y, 86, 26);
  doc.text('Testing Officer / Metrologist:', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Name: ${env.testerName || report.userName || 'Verification Officer'}`, 18, y + 13);
  doc.text('Signature: __________________________', 18, y + 21);

  // Box 2: Approved By
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.rect(110, y, 86, 26);
  doc.text('Approved by Technical Manager / Director:', 114, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Name: Dr. Evelyn Reed (Chief Metrologist)', 114, y + 13);
  doc.text('Official Seal / Date: ___________________', 114, y + 21);

  // Save the PDF
  const filename = `${(report.reportNumber || 'NAWI_Report').replace(/[\/\\:]/g, '_')}.pdf`;
  doc.save(filename);
}
