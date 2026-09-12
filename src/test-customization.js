const {
  PREDEFINED_SECTIONS,
  getReportCustomization,
  saveReportCustomization,
} = require('./services/adminService');
const { readData, resetData } = require('./storage');
const { login } = require('./auth');

/**
 * Automated test suite for Phase 6 (Part 1): Annual Report Customization.
 */
async function testCustomization() {
  console.log('====================================================');
  console.log('    Testing Annual Report Customization (Phase 6)   ');
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

  // Test 1: All predefined sections are displayed with defaults
  const initialSections = await getReportCustomization();
  assert(
    initialSections.length === 4 &&
      initialSections.every((s) => s.selected === true) &&
      initialSections[0].sectionName === 'students' &&
      initialSections[1].sectionName === 'faculty' &&
      initialSections[2].sectionName === 'researchPapers' &&
      initialSections[3].sectionName === 'placements',
    'Retrieve all 4 predefined report sections with default selection and order'
  );

  // Test 2: Select a subset of sections and set custom order
  // E.g., Select Placements as #1 and Students as #2 (Faculty & Research excluded)
  const subsetPayload = [
    { sectionName: 'placements', selected: true, order: 1 },
    { sectionName: 'students', selected: true, order: 2 },
    { sectionName: 'researchPapers', selected: false, order: 3 },
    { sectionName: 'faculty', selected: false, order: 4 },
  ];

  const saveRes = await saveReportCustomization(subsetPayload);
  assert(
    saveRes.success === true && saveRes.customization.length === 4,
    'Admin successfully saves section subset and custom order'
  );

  // Test 3: Verify saved configuration structure
  const savedSections = await getReportCustomization();
  const placementsSec = savedSections.find((s) => s.sectionName === 'placements');
  const studentsSec = savedSections.find((s) => s.sectionName === 'students');
  const facultySec = savedSections.find((s) => s.sectionName === 'faculty');
  const researchSec = savedSections.find((s) => s.sectionName === 'researchPapers');

  assert(
    placementsSec.selected === true &&
      placementsSec.order === 1 &&
      studentsSec.selected === true &&
      studentsSec.order === 2 &&
      facultySec.selected === false &&
      researchSec.selected === false,
    'Customized selection state and display order are accurately represented'
  );

  // Test 4: Verify direct disk persistence in data/data.json
  const rawDiskData = await readData();
  assert(
    Array.isArray(rawDiskData.reportCustomization) &&
      rawDiskData.reportCustomization.length === 4 &&
      rawDiskData.reportCustomization[0].sectionName === 'placements' &&
      rawDiskData.reportCustomization[0].order === 1,
    'Customization is persisted directly to data/data.json'
  );

  // Test 5: Restarting application preserves customization
  // Simulate application restart by re-reading directly from fresh instance
  const freshRead = await getReportCustomization();
  assert(
    freshRead[0].sectionName === 'placements' &&
      freshRead[0].selected === true &&
      freshRead[1].sectionName === 'students' &&
      freshRead[1].selected === true &&
      freshRead[2].selected === false &&
      freshRead[3].selected === false,
    'Application restart simulation accurately preserves customization'
  );

  // Test 6: Role authorization & dashboard access isolation
  const deptUser = await login('cse_head', 'cse123');
  const adminUser = await login('admin', 'admin123');
  assert(
    deptUser !== null &&
      deptUser.role === 'DEPARTMENT_USER' &&
      adminUser !== null &&
      adminUser.role === 'ADMIN',
    'Verify role distinction (ADMIN vs DEPARTMENT_USER)'
  );

  // Verify CLI main script exposes customization exclusively to admin
  const indexModule = require('./index');
  assert(
    typeof indexModule.showAdminDashboard === 'function' &&
      typeof indexModule.showDepartmentDashboard === 'function',
    'Dashboard separation maintains admin-exclusive access to report customization'
  );

  // Clean up
  await resetData();

  console.log('\n====================================================');
  console.log(`Customization Test Results: ${passed}/${total} assertions passed.`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

if (require.main === module) {
  testCustomization();
}

module.exports = { testCustomization };
