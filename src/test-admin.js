const {
  getAllDepartmentReports,
  reviewReport,
  getInstituteAnalytics,
} = require('./services/adminService');
const { resetData } = require('./storage');

/**
 * Automated test suite for Admin Review & Institute Analytics.
 */
async function testAdmin() {
  console.log('====================================================');
  console.log('       Testing Admin Review & Analytics Engine      ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
    }
  }

  // Ensure clean test baseline
  await resetData();

  // Test 1: Retrieve all department reports
  const allReports = await getAllDepartmentReports(1);
  assert(allReports.length >= 1 && allReports[0].department !== null, 'Fetch joined department reports');

  // Test 2: Review report approval
  const approveRes = await reviewReport(1, 'APPROVED', 'Approved by Academic Council.');
  assert(approveRes.success === true && approveRes.report.status === 'APPROVED', 'Admin approves submitted report with feedback');

  // Test 3: Reject invalid status
  const invalidStatusRes = await reviewReport(1, 'INVALID_STATUS');
  assert(invalidStatusRes.success === false, 'Reject non-supported review status');

  // Test 4: Compute Institute Analytics
  const analytics = await getInstituteAnalytics(1);
  assert(
    analytics.students.totalEnrolled === 480 &&
      analytics.faculty.totalFaculty === 28 &&
      analytics.research.totalPublications === 37 &&
      analytics.placements.placementPercentage > 90,
    'Accurately calculate aggregated institute statistics from sections'
  );

  // Clean up
  await resetData();

  console.log('\n====================================================');
  console.log(`Admin Test Results: ${passed}/${total} assertions passed.`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

if (require.main === module) {
  testAdmin();
}

module.exports = { testAdmin };
