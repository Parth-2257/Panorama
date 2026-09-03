const fs = require('fs').promises;
const path = require('path');

// Absolute path to the JSON storage file
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE_PATH = path.join(DATA_DIR, 'data.json');

/**
 * Returns default initial seed data structure.
 */
function getDefaultData() {
  return {
    departments: [
      {
        id: 1,
        name: 'Computer Science and Engineering',
        code: 'CSE',
        createdAt: '2026-09-03T10:00:00.000Z'
      },
      {
        id: 2,
        name: 'Information Technology',
        code: 'IT',
        createdAt: '2026-09-03T10:00:00.000Z'
      },
      {
        id: 3,
        name: 'Electronics and Communication Engineering',
        code: 'ECE',
        createdAt: '2026-09-03T10:00:00.000Z'
      }
    ],
    academicYears: [
      {
        id: 1,
        yearLabel: '2023-2024',
        isActive: true,
        createdAt: '2026-09-03T10:00:00.000Z'
      },
      {
        id: 2,
        yearLabel: '2024-2025',
        isActive: true,
        createdAt: '2026-09-03T10:00:00.000Z'
      }
    ],
    users: [
      {
        id: 1,
        username: 'admin',
        passwordHash: 'admin123',
        fullName: 'System Administrator',
        role: 'ADMIN',
        departmentId: null,
        createdAt: '2026-09-03T10:00:00.000Z'
      },
      {
        id: 2,
        username: 'cse_head',
        passwordHash: 'cse123',
        fullName: 'Dr. Jane Doe',
        role: 'DEPARTMENT_USER',
        departmentId: 1,
        createdAt: '2026-09-03T10:00:00.000Z'
      },
      {
        id: 3,
        username: 'it_head',
        passwordHash: 'it123',
        fullName: 'Dr. John Smith',
        role: 'DEPARTMENT_USER',
        departmentId: 2,
        createdAt: '2026-09-03T10:00:00.000Z'
      }
    ],
    reports: [
      {
        id: 1,
        departmentId: 1,
        academicYearId: 1,
        status: 'DRAFT',
        feedback: null,
        submittedAt: null,
        createdBy: 2,
        createdAt: '2026-09-03T10:00:00.000Z',
        updatedAt: '2026-09-03T10:00:00.000Z'
      }
    ],
    reportSections: [
      {
        id: 1,
        reportId: 1,
        sectionName: 'students',
        sectionData: {
          totalEnrolled: 480,
          intake: 120,
          passPercentage: 96.5
        },
        updatedAt: '2026-09-03T10:00:00.000Z'
      },
      {
        id: 2,
        reportId: 1,
        sectionName: 'faculty',
        sectionData: {
          totalFaculty: 28,
          phdHolders: 18,
          studentFacultyRatio: '17:1'
        },
        updatedAt: '2026-09-03T10:00:00.000Z'
      },
      {
        id: 3,
        reportId: 1,
        sectionName: 'researchPapers',
        sectionData: {
          journalPublications: 15,
          conferencePapers: 22,
          scopusIndexed: 12
        },
        updatedAt: '2026-09-03T10:00:00.000Z'
      },
      {
        id: 4,
        reportId: 1,
        sectionName: 'placements',
        sectionData: {
          eligibleStudents: 115,
          placedStudents: 108,
          highestPackageLpa: 32.5,
          avgPackageLpa: 9.2
        },
        updatedAt: '2026-09-03T10:00:00.000Z'
      }
    ]
  };
}

/**
 * Ensures that the data directory and file exist.
 */
async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE_PATH);
  } catch (err) {
    // If file does not exist, initialize it with default data
    const defaultData = getDefaultData();
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

/**
 * Reads and returns the complete JSON data object.
 * @returns {Promise<{ departments: Array, academicYears: Array, users: Array, reports: Array, reportSections: Array }>}
 */
async function readData() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE_PATH, 'utf8');
  try {
    const data = JSON.parse(raw);
    // Ensure all 5 foundation collections exist
    return {
      departments: Array.isArray(data.departments) ? data.departments : [],
      academicYears: Array.isArray(data.academicYears) ? data.academicYears : [],
      users: Array.isArray(data.users) ? data.users : [],
      reports: Array.isArray(data.reports) ? data.reports : [],
      reportSections: Array.isArray(data.reportSections) ? data.reportSections : [],
    };
  } catch (err) {
    throw new Error(`Failed to parse data.json: ${err.message}`);
  }
}

/**
 * Writes the given data object back to data.json with 2-space indentation.
 * @param {object} data - Complete application data object
 */
async function writeData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('writeData requires a valid data object');
  }
  await ensureDataFile();
  const formattedJson = JSON.stringify(data, null, 2);
  await fs.writeFile(DATA_FILE_PATH, formattedJson, 'utf8');
}

/**
 * Resets data.json back to initial default seed values.
 */
async function resetData() {
  const defaultData = getDefaultData();
  await writeData(defaultData);
  return defaultData;
}

module.exports = {
  DATA_FILE_PATH,
  readData,
  writeData,
  getDefaultData,
  resetData,
};
