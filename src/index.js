const path = require('path');
const { readData, DATA_FILE_PATH } = require('./storage');

/**
 * Main application entry point for Panorama (Phase 1 - JSON Storage).
 */
async function main() {
  console.log('====================================================');
  console.log('   PANORAMA - Annual Report Portal (Phase 1)');
  console.log('   Terminal-based Academic Reporting System');
  console.log('   Storage Engine: JSON File Storage (fs)');
  console.log('====================================================\n');

  try {
    console.log('Checking JSON storage...');
    const data = await readData();

    const relativePath = path.relative(process.cwd(), DATA_FILE_PATH);
    console.log(`✓ Storage file loaded: ./${relativePath}\n`);

    console.log('Verified Foundation Collections (5/5 detected):');
    console.log(`  ✓ departments      [${data.departments.length} record(s)]`);
    console.log(`  ✓ academicYears    [${data.academicYears.length} record(s)]`);
    console.log(`  ✓ users            [${data.users.length} record(s)]`);
    console.log(`  ✓ reports          [${data.reports.length} record(s)]`);
    console.log(`  ✓ reportSections   [${data.reportSections.length} record(s)]`);

    console.log('\nSample Seed Inspection:');
    console.log(`  • Admin Account   : ${data.users.find(u => u.role === 'ADMIN')?.username || 'None'}`);
    console.log(`  • Departments     : ${data.departments.map(d => d.code).join(', ')}`);
    console.log(`  • Academic Years  : ${data.academicYears.map(y => y.yearLabel).join(', ')}`);

    console.log('\n----------------------------------------------------');
    console.log(' Phase 1 Foundation is Ready! (JSON Storage)');
    console.log(' Next: Phase 2 will implement Authentication & CLI Menus.');
    console.log('----------------------------------------------------\n');
  } catch (err) {
    console.error('\n❌ Failed to load JSON storage:');
    console.error(`   Error: ${err.message}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
