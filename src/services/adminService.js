const fs = require('fs').promises;
const path = require('path');
const { readData, writeData } = require('../storage');

const REPORTS_DIR = path.join(__dirname, '..', '..', 'reports');

/**
 * Retrieves all departmental reports along with related department, year, and author details.
 * @param {number} [academicYearId]
 * @returns {Promise<Array>}
 */
async function getAllDepartmentReports(academicYearId) {
  const data = await readData();

  let reports = data.reports;
  if (academicYearId) {
    reports = reports.filter((r) => r.academicYearId === academicYearId);
  }

  return reports.map((r) => {
    const department = data.departments.find((d) => d.id === r.departmentId) || null;
    const academicYear = data.academicYears.find((y) => y.id === r.academicYearId) || null;
    const author = data.users.find((u) => u.id === r.createdBy) || null;
    const sections = data.reportSections.filter((s) => s.reportId === r.id);

    return {
      ...r,
      department,
      academicYear,
      author: author ? { id: author.id, fullName: author.fullName, username: author.username } : null,
      sectionsCount: sections.length,
      sections,
    };
  });
}

/**
 * Reviews a submitted report by setting its status to APPROVED or REJECTED with feedback.
 * @param {number} reportId
 * @param {'APPROVED'|'REJECTED'} status
 * @param {string} feedback
 * @returns {Promise<{ success: boolean, message: string, report?: object }>}
 */
async function reviewReport(reportId, status, feedback = '') {
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return { success: false, message: 'Invalid review status. Must be APPROVED or REJECTED.' };
  }

  const data = await readData();
  const report = data.reports.find((r) => r.id === reportId);

  if (!report) {
    return { success: false, message: `Report with ID ${reportId} not found.` };
  }

  if (report.status !== 'SUBMITTED' && report.status !== 'DRAFT') {
    // Note: Can re-evaluate if needed, but primary review is on submitted reports
  }

  const now = new Date().toISOString();
  report.status = status;
  report.feedback = feedback || null;
  report.updatedAt = now;

  await writeData(data);
  return { success: true, message: `Report status updated to ${status}.`, report };
}

/**
 * Computes consolidated institute-level analytics for an academic year.
 * @param {number} academicYearId
 * @returns {Promise<object>}
 */
async function getInstituteAnalytics(academicYearId) {
  const data = await readData();
  const allReports = data.reports.filter((r) => r.academicYearId === academicYearId);

  // Filter only APPROVED reports, ensuring no duplicate department reports are counted
  const seenDepartments = new Set();
  const approvedReports = [];
  for (const r of allReports) {
    if (r.status === 'APPROVED' && !seenDepartments.has(r.departmentId)) {
      seenDepartments.add(r.departmentId);
      approvedReports.push(r);
    }
  }

  const approvedReportIds = new Set(approvedReports.map((r) => r.id));

  // Extract sections belonging only to approved reports, avoiding duplicate section entries
  const seenSections = new Set();
  const sections = [];
  for (const s of data.reportSections) {
    if (approvedReportIds.has(s.reportId)) {
      const secKey = `${s.reportId}:${s.sectionName}`;
      if (!seenSections.has(secKey)) {
        seenSections.add(secKey);
        sections.push(s);
      }
    }
  }

  let totalEnrolled = 0;
  let totalIntake = 0;
  let totalFaculty = 0;
  let totalPhdHolders = 0;
  let journalPublications = 0;
  let conferencePapers = 0;
  let scopusIndexed = 0;
  let totalEligiblePlacements = 0;
  let totalPlacedStudents = 0;
  let highestPackageLpa = 0;
  let packageSum = 0;
  let packageCount = 0;

  for (const s of sections) {
    const d = s.sectionData || {};
    if (s.sectionName === 'students') {
      totalEnrolled += d.totalEnrolled || 0;
      totalIntake += d.intake || 0;
    } else if (s.sectionName === 'faculty') {
      totalFaculty += d.totalFaculty || 0;
      totalPhdHolders += d.phdHolders || 0;
    } else if (s.sectionName === 'researchPapers') {
      journalPublications += d.journalPublications || 0;
      conferencePapers += d.conferencePapers || 0;
      scopusIndexed += d.scopusIndexed || 0;
    } else if (s.sectionName === 'placements') {
      totalEligiblePlacements += d.eligibleStudents || 0;
      totalPlacedStudents += d.placedStudents || 0;
      if (d.highestPackageLpa && d.highestPackageLpa > highestPackageLpa) {
        highestPackageLpa = d.highestPackageLpa;
      }
      if (d.avgPackageLpa) {
        packageSum += d.avgPackageLpa;
        packageCount += 1;
      }
    }
  }

  const placementPercentage =
    totalEligiblePlacements > 0
      ? Number(((totalPlacedStudents / totalEligiblePlacements) * 100).toFixed(1))
      : 0;

  const avgPackageLpa = packageCount > 0 ? Number((packageSum / packageCount).toFixed(2)) : 0;

  return {
    academicYearId,
    totalReports: allReports.length,
    approvedReports: approvedReports.length,
    submittedReports: allReports.filter((r) => r.status === 'SUBMITTED').length,
    draftReports: allReports.filter((r) => r.status === 'DRAFT').length,
    students: {
      totalEnrolled,
      totalIntake,
    },
    faculty: {
      totalFaculty,
      totalPhdHolders,
    },
    research: {
      journalPublications,
      conferencePapers,
      totalPublications: journalPublications + conferencePapers,
      scopusIndexed,
    },
    placements: {
      totalEligible: totalEligiblePlacements,
      totalPlaced: totalPlacedStudents,
      placementPercentage,
      highestPackageLpa,
      avgPackageLpa,
    },
  };
}

