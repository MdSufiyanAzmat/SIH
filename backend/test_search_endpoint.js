import 'dotenv/config';

const port = process.env.PORT || 8000;
const baseUrl = process.env.TEST_API_URL || `http://localhost:${port}`;

async function runSearchTests() {
  console.log('='.repeat(80));
  console.log(' TESTING SEARCH ENDPOINT: GET /api/reports?q=&status=&from=&to=&page=&limit=');
  console.log('='.repeat(80));

  // 1. Case-insensitive search by manufacturer (lowercase "mettler")
  console.log('\n--- 1. Search by Manufacturer (case-insensitive: "mettler") ---');
  let res = await fetch(`${baseUrl}/api/reports?q=mettler`);
  let data = await res.json();
  console.log(`Matched: ${data.reports.length} reports | Total: ${data.pagination?.total}`);
  console.log(`Sample Report: ${data.reports[0]?.reportNumber} | Manufacturer: ${data.reports[0]?.manufacturer}`);
  if (data.reports.length > 0 && data.reports[0].manufacturer.toLowerCase().includes('mettler')) {
    console.log('[PASS] Manufacturer search (case-insensitive) succeeded.');
  } else {
    throw new Error('Manufacturer search failed');
  }

  // 2. Case-insensitive search by model (mixed case "Bc-U215")
  console.log('\n--- 2. Search by Model (case-insensitive: "bC-u215") ---');
  res = await fetch(`${baseUrl}/api/reports?q=bC-u215`);
  data = await res.json();
  console.log(`Matched: ${data.reports.length} reports | Model: ${data.reports[0]?.model}`);
  if (data.reports.length > 0 && data.reports[0].model.toLowerCase().includes('bc-u215')) {
    console.log('[PASS] Model search (case-insensitive) succeeded.');
  } else {
    throw new Error('Model search failed');
  }

  // 3. Case-insensitive search by serialNo (lowercase "mt-2026")
  console.log('\n--- 3. Search by Serial Number (case-insensitive: "mt-2026") ---');
  res = await fetch(`${baseUrl}/api/reports?q=mt-2026`);
  data = await res.json();
  console.log(`Matched: ${data.reports.length} reports | Serial: ${data.reports[0]?.serialNumber}`);
  if (data.reports.length > 0 && data.reports[0].serialNumber.toLowerCase().includes('mt-2026')) {
    console.log('[PASS] Serial Number search succeeded.');
  } else {
    throw new Error('Serial search failed');
  }

  // 4. Case-insensitive search by reportNo (lowercase "lab/r76/2026")
  console.log('\n--- 4. Search by Report Number (case-insensitive: "lab/r76/2026") ---');
  res = await fetch(`${baseUrl}/api/reports?q=lab/r76/2026`);
  data = await res.json();
  console.log(`Matched: ${data.reports.length} reports | ReportNo: ${data.reports[0]?.reportNumber}`);
  if (data.reports.length > 0 && data.reports[0].reportNumber.toLowerCase().includes('lab/r76/2026')) {
    console.log('[PASS] Report Number search succeeded.');
  } else {
    throw new Error('Report number search failed');
  }

  // 4B. Specific query parameters test: ?manufacturer=&model=&serialNo=&reportNo=
  console.log('\n--- 4B. Search by specific query params (?manufacturer=&model=&serialNo=&reportNo=) ---');
  res = await fetch(`${baseUrl}/api/reports?manufacturer=mettler&model=precision&serialNo=mt-2026&reportNo=0001`);
  data = await res.json();
  console.log(`Matched specific params: ${data.reports.length} reports`);
  if (data.reports.length === 1 && data.reports[0].manufacturer.toLowerCase().includes('mettler')) {
    console.log('[PASS] Specific query params filtering (?manufacturer=&model=&serialNo=&reportNo=) succeeded.');
  } else {
    throw new Error('Specific query params search failed');
  }

  // 5. Filter by Status ("Completed")
  console.log('\n--- 5. Filter by Status ("Completed") ---');
  res = await fetch(`${baseUrl}/api/reports?status=Completed`);
  data = await res.json();
  console.log(`Completed reports: ${data.reports.length}`);
  const allCompleted = data.reports.every(r => r.status.toLowerCase() === 'completed');
  if (data.reports.length > 0 && allCompleted) {
    console.log('[PASS] Status filter succeeded.');
  } else {
    throw new Error('Status filter failed');
  }

  // 6. Filter by Date Range (from / to)
  console.log('\n--- 6. Filter by Date Range (from=2026-01-01&to=2026-12-31) ---');
  res = await fetch(`${baseUrl}/api/reports?from=2026-01-01&to=2026-12-31`);
  data = await res.json();
  console.log(`Matched date range: ${data.reports.length}`);
  if (data.reports.length > 0) {
    console.log('[PASS] Date range filter succeeded.');
  } else {
    throw new Error('Date range filter failed');
  }

  // 7. Verify Pagination Metadata (limit = 20 by default)
  console.log('\n--- 7. Verify Pagination Metadata (default 20/page) ---');
  res = await fetch(`${baseUrl}/api/reports`);
  data = await res.json();
  console.log('Pagination Object:', data.pagination);
  if (
    data.pagination &&
    data.pagination.limit === 20 &&
    typeof data.pagination.total === 'number' &&
    typeof data.pagination.page === 'number' &&
    typeof data.pagination.totalPages === 'number' &&
    typeof data.pagination.hasNextPage === 'boolean' &&
    typeof data.pagination.hasPrevPage === 'boolean'
  ) {
    console.log('[PASS] Pagination structure (20/page) is properly returned.');
  } else {
    throw new Error('Pagination structure invalid');
  }

  // Login to get valid admin token
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@metrology.lab', password: 'admin123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  // 8. Test 25 Dummy Reports to Validate 20/Page Pagination
  console.log('\n--- 8. Creating 24 Additional Reports to Test 20/Page Limit & Page Navigation ---');
  const createdIds = [];
  for (let i = 1; i <= 24; i++) {
    const r = await fetch(`${baseUrl}/api/reports`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        status: i % 2 === 0 ? 'Completed' : 'Draft',
        instrument: {
          manufacturer: i % 3 === 0 ? 'Ohaus' : 'Avery Weigh-Tronix',
          model: `Scale-X${i}`,
          serialNumber: `SN-PAGINATE-${1000 + i}`,
          capacity: 15,
          verificationInterval: 0.005,
          accuracyClass: 'Class III'
        },
        environment: {
          labName: 'NLML Metrology Test Lab',
          date: '2026-09-28',
          testerName: 'Alex Vance',
          temperature: 22.0,
          humidity: 50.0
        },
        tests: {}
      })
    });
    const created = await r.json();
    if (!created.id) {
      throw new Error(`Failed to create test report #${i}: ${JSON.stringify(created)}`);
    }
    createdIds.push(created.id);
  }

  // Fetch Page 1 (limit 20)
  console.log('\n--- 8A. Fetching Page 1 (limit: 20) ---');
  const p1Res = await fetch(`${baseUrl}/api/reports?page=1&limit=20`);
  const p1Data = await p1Res.json();
  console.log(`Page 1 Results: ${p1Data.reports.length} items (expected: 20)`);
  console.log(`Total count: ${p1Data.pagination.total} (expected: 25)`);
  console.log(`Total Pages: ${p1Data.pagination.totalPages} (expected: 2)`);
  console.log(`hasNextPage: ${p1Data.pagination.hasNextPage} (expected: true)`);
  console.log(`hasPrevPage: ${p1Data.pagination.hasPrevPage} (expected: false)`);

  if (p1Data.reports.length === 20 && p1Data.pagination.hasNextPage === true) {
    console.log('[PASS] Page 1 returned exactly 20 records with hasNextPage=true.');
  } else {
    throw new Error('Page 1 count mismatch');
  }

  // Fetch Page 2 (limit 20)
  console.log('\n--- 8B. Fetching Page 2 (limit: 20) ---');
  const p2Res = await fetch(`${baseUrl}/api/reports?page=2&limit=20`);
  const p2Data = await p2Res.json();
  console.log(`Page 2 Results: ${p2Data.reports.length} items (expected: 5)`);
  console.log(`hasNextPage: ${p2Data.pagination.hasNextPage} (expected: false)`);
  console.log(`hasPrevPage: ${p2Data.pagination.hasPrevPage} (expected: true)`);

  if (p2Data.reports.length === 5 && p2Data.pagination.hasPrevPage === true && p2Data.pagination.hasNextPage === false) {
    console.log('[PASS] Page 2 returned remaining 5 records with hasPrevPage=true.');
  } else {
    throw new Error('Page 2 count mismatch');
  }

  // Clean up test reports
  console.log('\n--- 9. Cleaning up test batch reports ---');
  for (const id of createdIds) {
    await fetch(`${baseUrl}/api/reports/${id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
  }
  console.log(`[PASS] Cleaned up ${createdIds.length} test records.`);

  console.log('\n' + '='.repeat(80));
  console.log(' ALL SEARCH & PAGINATION TESTS PASSED (20/PAGE VERIFIED)! ');
  console.log('='.repeat(80) + '\n');
}

runSearchTests().catch((err) => {
  console.error('\n[ERROR]', err);
  process.exit(1);
});
