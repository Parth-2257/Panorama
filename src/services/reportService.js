const { readData, writeData } = require('../storage');

const REQUIRED_SECTIONS = ['students', 'faculty', 'researchPapers', 'placements'];

/**
 * Retrieves the currently active academic year.
 * @returns {Promise<object|null>}
 */
async function getActiveAcademicYear() {
  const data = await readData();
  return data.academicYears.find((y) => y.isActive) || null;
}

/**
 * Finds an existing report for a specific department and academic year.
 * @param {number} departmentId
 * @param {number} academicYearId
 * @returns {Promise<object|null>}
 */
async function getReportForDepartment(departmentId, academicYearId) {
  const data = await readData();
  const report = data.reports.find(
    (r) => r.departmentId === departmentId && r.academicYearId === academicYearId
  );
  return report || null;
}

/**
 * Gets or creates a draft report for a department.
 * @param {number} departmentId
 * @param {number} academicYearId
 * @param {number} userId
 * @returns {Promise<object>}
 */
async function createOrGetDraftReport(departmentId, academicYearId, userId) {
  const data = await readData();
  let report = data.reports.find(
    (r) => r.departmentId === departmentId && r.academicYearId === academicYearId
  );

  if (!report) {
    const nextId = data.reports.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const now = new Date().toISOString();
    report = {
      id: nextId,
      departmentId,
      academicYearId,
      status: 'DRAFT',
      feedback: null,
      submittedAt: null,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };
    data.reports.push(report);
    await writeData(data);
  }

  return report;
}

/**
 * Gets all modular sections for a given report ID.
 * @param {number} reportId
 * @returns {Promise<Array>}
 */
async function getReportSections(reportId) {
  const data = await readData();
  return data.reportSections.filter((s) => s.reportId === reportId);
}

/**
 * Updates or creates a section's payload within a report.
 * @param {number} reportId
 * @param {string} sectionName
 * @param {object} sectionData
 * @returns {Promise<object>} Updated section record
 */
async function saveReportSection(reportId, sectionName, sectionData) {
  const data = await readData();
  const now = new Date().toISOString();

  let section = data.reportSections.find(
    (s) => s.reportId === reportId && s.sectionName === sectionName
  );

  if (section) {
    section.sectionData = { ...section.sectionData, ...sectionData };
    section.updatedAt = now;
  } else {
    const nextId = data.reportSections.reduce((max, s) => Math.max(max, s.id), 0) + 1;
    section = {
      id: nextId,
      reportId,
      sectionName,
      sectionData,
      updatedAt: now,
    };
    data.reportSections.push(section);
  }

  // Update parent report's updatedAt
  const report = data.reports.find((r) => r.id === reportId);
  if (report) {
    report.updatedAt = now;
  }

  await writeData(data);
  return section;
}

/**
 * Submits a report for administrative review if all required sections exist.
 * @param {number} reportId
 * @returns {Promise<{ success: boolean, message: string, report?: object }>}
 */
async function submitReport(reportId) {
  const data = await readData();
  const report = data.reports.find((r) => r.id === reportId);

  if (!report) {
    return { success: false, message: `Report with ID ${reportId} not found.` };
  }

  if (report.status === 'APPROVED') {
    return { success: false, message: 'Approved reports cannot be re-submitted.' };
  }

  const existingSections = data.reportSections
    .filter((s) => s.reportId === reportId)
    .map((s) => s.sectionName);

  const missing = REQUIRED_SECTIONS.filter((req) => !existingSections.includes(req));

  if (missing.length > 0) {
    return {
      success: false,
      message: `Cannot submit report. Missing required sections: ${missing.join(', ')}`,
    };
  }

  const now = new Date().toISOString();
  report.status = 'SUBMITTED';
  report.submittedAt = now;
  report.updatedAt = now;

  await writeData(data);
  return { success: true, message: 'Report submitted successfully for Admin review.', report };
}

module.exports = {
  REQUIRED_SECTIONS,
  getActiveAcademicYear,
  getReportForDepartment,
  createOrGetDraftReport,
  getReportSections,
  saveReportSection,
  submitReport,
};