const PREDEFINED_SECTIONS = [
  { sectionName: 'students', displayName: 'Students' },
  { sectionName: 'faculty', displayName: 'Faculty' },
  { sectionName: 'researchPapers', displayName: 'Research Papers' },
  { sectionName: 'placements', displayName: 'Placements' },
];

/**
 * Retrieves the annual report section customization.
 * Returns the list of predefined sections with their selection state and order.
 * @returns {Promise<Array<{ sectionName: string, displayName: string, selected: boolean, order: number }>>}
 */
async function getReportCustomization() {
  const data = await readData();
  const saved = Array.isArray(data.reportCustomization) ? data.reportCustomization : [];

  const result = PREDEFINED_SECTIONS.map((predef, idx) => {
    const existing = saved.find((s) => s.sectionName === predef.sectionName);
    return {
      sectionName: predef.sectionName,
      displayName: predef.displayName,
      selected: existing ? Boolean(existing.selected) : true,
      order: existing && typeof existing.order === 'number' ? existing.order : idx + 1,
    };
  });

  result.sort((a, b) => a.order - b.order);
  return result;
}

/**
 * Saves the annual report section customization to JSON storage.
 * @param {Array<{ sectionName: string, displayName?: string, selected: boolean, order: number }>} customizedSections
 * @returns {Promise<{ success: boolean, message: string, customization: Array }>}
 */
async function saveReportCustomization(customizedSections) {
  if (!Array.isArray(customizedSections) || customizedSections.length === 0) {
    return { success: false, message: 'Invalid customization payload. Must be a non-empty array.' };
  }

  const data = await readData();

  const normalized = PREDEFINED_SECTIONS.map((predef, idx) => {
    const found = customizedSections.find((c) => c.sectionName === predef.sectionName);
    if (found) {
      return {
        sectionName: predef.sectionName,
        displayName: predef.displayName,
        selected: Boolean(found.selected),
        order: typeof found.order === 'number' ? found.order : idx + 1,
      };
    }
    return {
      sectionName: predef.sectionName,
      displayName: predef.displayName,
      selected: false,
      order: idx + 1,
    };
  });

  normalized.sort((a, b) => a.order - b.order);

  data.reportCustomization = normalized;
  await writeData(data);

  return {
    success: true,
    message: 'Annual report customization saved successfully.',
    customization: normalized,
  };
}

/**
 * Generates and saves the official Institute Annual Report for an academic year.
 * Only includes data from APPROVED reports, formats according to saved customization,
 * and writes to reports/annual-report-<yearLabel>.txt.
 * @param {number} academicYearId
 * @returns {Promise<{ success: boolean, message: string, fileName?: string, filePath?: string, reportContent?: string }>}
 */
