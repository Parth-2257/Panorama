const {
  getAllDepartmentReports,
  reviewReport,
  getInstituteAnalytics,
} = require('./services/adminService');
const {
  createOrGetDraftReport,
  saveReportSection,
} = require('./services/reportService');
const { readData, writeData, resetData } = require('./storage');

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

  // Test 1: Zero approved reports (initial state has 1 DRAFT report)
  const zeroAnalytics = await getInstituteAnalytics(1);
  assert(
    zeroAnalytics.approvedReports === 0 &&
      zeroAnalytics.students.totalEnrolled === 0 &&
      zeroAnalytics.faculty.totalFaculty === 0 &&
      zeroAnalytics.research.totalPublications === 0 &&
      zeroAnalytics.placements.totalPlaced === 0 &&
      zeroAnalytics.placements.placementPercentage === 0 &&
      zeroAnalytics.placements.avgPackageLpa === 0,
    'Cleanly handle zero approved reports without crashing or producing incorrect totals'
  );

  // Test 2: Retrieve all department reports
  const allReports = await getAllDepartmentReports(1);
  assert(allReports.length >= 1 && allReports[0].department !== null, 'Fetch joined department reports');

  // Test 3: Review report approval
  const approveRes = await reviewReport(1, 'APPROVED', 'Approved by Academic Council.');
  assert(approveRes.success === true && approveRes.report.status === 'APPROVED', 'Admin approves submitted report with feedback');

  // Test 4: Reject invalid status
  const invalidStatusRes = await reviewReport(1, 'INVALID_STATUS');
  assert(invalidStatusRes.success === false, 'Reject non-supported review status');

  // Test 5: Compute Institute Analytics with 1 approved report
  const analyticsSingle = await getInstituteAnalytics(1);
  assert(
    analyticsSingle.approvedReports === 1 &&
      analyticsSingle.students.totalEnrolled === 480 &&
      analyticsSingle.faculty.totalFaculty === 28 &&
      analyticsSingle.research.totalPublications === 37 &&
      analyticsSingle.placements.placementPercentage > 90,
    'Accurately calculate aggregated institute statistics from single approved report'
  );

  // Test 6: Mixed scenario with 1 APPROVED and 1 DRAFT report (IT Department)
  const itDraft = await createOrGetDraftReport(2, 1, 3);
  await saveReportSection(itDraft.id, 'students', { totalEnrolled: 320, intake: 100, passPercentage: 92 });
  await saveReportSection(itDraft.id, 'faculty', { totalFaculty: 20, phdHolders: 10, studentFacultyRatio: '16:1' });
  await saveReportSection(itDraft.id, 'researchPapers', { journalPublications: 8, conferencePapers: 12, scopusIndexed: 6 });
  await saveReportSection(itDraft.id, 'placements', { eligibleStudents: 90, placedStudents: 85, highestPackageLpa: 26, avgPackageLpa: 8.5 });

  const mixedAnalytics = await getInstituteAnalytics(1);
  assert(
    mixedAnalytics.approvedReports === 1 &&
      mixedAnalytics.draftReports === 1 &&
      mixedAnalytics.students.totalEnrolled === 480 &&
      mixedAnalytics.faculty.totalFaculty === 28 &&
      mixedAnalytics.research.totalPublications === 37 &&
      mixedAnalytics.placements.totalPlaced === 108,
    'Mixed scenario: Only the APPROVED report contributes to totals; DRAFT report metrics are excluded'
  );

  // Test 7: Non-approved REJECTED report does not contribute
  await reviewReport(itDraft.id, 'REJECTED', 'Need revision on placements section.');
  const afterRejectAnalytics = await getInstituteAnalytics(1);
  assert(
    afterRejectAnalytics.approvedReports === 1 &&
      afterRejectAnalytics.students.totalEnrolled === 480 &&
      afterRejectAnalytics.faculty.totalFaculty === 28,
    'Non-approved REJECTED report does not contribute to totals'
  );

  // Test 8: Duplicate report prevention (duplicate department report is not double counted)
  const currentData = await readData();
  currentData.reports.push({
    id: 99,
    departmentId: 1, // Duplicate CSE department report
    academicYearId: 1,
    status: 'APPROVED',
    feedback: null,
    submittedAt: new Date().toISOString(),
    createdBy: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  currentData.reportSections.push({
    id: 999,
    reportId: 99,
    sectionName: 'students',
    sectionData: { totalEnrolled: 999, intake: 99, passPercentage: 99 },
    updatedAt: new Date().toISOString(),
  });
  await writeData(currentData);

  const dedupeAnalytics = await getInstituteAnalytics(1);
  assert(
    dedupeAnalytics.approvedReports === 1 &&
      dedupeAnalytics.students.totalEnrolled === 480,
    'Deduplicate: Duplicate approved reports for same department are not double-counted'
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
