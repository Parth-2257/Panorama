const { readData, writeData } = require('../storage');

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
  const reports = data.reports.filter((r) => r.academicYearId === academicYearId);
  const reportIds = reports.map((r) => r.id);
  const sections = data.reportSections.filter((s) => reportIds.includes(s.reportId));

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
    totalReports: reports.length,
    approvedReports: reports.filter((r) => r.status === 'APPROVED').length,
    submittedReports: reports.filter((r) => r.status === 'SUBMITTED').length,
    draftReports: reports.filter((r) => r.status === 'DRAFT').length,
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

module.exports = {
  getAllDepartmentReports,
  reviewReport,
  getInstituteAnalytics,
};
