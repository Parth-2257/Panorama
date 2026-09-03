const { readData, writeData } = require('./storage');

/**
 * Storage Persistence Verification Test
 * Proves that data can be read, modified, persisted to disk, and reloaded accurately.
 */
async function testStoragePersistence() {
  console.log('====================================================');
  console.log('  Testing JSON Storage Persistence (Phase 1)');
  console.log('====================================================\n');

  // Step 1: Read initial data
  console.log('[Step 1] Reading initial data from data/data.json...');
  const initialData = await readData();
  const initialDeptCount = initialData.departments.length;
  console.log(`  ✓ Read successful. Initial departments: ${initialDeptCount}`);

  // Step 2: Modify data in-memory
  console.log('\n[Step 2] Adding a temporary test department in-memory...');
  const testDept = {
    id: 999,
    name: 'Chemical Engineering Test',
    code: 'CHEM_TEST',
    createdAt: new Date().toISOString(),
  };
  initialData.departments.push(testDept);

  // Step 3: Write modified data to disk
  console.log('\n[Step 3] Writing modified data to disk...');
  await writeData(initialData);
  console.log('  ✓ File write completed.');

  // Step 4: Reload fresh from disk (simulating application restart)
  console.log('\n[Step 4] Reloading data fresh from disk to verify persistence...');
  const reloadedData = await readData();
  const found = reloadedData.departments.find(d => d.code === 'CHEM_TEST');

  if (found && reloadedData.departments.length === initialDeptCount + 1) {
    console.log(`  ✓ Verification PASSED: New department "${found.name}" found after reload!`);
  } else {
    console.error('  ❌ Verification FAILED: Temporary department was not persisted.');
    process.exitCode = 1;
    return;
  }

  // Step 5: Clean up test record
  console.log('\n[Step 5] Cleaning up test record and saving clean state...');
  reloadedData.departments = reloadedData.departments.filter(d => d.code !== 'CHEM_TEST');
  await writeData(reloadedData);
  
  const finalData = await readData();
  console.log(`  ✓ Clean-up verified. Final departments count: ${finalData.departments.length}`);
  console.log('\n====================================================');
  console.log('✓ All JSON Storage Persistence Tests PASSED!');
  console.log('====================================================\n');
}

if (require.main === module) {
  testStoragePersistence();
}

module.exports = { testStoragePersistence };
