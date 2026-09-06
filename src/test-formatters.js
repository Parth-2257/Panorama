const { createHeader, formatStatusBadge, formatKeyValue } = require('./utils/formatters');

/**
 * Unit tests for terminal formatting utilities.
 */
function testFormatters() {
  console.log('====================================================');
  console.log('         Testing UI Formatter Utilities             ');
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

  // Test 1: Header generation
  const header = createHeader('TEST TITLE', 40);
  assert(header.includes('TEST TITLE') && header.startsWith('='.repeat(40)), 'createHeader generates correct border');

  // Test 2: Status badges
  assert(formatStatusBadge('APPROVED') === '[✓ APPROVED]', 'formatStatusBadge APPROVED');
  assert(formatStatusBadge('SUBMITTED') === '[⏳ SUBMITTED]', 'formatStatusBadge SUBMITTED');
  assert(formatStatusBadge('REJECTED') === '[✗ REJECTED]', 'formatStatusBadge REJECTED');
  assert(formatStatusBadge('DRAFT') === '[📝 DRAFT]', 'formatStatusBadge DRAFT');

  // Test 3: Key-Value formatting
  const kv = formatKeyValue('Department', 'CSE', 15);
  assert(kv.includes('Department') && kv.includes('CSE'), 'formatKeyValue aligns correctly');

  console.log('\n====================================================');
  console.log(`Formatter Test Results: ${passed}/${total} assertions passed.`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

if (require.main === module) {
  testFormatters();
}

module.exports = { testFormatters };
