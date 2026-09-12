const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');
const { login } = require('./auth');
const { createHeader, formatStatusBadge, formatKeyValue } = require('./utils/formatters');
const {
  getActiveAcademicYear,
  getReportForDepartment,
  createOrGetDraftReport,
  getReportSections,
  saveReportSection,
  submitReport,
} = require('./services/reportService');
const {
  getAllDepartmentReports,
  reviewReport,
  getInstituteAnalytics,
  getReportCustomization,
  saveReportCustomization,
} = require('./services/adminService');

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
 * View Report and Sections for Department User.
 */
async function handleViewDepartmentReport(rl, user) {
  const activeYear = await getActiveAcademicYear();
  if (!activeYear) {
    console.log('\n❌ No active academic year configured.');
    return;
  }

  const report = await createOrGetDraftReport(user.departmentId, activeYear.id, user.id);
  const sections = await getReportSections(report.id);

  console.log('\n' + createHeader(`ANNUAL REPORT: ${user.department.name} (${activeYear.yearLabel})`));
  console.log(formatKeyValue('Status', formatStatusBadge(report.status)));
  console.log(formatKeyValue('Academic Year', activeYear.yearLabel));
  console.log(formatKeyValue('Last Updated', report.updatedAt ? new Date(report.updatedAt).toLocaleString() : 'N/A'));
  if (report.feedback) {
    console.log(formatKeyValue('Reviewer Notes', report.feedback));
  }

  console.log('\n--- Modular Report Sections ---');
  if (sections.length === 0) {
    console.log('  (No sections populated yet)');
  } else {
    for (const sec of sections) {
      console.log(`\n[Section: ${sec.sectionName.toUpperCase()}]`);
      for (const [k, v] of Object.entries(sec.sectionData)) {
        console.log(`   • ${k}: ${v}`);
      }
    }
  }
}

/**
 * Interactive Section Editor for Department User.
 */
