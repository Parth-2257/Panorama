const {
  getActiveAcademicYear,
  getReportForDepartment,
  createOrGetDraftReport,
  getReportSections,
  saveReportSection,
  submitReport,
} = require('./services/reportService');
const { resetData } = require('./storage');

/**
 * Automated test suite for Department Report Service.
 */
async function testReports() {
  console.log('====================================================');
  console.log('     Testing Department Report Service (Phase 3)    ');
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

  // Test 1: Get Active Academic Year
  const activeYear = await getActiveAcademicYear();
  assert(activeYear !== null && activeYear.isActive === true, 'Retrieve active academic year');

  // Test 2: Retrieve existing seed report
  const cseReport = await getReportForDepartment(1, 1);
  assert(cseReport !== null && cseReport.status === 'DRAFT', 'Retrieve existing department draft report');

  // Test 3: Retrieve sections of seed report
  const sections = await getReportSections(cseReport.id);
  assert(sections.length === 4, `Retrieve modular sections for report (found ${sections.length}/4)`);

  // Test 4: Create new draft report for IT Department (Dept ID 2, Year 1)
  const itDraft = await createOrGetDraftReport(2, 1, 3);
  assert(itDraft !== null && itDraft.departmentId === 2, 'Create new draft report for department');

  // Test 5: Validation blocks submission when sections are missing
  const failSubmit = await submitReport(itDraft.id);
  assert(failSubmit.success === false && failSubmit.message.includes('Missing required sections'), 'Prevent submission with missing sections');

  // Test 6: Populate sections for IT report
  await saveReportSection(itDraft.id, 'students', { totalEnrolled: 360, intake: 90, passPercentage: 98 });
  await saveReportSection(itDraft.id, 'faculty', { totalFaculty: 22, phdHolders: 14, studentFacultyRatio: '16:1' });
  await saveReportSection(itDraft.id, 'researchPapers', { journalPublications: 10, conferencePapers: 12, scopusIndexed: 8 });
  await saveReportSection(itDraft.id, 'placements', { eligibleStudents: 85, placedStudents: 82, highestPackageLpa: 28, avgPackageLpa: 8.5 });

  // Test 7: Successful submission once all sections exist
  const successSubmit = await submitReport(itDraft.id);
  assert(successSubmit.success === true && successSubmit.report.status === 'SUBMITTED', 'Successfully submit report after populating all 4 sections');

  // Clean up
  await resetData();

  console.log('\n====================================================');
  console.log(`Report Test Results: ${passed}/${total} assertions passed.`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

if (require.main === module) {
  testReports();
}

module.exports = { testReports };
