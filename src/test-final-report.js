const fs = require('fs').promises;
const path = require('path');
const {
  reviewReport,
  getReportCustomization,
  saveReportCustomization,
  generateFinalAnnualReport,
  REPORTS_DIR,
} = require('./services/adminService');
const { createOrGetDraftReport, saveReportSection } = require('./services/reportService');
const { resetData } = require('./storage');

/**
 * Automated test suite for Final Annual Report Generation.
 */
async function testFinalReport() {
  console.log('====================================================');
  console.log('      Testing Final Report Generation (Phase 6)     ');
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

  // Test 1: Generate report for academic year with zero approved reports
  const zeroRes = await generateFinalAnnualReport(1);
  assert(
    zeroRes.success === false &&
      zeroRes.message.includes('No approved reports are available for this academic year'),
    'Block report generation when zero approved reports exist'
  );

  // Test 2: Generate report with approved reports
  await reviewReport(1, 'APPROVED', 'Approved for Annual Report publication.');
  const genRes = await generateFinalAnnualReport(1);
  assert(
    genRes.success === true &&
      genRes.fileName === 'annual-report-2023-2024.txt' &&
      typeof genRes.filePath === 'string',
    'Successfully generate annual report when approved reports exist'
  );

  // Test 3: Confirm .txt file is created inside reports/ directory
  const reportPath = path.join(REPORTS_DIR, 'annual-report-2023-2024.txt');
  let fileExists = false;
  try {
    await fs.access(reportPath);
    fileExists = true;
  } catch {
    fileExists = false;
  }
  assert(fileExists === true, 'Report .txt file exists inside reports/ directory');

  // Test 4: Verify generated file contents directly from disk
  const diskContent = await fs.readFile(reportPath, 'utf8');
  assert(
    diskContent.includes('INSTITUTE ANNUAL REPORT') &&
      diskContent.includes('ACADEMIC YEAR: 2023-2024') &&
      diskContent.includes('Total Enrolled Students : 480') &&
      diskContent.includes('END OF REPORT'),
    'Inspect file contents: correct headings, metadata, numbers, and end marker'
  );

  // Test 5: Confirm non-approved reports (DRAFT / REJECTED) do not affect totals
  const itDraft = await createOrGetDraftReport(2, 1, 3);
  await saveReportSection(itDraft.id, 'students', { totalEnrolled: 500, intake: 100, passPercentage: 95 });
  await saveReportSection(itDraft.id, 'faculty', { totalFaculty: 30, phdHolders: 15, studentFacultyRatio: '15:1' });

  // Regenerate and inspect
  await generateFinalAnnualReport(1);
  const contentWithDraft = await fs.readFile(reportPath, 'utf8');
  assert(
    contentWithDraft.includes('Total Enrolled Students : 480') &&
      !contentWithDraft.includes('980') &&
      contentWithDraft.includes('Total Faculty           : 28') &&
      !contentWithDraft.includes('58'),
    'Only approved reports contribute to final report; draft/unapproved numbers excluded'
  );

  // Test 6: Subset section selection (only Placements and Students)
  await saveReportCustomization([
    { sectionName: 'placements', selected: true, order: 1 },
    { sectionName: 'students', selected: true, order: 2 },
    { sectionName: 'faculty', selected: false, order: 3 },
    { sectionName: 'researchPapers', selected: false, order: 4 },
  ]);

  await generateFinalAnnualReport(1);
  const subsetContent = await fs.readFile(reportPath, 'utf8');
  assert(
    subsetContent.includes('PLACEMENTS') &&
      subsetContent.includes('STUDENTS') &&
      !subsetContent.includes('FACULTY') &&
      !subsetContent.includes('RESEARCH PAPERS'),
    'Generated report contains only sections selected by the admin'
  );

  // Test 7: Confirm section display order matches admin configuration
  const placementsIdx = subsetContent.indexOf('1. PLACEMENTS');
  const studentsIdx = subsetContent.indexOf('2. STUDENTS');
  assert(
    placementsIdx !== -1 && studentsIdx !== -1 && placementsIdx < studentsIdx,
    'Sections appear in exact order configured by admin (Placements #1, Students #2)'
  );

  // Test 8: Re-ordering updates file correctly upon regeneration
  await saveReportCustomization([
    { sectionName: 'students', selected: true, order: 1 },
    { sectionName: 'placements', selected: true, order: 2 },
    { sectionName: 'faculty', selected: false, order: 3 },
    { sectionName: 'researchPapers', selected: false, order: 4 },
  ]);

  await generateFinalAnnualReport(1);
  const reorderedContent = await fs.readFile(reportPath, 'utf8');
  const studentsIdx2 = reorderedContent.indexOf('1. STUDENTS');
  const placementsIdx2 = reorderedContent.indexOf('2. PLACEMENTS');
  assert(
    studentsIdx2 !== -1 && placementsIdx2 !== -1 && studentsIdx2 < placementsIdx2,
    'Re-ordered customization overwrites and updates .txt file correctly (Students #1, Placements #2)'
  );

  // Test 9: Case where no sections are selected
  await saveReportCustomization([
    { sectionName: 'students', selected: false, order: 1 },
    { sectionName: 'faculty', selected: false, order: 2 },
    { sectionName: 'researchPapers', selected: false, order: 3 },
    { sectionName: 'placements', selected: false, order: 4 },
  ]);

  const noSecRes = await generateFinalAnnualReport(1);
  assert(
    noSecRes.success === false &&
      noSecRes.message.includes('No report sections are currently selected'),
    'Block report generation when no sections are selected'
  );

  // Clean up test baseline
  await resetData();

  // Clean up generated test report file
  try {
    await fs.unlink(reportPath);
  } catch {}

  console.log('\n====================================================');
  console.log(`Final Report Test Results: ${passed}/${total} assertions passed.`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

if (require.main === module) {
  testFinalReport();
}

module.exports = { testFinalReport };
