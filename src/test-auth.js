const { login } = require('./auth');

/**
 * Automated test suite for Phase 2 authentication logic.
 */
async function testAuth() {
  console.log('====================================================');
  console.log('       Testing Authentication Flow (Phase 2)        ');
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

  // Test 1: Valid Admin Login
  const adminUser = await login('admin', 'admin123');
  assert(adminUser !== null && adminUser.role === 'ADMIN' && adminUser.username === 'admin', 'Valid ADMIN login (admin / admin123)');

  // Test 2: Valid Department User Login (CSE)
  const cseUser = await login('cse_head', 'cse123');
  assert(
    cseUser !== null &&
      cseUser.role === 'DEPARTMENT_USER' &&
      cseUser.department &&
      cseUser.department.code === 'CSE',
    'Valid DEPARTMENT_USER login with department attachment (cse_head / cse123)'
  );

  // Test 3: Valid Department User Login (IT)
  const itUser = await login('it_head', 'it123');
  assert(
    itUser !== null &&
      itUser.role === 'DEPARTMENT_USER' &&
      itUser.department &&
      itUser.department.code === 'IT',
    'Valid DEPARTMENT_USER login with department attachment (it_head / it123)'
  );

  // Test 4: Invalid Password
  const badPass = await login('admin', 'wrongpass');
  assert(badPass === null, 'Invalid password correctly rejected');

  // Test 5: Non-existent User
  const badUser = await login('unknown_user', 'somepass');
  assert(badUser === null, 'Non-existent username correctly rejected');

  // Test 6: Empty inputs
  const emptyInputs = await login('', '');
  assert(emptyInputs === null, 'Empty username and password rejected');

  // Test 7: Case-insensitive username lookup
  const caseInsensitive = await login('ADMIN', 'admin123');
  assert(caseInsensitive !== null && caseInsensitive.role === 'ADMIN', 'Case-insensitive username matching');

  console.log('\n====================================================');
  console.log(`Test Results: ${passed}/${total} assertions passed.`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

if (require.main === module) {
  testAuth();
}

module.exports = { testAuth };