async function generateFinalAnnualReport(academicYearId) {
  const data = await readData();
  const academicYear = data.academicYears.find((y) => y.id === academicYearId);

  if (!academicYear) {
    return { success: false, message: `Academic year with ID ${academicYearId} not found.` };
  }

  // 1. Get institute analytics (calculates metrics strictly from APPROVED reports)
  const stats = await getInstituteAnalytics(academicYearId);

  // 2. Validate that there is at least one approved report
  if (stats.approvedReports === 0) {
    return {
      success: false,
      message: 'No approved reports are available for this academic year. Final report cannot be generated.',
    };
  }

  // 3. Get saved customization sections and filter for selected ones
  const allCustomSections = await getReportCustomization();
  const selectedSections = allCustomSections.filter((s) => s.selected);

  // 4. Validate that at least one section is selected
  if (selectedSections.length === 0) {
    return {
      success: false,
      message: 'No report sections are currently selected. Customization required before generation.',
    };
  }

  // Sort selected sections by order
  selectedSections.sort((a, b) => a.order - b.order);

  // 5. Build report text
  const divider = '='.repeat(60);
  const subDivider = '-'.repeat(60);
  const lines = [];

  lines.push(divider);
  lines.push('INSTITUTE ANNUAL REPORT');
  lines.push(`ACADEMIC YEAR: ${academicYear.yearLabel}`);
  lines.push(divider);
  lines.push(`Generated On: ${new Date().toLocaleString()}`);
  lines.push(`Contributing Approved Department Reports: ${stats.approvedReports}`);
  lines.push(divider);
  lines.push('');

  selectedSections.forEach((sec, idx) => {
    const sectionNumber = idx + 1;
    const title = `${sectionNumber}. ${sec.displayName.toUpperCase()}`;
    lines.push(title);
    lines.push(subDivider);

    if (sec.sectionName === 'students') {
      lines.push(`  • Total Enrolled Students : ${stats.students.totalEnrolled}`);
      lines.push(`  • Annual Intake           : ${stats.students.totalIntake}`);
    } else if (sec.sectionName === 'faculty') {
      lines.push(`  • Total Faculty           : ${stats.faculty.totalFaculty}`);
      lines.push(`  • PhD Holders             : ${stats.faculty.totalPhdHolders}`);
    } else if (sec.sectionName === 'researchPapers') {
      lines.push(`  • Journal Publications    : ${stats.research.journalPublications}`);
      lines.push(`  • Conference Papers       : ${stats.research.conferencePapers}`);
      lines.push(`  • Total Publications      : ${stats.research.totalPublications}`);
      lines.push(`  • Scopus Indexed Papers   : ${stats.research.scopusIndexed}`);
    } else if (sec.sectionName === 'placements') {
      lines.push(`  • Eligible Students       : ${stats.placements.totalEligible}`);
      lines.push(`  • Placed Students         : ${stats.placements.totalPlaced}`);
      lines.push(`  • Placement Rate          : ${stats.placements.placementPercentage}%`);
      lines.push(`  • Highest Package         : ${stats.placements.highestPackageLpa} LPA`);
      lines.push(`  • Average Package         : ${stats.placements.avgPackageLpa} LPA`);
    }

    lines.push('');
  });

  lines.push(divider);
  lines.push('END OF REPORT');
  lines.push(divider);
  lines.push('');

  const reportContent = lines.join('\n');

  // 6. Ensure reports directory exists
  await fs.mkdir(REPORTS_DIR, { recursive: true });

  // 7. Sanitize filename and write file
  const sanitizedYear = academicYear.yearLabel.replace(/[\/\\]/g, '-');
  const fileName = `annual-report-${sanitizedYear}.txt`;
  const filePath = path.join(REPORTS_DIR, fileName);

  await fs.writeFile(filePath, reportContent, 'utf8');

  return {
    success: true,
    message: `Final Annual Report generated successfully.`,
    fileName,
    filePath,
    reportContent,
  };
}

module.exports = {
  REPORTS_DIR,
  PREDEFINED_SECTIONS,
  getAllDepartmentReports,
  reviewReport,
  getInstituteAnalytics,
  getReportCustomization,
  saveReportCustomization,
  generateFinalAnnualReport,
};
