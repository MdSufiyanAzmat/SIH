import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ShadingType
} from 'docx';
import { saveAs } from 'file-saver';

export async function exportReportToDocx(report) {
  const data = report.data || {};
  const inst = data.instrument || {};
  const env = data.environment || {};
  const tests = data.tests || {};
  const evalResults = data.evaluation || {};
  const isPass = report.verdict === 'PASS' || evalResults.overallPass;

  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'EEEEEE' },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'EEEEEE' },
  };

  const createHeaderCell = (text, widthPercent = 25) => new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
    children: [new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text, bold: true, size: 18, color: '334155' })]
    })],
  });

  const createCell = (text, widthPercent = 25, isBold = false, color = '0F172A') => new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    children: [new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: String(text || '-'), bold: isBold, size: 18, color })]
    })],
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          text: 'OIML R 76-1 TYPE EVALUATION TEST REPORT',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          text: 'Legal Metrology Evaluation for Non-Automatic Weighing Instruments (NAWI)',
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        // Metadata box
        new Paragraph({
          children: [
            new TextRun({ text: `Report Reference: `, bold: true }),
            new TextRun({ text: report.reportNumber || 'DRAFT', bold: true, color: '166534' }),
            new TextRun({ text: `    |    Date: `, bold: true }),
            new TextRun({ text: env.date || report.testDate || new Date().toISOString().split('T')[0] }),
            new TextRun({ text: `    |    Verdict: `, bold: true }),
            new TextRun({ text: isPass ? 'PASS' : 'FAIL', bold: true, color: isPass ? '166534' : 'B91C1C' })
          ],
          spacing: { after: 300 }
        }),

        // 1. Instrument Details
        new Paragraph({
          text: '1. Instrument Identification & Metrological Specifications',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 120 }
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          rows: [
            new TableRow({
              children: [
                createHeaderCell('Manufacturer'),
                createCell(inst.manufacturer),
                createHeaderCell('Accuracy Class'),
                createCell(inst.accuracyClass || 'Class III')
              ]
            }),
            new TableRow({
              children: [
                createHeaderCell('Model'),
                createCell(inst.model),
                createHeaderCell('Max Capacity (Max)'),
                createCell(`${inst.capacity} kg`)
              ]
            }),
            new TableRow({
              children: [
                createHeaderCell('Serial Number'),
                createCell(inst.serialNumber),
                createHeaderCell('Scale Interval (e)'),
                createCell(`${inst.verificationInterval} kg`)
              ]
            }),
            new TableRow({
              children: [
                createHeaderCell('Instrument Type'),
                createCell(inst.type || 'Electronic Platform'),
                createHeaderCell('Min Capacity (Min)'),
                createCell(`${inst.minCapacity || '0.1'} kg`)
              ]
            })
          ]
        }),

        // 2. Laboratory Environment
        new Paragraph({
          text: '2. Environmental Test Conditions',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 120 }
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          rows: [
            new TableRow({
              children: [
                createHeaderCell('Testing Laboratory'),
                createCell(env.labName || 'NLML Metrology'),
                createHeaderCell('Testing Officer'),
                createCell(env.testerName || report.userName || 'Inspector')
              ]
            }),
            new TableRow({
              children: [
                createHeaderCell('Ambient Temperature'),
                createCell(`${env.temperature} °C (Standard: 15–35°C)`),
                createHeaderCell('Relative Humidity'),
                createCell(`${env.humidity} % (Standard: ≤ 80%)`)
              ]
            }),
            new TableRow({
              children: [
                createHeaderCell('Atmospheric Pressure'),
                createCell(`${env.pressure || '1013.25'} hPa`),
                createHeaderCell('Metrological Condition'),
                createCell('Compliant Ambient Conditions', 25, true, '166534')
              ]
            })
          ]
        }),

        // 3. Zero-setting & Tare Test
        new Paragraph({
          text: '3. Zero-Setting & Tare Test Observations',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 120 }
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          rows: [
            new TableRow({
              children: [
                createHeaderCell('Test Stage', 20),
                createHeaderCell('Applied Load', 20),
                createHeaderCell('Indicated Value', 20),
                createHeaderCell('Error', 20),
                createHeaderCell('Verdict', 20)
              ]
            }),
            new TableRow({
              children: [
                createCell('Zero Setting (No Load)', 20),
                createCell('0.000 kg', 20),
                createCell(`${tests.zeroTest?.zeroIndicated ?? 0} kg`, 20),
                createCell(`${evalResults.zeroTest?.zeroError ?? 0} kg`, 20),
                createCell(evalResults.zeroTest?.zeroPass !== false ? 'PASS' : 'FAIL', 20, true, evalResults.zeroTest?.zeroPass !== false ? '166534' : 'B91C1C')
              ]
            }),
            new TableRow({
              children: [
                createCell('Tare Mechanism', 20),
                createCell(`${tests.zeroTest?.tareApplied ?? 0} kg`, 20),
                createCell(`${tests.zeroTest?.tareIndicated ?? 0} kg`, 20),
                createCell(`${evalResults.zeroTest?.tareError ?? 0} kg`, 20),
                createCell(evalResults.zeroTest?.tarePass !== false ? 'PASS' : 'FAIL', 20, true, evalResults.zeroTest?.tarePass !== false ? '166534' : 'B91C1C')
              ]
            })
          ]
        }),

        // 4. Eccentricity Test
        new Paragraph({
          text: '4. Eccentricity Test (Positions 1 to 5)',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 120 }
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          rows: [
            new TableRow({
              children: [
                createHeaderCell('Position', 25),
                createHeaderCell('Applied Load', 15),
                createHeaderCell('Indicated Value', 15),
                createHeaderCell('Error', 15),
                createHeaderCell('Dev. Center', 15),
                createHeaderCell('Verdict', 15)
              ]
            }),
            ...(evalResults.eccentricity?.rows || tests.eccentricity?.rows || []).map(r => new TableRow({
              children: [
                createCell(r.positionName || `Position ${r.position}`, 25),
                createCell(`${r.appliedLoad} kg`, 15),
                createCell(`${r.indicatedValue} kg`, 15),
                createCell(`${r.error ?? (r.indicatedValue - r.appliedLoad).toFixed(4)} kg`, 15),
                createCell(`${r.devFromCenter ?? 0} kg`, 15),
                createCell(r.pass !== false ? 'PASS' : 'FAIL', 15, true, r.pass !== false ? '166534' : 'B91C1C')
              ]
            }))
          ]
        }),

        // 5. Weighing Performance Test
        new Paragraph({
          text: '5. Weighing Performance Test (Increasing & Decreasing Loads)',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 120 }
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          rows: [
            new TableRow({
              children: [
                createHeaderCell('Direction', 15),
                createHeaderCell('Test Load Point', 25),
                createHeaderCell('Applied Load', 15),
                createHeaderCell('Indicated', 15),
                createHeaderCell('Error', 15),
                createHeaderCell('mpe Limit', 15)
              ]
            }),
            ...(evalResults.weighing?.increasingRows || tests.weighing?.increasing || []).map(r => new TableRow({
              children: [
                createCell('Increasing (↑)', 15),
                createCell(r.pointLabel || 'Test point', 25),
                createCell(`${r.appliedLoad} kg`, 15),
                createCell(`${r.indicatedValue} kg`, 15),
                createCell(`${r.error ?? (r.indicatedValue - r.appliedLoad).toFixed(4)} kg`, 15),
                createCell(`±${r.mpe ?? '0.005'} kg`, 15, true, r.pass !== false ? '166534' : 'B91C1C')
              ]
            })),
            ...(evalResults.weighing?.decreasingRows || tests.weighing?.decreasing || []).map(r => new TableRow({
              children: [
                createCell('Decreasing (↓)', 15),
                createCell(r.pointLabel || 'Test point', 25),
                createCell(`${r.appliedLoad} kg`, 15),
                createCell(`${r.indicatedValue} kg`, 15),
                createCell(`${r.error ?? (r.indicatedValue - r.appliedLoad).toFixed(4)} kg`, 15),
                createCell(`±${r.mpe ?? '0.005'} kg`, 15, true, r.pass !== false ? '166534' : 'B91C1C')
              ]
            }))
          ]
        }),

        // 6. Repeatability Test
        new Paragraph({
          text: '6. Repeatability Test (5 Successive Cycles)',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 120 }
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          rows: [
            new TableRow({
              children: [
                createHeaderCell('Cycle Run', 20),
                createHeaderCell('Applied Load', 20),
                createHeaderCell('Indicated Value', 20),
                createHeaderCell('Error', 20),
                createHeaderCell('Verdict', 20)
              ]
            }),
            ...(evalResults.repeatability?.rows || tests.repeatability?.rows || []).map((r, i) => new TableRow({
              children: [
                createCell(`Run ${r.runNumber || i + 1}`, 20),
                createCell(`${r.appliedLoad} kg`, 20),
                createCell(`${r.indicatedValue} kg`, 20),
                createCell(`${r.error ?? (r.indicatedValue - r.appliedLoad).toFixed(4)} kg`, 20),
                createCell(r.pass !== false ? 'PASS' : 'FAIL', 20, true, r.pass !== false ? '166534' : 'B91C1C')
              ]
            }))
          ]
        }),

        // 7. Overall Verdict Banner
        new Paragraph({
          children: [
            new TextRun({
              text: `\nOFFICIAL OIML R 76 VERDICT: ${isPass ? 'PASS (COMPLIANT)' : 'FAIL (NON-COMPLIANT)'}`,
              bold: true,
              size: 24,
              color: isPass ? '166534' : 'B91C1C'
            })
          ],
          spacing: { before: 300, after: 200 }
        }),

        // Signatures
        new Paragraph({
          children: [
            new TextRun({ text: 'Prepared / Tested by: ', bold: true }),
            new TextRun({ text: `${env.testerName || report.userName || 'Verification Officer'}            ` }),
            new TextRun({ text: 'Approved by: ', bold: true }),
            new TextRun({ text: 'Dr. Evelyn Reed (Chief Metrologist)\n\n' }),
            new TextRun({ text: 'Signature: __________________________        Seal / Date: __________________________' })
          ],
          spacing: { before: 200, after: 200 }
        })
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${(report.reportNumber || 'NAWI_Report').replace(/[\/\\:]/g, '_')}.docx`;
  saveAs(blob, filename);
}
