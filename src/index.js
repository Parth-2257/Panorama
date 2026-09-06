const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');
const { login } = require('./auth');

/**
 * Prompts the user to press Enter before returning to menu.
 * @param {readline.Interface} rl
 */
async function pause(rl) {
  await rl.question('\nPress Enter to continue...');
}

/**
 * Handles user login flow.
 * @param {readline.Interface} rl
 * @returns {Promise<object|null>} Logged-in user or null if cancelled
 */
async function handleLoginFlow(rl) {
  console.log('\n----------------------------------------------------');
  console.log('                   USER LOGIN                       ');
  console.log('----------------------------------------------------');

  while (true) {
    const username = await rl.question('Enter Username (or type "back" to cancel): ');
    if (username.trim().toLowerCase() === 'back') {
      return null;
    }

    const password = await rl.question('Enter Password: ');

    const user = await login(username, password);

    if (user) {
      console.log(`\n✓ Login successful! Welcome, ${user.fullName}.`);
      return user;
    } else {
      console.log('\n❌ Invalid username or password.\n');
      const retry = await rl.question('Would you like to try again? (y/n): ');
      if (retry.trim().toLowerCase() !== 'y' && retry.trim().toLowerCase() !== 'yes') {
        return null;
      }
      console.log('');
    }
  }
}

/**
 * Displays the Admin Menu and handles option selection.
 * @param {readline.Interface} rl
 * @param {object} user - Active admin user object
 */
async function showAdminDashboard(rl, user) {
  let inAdminMenu = true;

  while (inAdminMenu) {
    console.log('\n====================================================');
    console.log(`   ADMIN DASHBOARD - Welcome, ${user.fullName}!`);
    console.log('====================================================');
    console.log('1. Review Reports');
    console.log('2. View/Manage Approved Reports');
    console.log('3. View Institute Data/Analytics');
    console.log('4. Customize Annual Report');
    console.log('5. Generate Final Report');
    console.log('6. Logout');
    console.log('----------------------------------------------------');

    const choice = (await rl.question('Select an option (1-6): ')).trim();

    switch (choice) {
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        console.log('\n[Notice] This feature will be implemented in a later phase.');
        await pause(rl);
        break;
      case '6':
        console.log('\nLogging out...');
        inAdminMenu = false;
        break;
      default:
        console.log('\n❌ Invalid option. Please enter a number between 1 and 6.');
        await pause(rl);
        break;
    }
  }
}

/**
 * Displays the Department User Menu and handles option selection.
 * @param {readline.Interface} rl
 * @param {object} user - Active department user object
 */
async function showDepartmentDashboard(rl, user) {
  let inDeptMenu = true;
  const deptInfo = user.department ? `${user.department.name} (${user.department.code})` : 'Unassigned';

  while (inDeptMenu) {
    console.log('\n====================================================');
    console.log(`   DEPARTMENT DASHBOARD - Welcome, ${user.fullName}!`);
    console.log(`   Department: ${deptInfo}`);
    console.log('====================================================');
    console.log('1. Create/View My Report');
    console.log('2. Edit Draft Report');
    console.log('3. Submit Report');
    console.log('4. View Feedback');
    console.log('5. Logout');
    console.log('----------------------------------------------------');

    const choice = (await rl.question('Select an option (1-5): ')).trim();

    switch (choice) {
      case '1':
      case '2':
      case '3':
      case '4':
        console.log('\n[Notice] This feature will be implemented in a later phase.');
        await pause(rl);
        break;
      case '5':
        console.log('\nLogging out...');
        inDeptMenu = false;
        break;
      default:
        console.log('\n❌ Invalid option. Please enter a number between 1 and 5.');
        await pause(rl);
        break;
    }
  }
}

/**
 * Main application loop.
 */
async function main() {
  const rl = readline.createInterface({ input, output });

  try {
    let running = true;

    while (running) {
      console.log('\n====================================================');
      console.log('   PANORAMA - Annual Report Portal');
      console.log('   Terminal-based Academic Reporting System');
      console.log('====================================================');
      console.log('1. Login');
      console.log('2. Exit');
      console.log('----------------------------------------------------');

      const choice = (await rl.question('Select an option (1-2): ')).trim();

      if (choice === '1') {
        const currentUser = await handleLoginFlow(rl);

        if (currentUser) {
          if (currentUser.role === 'ADMIN') {
            await showAdminDashboard(rl, currentUser);
          } else if (currentUser.role === 'DEPARTMENT_USER') {
            await showDepartmentDashboard(rl, currentUser);
          } else {
            console.log(`\n❌ Unknown user role: "${currentUser.role}". Cannot open dashboard.`);
            await pause(rl);
          }
          console.log('\n✓ Logged out successfully. Returning to main menu.');
        }
      } else if (choice === '2') {
        console.log('\nThank you for using Panorama. Goodbye!\n');
        running = false;
      } else {
        console.log('\n❌ Invalid option. Please enter 1 or 2.');
        await pause(rl);
      }
    }
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('\nFatal error in application:', err);
    process.exit(1);
  });
}

module.exports = {
  main,
  handleLoginFlow,
  showAdminDashboard,
  showDepartmentDashboard,
};
