# Panorama - Annual Report Portal

A lightweight, terminal-based Annual Report Portal for academic departments built with **Node.js** and **JSON file storage**.

---

## System Architecture

* **Runtime:** Node.js (uses standard built-in modules `readline/promises`, `fs/promises`, and `path`)
* **Storage Engine:** JSON File Storage (`data/data.json`)
* **Dependencies:** Zero external production dependencies
* **User Interface:** Terminal / Interactive CLI application with formatted ASCII layouts

---

## Roles & Core Workflows

### 1. Department Head (`DEPARTMENT_USER`)
* **View/Create Draft Report:** Auto-initializes departmental report for the active academic cycle.
* **Modular Section Editor:** Edit metrics across 4 core dimensions:
  * **Students:** Total enrolled, annual intake, pass percentage.
  * **Faculty:** Total faculty, PhD holders count, student-faculty ratio.
  * **Research Papers:** Journal publications, conference papers, Scopus-indexed counts.
  * **Placements:** Eligible students, placed students, highest and average package (LPA).
* **Validation & Submission:** Enforces complete population of all 4 required sections before submission.
* **Review Feedback:** Track admin approvals, rejections, and review comments.

### 2. System Administrator (`ADMIN`)
* **Review Submissions:** Inspect pending departmental reports, review section details, and approve or reject with written feedback.
* **Institute Analytics Engine:** Real-time aggregation of:
  * Total institute enrollment and annual intake.
  * Total faculty and PhD qualifications.
  * Total publication counts across departments.
  * Overall placement rate (%), average LPA, and highest package.
* **Consolidated Annual Report Generator:** Builds and prints clean summary reports for executive review.

---

## Demo Login Credentials

| Username | Password | Role | Department |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | `ADMIN` | System Administrator |
| `cse_head` | `cse123` | `DEPARTMENT_USER` | Computer Science & Engineering (`CSE`) |
| `it_head` | `it123` | `DEPARTMENT_USER` | Information Technology (`IT`) |

---

## Data Model Structure (`data/data.json`)

* `departments`: Academic departments (`id`, `name`, `code`, `createdAt`).
* `academicYears`: Reporting cycles (`id`, `yearLabel`, `isActive`, `createdAt`).
* `users`: User accounts (`id`, `username`, `passwordHash`, `fullName`, `role`, `departmentId`, `createdAt`).
* `reports`: Report submissions (`id`, `departmentId`, `academicYearId`, `status`, `feedback`, `submittedAt`, `createdBy`).
* `reportSections`: Modular report sections (`id`, `reportId`, `sectionName`, `sectionData`, `updatedAt`).

---

## Running the Application

### 1. Launch Interactive CLI
```bash
npm start
```

### 2. Run Automated Test Suites
```bash
# Run all automated tests (storage, auth, ui, reports, admin)
npm test

# Run individual test suites
npm run test:storage   # JSON file persistence & query helpers
npm run test:auth      # Authentication & RBAC security
npm run test:ui        # Terminal UI formatters
npm run test:reports   # Report drafting, section editing & submission checks
npm run test:admin     # Admin reviews & institute analytics aggregation
```