async function handleEditDepartmentReport(rl, user) {
  const activeYear = await getActiveAcademicYear();
  const report = await createOrGetDraftReport(user.departmentId, activeYear.id, user.id);

  if (report.status === 'APPROVED') {
    console.log('\n⚠️ This report has already been APPROVED and cannot be edited.');
    return;
  }

  console.log('\n----------------------------------------------------');
  console.log('               EDIT REPORT SECTIONS                 ');
  console.log('----------------------------------------------------');
  console.log('1. Students (Total Enrolled, Intake, Pass %)');
  console.log('2. Faculty (Total Faculty, PhD Holders, Ratio)');
  console.log('3. Research Papers (Journals, Conferences, Scopus)');
  console.log('4. Placements (Eligible, Placed, Highest LPA, Avg LPA)');
  console.log('5. Back to Dashboard');

  const secChoice = (await rl.question('Select section to edit (1-5): ')).trim();

  if (secChoice === '1') {
    const totalEnrolled = Number(await rl.question('Enter Total Enrolled Students: ')) || 0;
    const intake = Number(await rl.question('Enter Annual Intake: ')) || 0;
    const passPercentage = Number(await rl.question('Enter Pass Percentage (%): ')) || 0;
    await saveReportSection(report.id, 'students', { totalEnrolled, intake, passPercentage });
    console.log('\n✓ Students section updated successfully.');
  } else if (secChoice === '2') {
    const totalFaculty = Number(await rl.question('Enter Total Faculty: ')) || 0;
    const phdHolders = Number(await rl.question('Enter PhD Holders Count: ')) || 0;
    const studentFacultyRatio = (await rl.question('Enter Student-Faculty Ratio (e.g. 15:1): ')).trim() || '15:1';
    await saveReportSection(report.id, 'faculty', { totalFaculty, phdHolders, studentFacultyRatio });
    console.log('\n✓ Faculty section updated successfully.');
  } else if (secChoice === '3') {
    const journalPublications = Number(await rl.question('Enter Journal Publications: ')) || 0;
    const conferencePapers = Number(await rl.question('Enter Conference Papers: ')) || 0;
    const scopusIndexed = Number(await rl.question('Enter Scopus Indexed Papers: ')) || 0;
    await saveReportSection(report.id, 'researchPapers', { journalPublications, conferencePapers, scopusIndexed });
    console.log('\n✓ Research Papers section updated successfully.');
  } else if (secChoice === '4') {
    const eligibleStudents = Number(await rl.question('Enter Eligible Students: ')) || 0;
    const placedStudents = Number(await rl.question('Enter Placed Students: ')) || 0;
    const highestPackageLpa = Number(await rl.question('Enter Highest Package (LPA): ')) || 0;
    const avgPackageLpa = Number(await rl.question('Enter Average Package (LPA): ')) || 0;
    await saveReportSection(report.id, 'placements', { eligibleStudents, placedStudents, highestPackageLpa, avgPackageLpa });
    console.log('\n✓ Placements section updated successfully.');
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
    console.log('\n' + createHeader(`DEPARTMENT DASHBOARD - ${user.fullName}`));
    console.log(`   Department: ${deptInfo}`);
    console.log('----------------------------------------------------');
    console.log('1. Create/View My Report');
    console.log('2. Edit Draft Report');
    console.log('3. Submit Report');
    console.log('4. View Feedback');
    console.log('5. Logout');
    console.log('----------------------------------------------------');

    const choice = (await rl.question('Select an option (1-5): ')).trim();

    switch (choice) {
      case '1':
        await handleViewDepartmentReport(rl, user);
        await pause(rl);
        break;
      case '2':
        await handleEditDepartmentReport(rl, user);
        await pause(rl);
        break;
      case '3': {
        const activeYear = await getActiveAcademicYear();
        const report = await createOrGetDraftReport(user.departmentId, activeYear.id, user.id);
        const submitRes = await submitReport(report.id);
        if (submitRes.success) {
          console.log(`\n✓ ${submitRes.message}`);
        } else {
          console.log(`\n❌ ${submitRes.message}`);
        }
        await pause(rl);
        break;
      }
      case '4': {
        const activeYear = await getActiveAcademicYear();
        const report = await getReportForDepartment(user.departmentId, activeYear.id);
        console.log('\n--- Review Feedback & Status ---');
        if (!report) {
          console.log('  No report on file.');
        } else {
          console.log(`  Current Status: ${formatStatusBadge(report.status)}`);
          console.log(`  Feedback: ${report.feedback || '(No feedback provided yet)'}`);
        }
        await pause(rl);
        break;
      }
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
 * Interactive Annual Report Section Customization for Admin.
 * @param {readline.Interface} rl
 */
async function handleCustomizeAnnualReport(rl) {
  console.log('\n' + createHeader('CUSTOMIZE ANNUAL REPORT SECTIONS'));
  const currentSections = await getReportCustomization();

  console.log('\nAvailable Sections:');
  currentSections.forEach((sec, idx) => {
    const status = sec.selected ? `[SELECTED - Order: ${sec.order}]` : '[EXCLUDED]';
    console.log(`  ${idx + 1}. ${sec.displayName.padEnd(20, ' ')} ${status}`);
  });

  console.log('\n----------------------------------------------------');
  console.log('Step 1: Choose sections to include');
  console.log('Enter comma-separated numbers (e.g., 1, 2, 4), "all" to include all, or "cancel":');
  const selectionInput = (await rl.question('Selection: ')).trim();

  if (selectionInput.toLowerCase() === 'cancel') {
    console.log('\nCustomization cancelled.');
    return;
  }

  let selectedIndices = [];
  if (!selectionInput || selectionInput.toLowerCase() === 'all') {
    selectedIndices = currentSections.map((_, i) => i);
  } else {
    const parts = selectionInput.split(',').map((p) => parseInt(p.trim(), 10));
    for (const p of parts) {
      if (!isNaN(p) && p >= 1 && p <= currentSections.length) {
        if (!selectedIndices.includes(p - 1)) {
          selectedIndices.push(p - 1);
        }
      }
    }
  }

  if (selectedIndices.length === 0) {
    console.log('\n❌ No valid sections selected. Customization aborted.');
    return;
  }

  console.log('\n----------------------------------------------------');
  console.log('Step 2: Choose display order of selected sections');
  const chosenList = selectedIndices.map((i) => currentSections[i]);
  console.log('Selected sections:');
  chosenList.forEach((s, idx) => {
    console.log(`  ${idx + 1}. ${s.displayName}`);
  });

  console.log(
    `\nEnter desired sequence using 1-${chosenList.length} (e.g., ${chosenList
      .map((_, i) => chosenList.length - i)
      .join(', ')}), or press Enter to keep current order:`
  );
  const orderInput = (await rl.question('Order: ')).trim();

  let orderedChosen = [...chosenList];
  if (orderInput) {
    const orderParts = orderInput.split(/[,\s]+/).map((p) => parseInt(p.trim(), 10));
    const validOrders = orderParts.filter((p) => !isNaN(p) && p >= 1 && p <= chosenList.length);
    const uniqueOrders = [...new Set(validOrders)];

    if (uniqueOrders.length === chosenList.length) {
      orderedChosen = uniqueOrders.map((num) => chosenList[num - 1]);
    } else {
      console.log('\n⚠️ Order input did not specify all selected sections. Retaining default order.');
    }
  }

  // Build full customization payload
  const updatedCustomization = [];
  // Add selected sections in their specified order (1..N)
  orderedChosen.forEach((sec, idx) => {
    updatedCustomization.push({
      sectionName: sec.sectionName,
      displayName: sec.displayName,
      selected: true,
      order: idx + 1,
    });
  });

  // Add remaining unselected sections at the end with selected: false
  let unselectedOrder = orderedChosen.length + 1;
  currentSections.forEach((sec) => {
    if (!orderedChosen.some((o) => o.sectionName === sec.sectionName)) {
      updatedCustomization.push({
        sectionName: sec.sectionName,
        displayName: sec.displayName,
        selected: false,
        order: unselectedOrder++,
      });
    }
  });

  const res = await saveReportCustomization(updatedCustomization);
  if (res.success) {
    console.log(`\n✓ ${res.message}`);
    console.log('\nUpdated Section Order:');
    res.customization.forEach((sec) => {
      const tag = sec.selected ? `[Order: ${sec.order}]` : '[EXCLUDED]';
      console.log(`  • ${sec.displayName.padEnd(20, ' ')} : ${tag}`);
    });
  } else {
    console.log(`\n❌ ${res.message}`);
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
    console.log('\n' + createHeader(`ADMIN DASHBOARD - ${user.fullName}`));
    console.log('1. Review Submitted Reports');
    console.log('2. View Approved Reports');
    console.log('3. View Institute Analytics');
    console.log('4. Customize Annual Report');
    console.log('5. Generate Consolidated Annual Report');
    console.log('6. Logout');
    console.log('----------------------------------------------------');

    const choice = (await rl.question('Select an option (1-6): ')).trim();

    switch (choice) {
      case '1': {
        const activeYear = await getActiveAcademicYear();
        const reports = await getAllDepartmentReports(activeYear?.id);
        const submitted = reports.filter((r) => r.status === 'SUBMITTED');

        console.log('\n--- Pending Submitted Reports ---');
        if (submitted.length === 0) {
          console.log('  No reports currently pending review.');
        } else {
          submitted.forEach((r) => {
            console.log(`  [ID: ${r.id}] ${r.department?.name || 'Unknown'} - Submitted by: ${r.author?.fullName || 'N/A'}`);
          });

          const reportIdInput = (await rl.question('\nEnter Report ID to review (or press enter to skip): ')).trim();
          if (reportIdInput) {
            const reportId = Number(reportIdInput);
            const decision = (await rl.question('Enter decision (A for Approve / R for Reject): ')).trim().toUpperCase();
            const feedback = await rl.question('Enter review notes / feedback: ');

            if (decision === 'A') {
              const res = await reviewReport(reportId, 'APPROVED', feedback);
              console.log(res.success ? `\n✓ ${res.message}` : `\n❌ ${res.message}`);
            } else if (decision === 'R') {
              const res = await reviewReport(reportId, 'REJECTED', feedback);
              console.log(res.success ? `\n✓ ${res.message}` : `\n❌ ${res.message}`);
            } else {
              console.log('\n❌ Invalid decision. Action cancelled.');
            }
          }
        }
        await pause(rl);
        break;
      }
      case '2': {
        const activeYear = await getActiveAcademicYear();
        const reports = await getAllDepartmentReports(activeYear?.id);
        const approved = reports.filter((r) => r.status === 'APPROVED');

        console.log('\n--- Approved Departmental Reports ---');
        if (approved.length === 0) {
          console.log('  No approved reports found for the active academic cycle.');
        } else {
          approved.forEach((r) => {
            console.log(`  ✓ ${r.department?.name} (${r.department?.code}) - Approved with feedback: "${r.feedback || 'None'}"`);
          });
        }
        await pause(rl);
        break;
      }
      case '3': {
        const activeYear = await getActiveAcademicYear();
        const stats = await getInstituteAnalytics(activeYear.id);

        console.log('\n' + createHeader(`INSTITUTE ANALYTICS (${activeYear.yearLabel})`));
        console.log(formatKeyValue('Total Reports', stats.totalReports));
        console.log(formatKeyValue('Approved Reports', stats.approvedReports));
        console.log(formatKeyValue('Total Enrolled Students', stats.students.totalEnrolled));
        console.log(formatKeyValue('Total Faculty', `${stats.faculty.totalFaculty} (${stats.faculty.totalPhdHolders} PhDs)`));
        console.log(formatKeyValue('Total Research Publications', `${stats.research.totalPublications} (${stats.research.scopusIndexed} Scopus)`));
        console.log(formatKeyValue('Placement Rate', `${stats.placements.placementPercentage}%`));
        console.log(formatKeyValue('Highest / Avg Package', `${stats.placements.highestPackageLpa} LPA / ${stats.placements.avgPackageLpa} LPA`));
        await pause(rl);
        break;
      }
      case '4': {
        await handleCustomizeAnnualReport(rl);
        await pause(rl);
        break;
      }
      case '5': {
        const activeYear = await getActiveAcademicYear();
        const stats = await getInstituteAnalytics(activeYear.id);
        const reports = await getAllDepartmentReports(activeYear.id);

        console.log('\n' + createHeader(`CONSOLIDATED ANNUAL REPORT - ${activeYear.yearLabel}`, 64));
        console.log(`Generated on: ${new Date().toLocaleString()}`);
        console.log('Total Contributing Departments: ' + reports.length);
        console.log('Institute Enrollment: ' + stats.students.totalEnrolled);
        console.log('Institute Faculty: ' + stats.faculty.totalFaculty);
        console.log('Overall Placement Rate: ' + stats.placements.placementPercentage + '%');
        console.log('Top Package: ' + stats.placements.highestPackageLpa + ' LPA');
        console.log('----------------------------------------------------------------');
        reports.forEach((r) => {
          console.log(`• Department: ${r.department?.name} | Status: ${formatStatusBadge(r.status)}`);
        });
        console.log('================================================================');
        await pause(rl);
        break;
      }
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
 * Main application loop.
 */
async function main() {
  const rl = readline.createInterface({ input, output });

  try {
    let running = true;

    while (running) {
      console.log('\n' + createHeader('PANORAMA - Academic Annual Report Portal'));
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
