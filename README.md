# Panorama - Annual Report Portal

A lightweight, terminal-based Annual Report Portal for academic departments built with **Node.js** and **JSON file storage**.

---

## System Architecture

* **Runtime:** Node.js (uses standard built-in modules `readline/promises`, `fs/promises`, and `path`)
* **Storage Engine:** JSON File Storage (`data/data.json`)
* **Dependencies:** Zero external production dependencies
* **User Interface:** Terminal / Interactive CLI application

---

## Authentication & Role-Based Access Control (Phase 2)

Panorama supports two distinct user roles:

1. **`ADMIN`**:
   * Has access to the **Admin Dashboard**.
   * Menu:
     1. Review Reports
     2. View/Manage Approved Reports
     3. View Institute Data/Analytics
     4. Customize Annual Report
     5. Generate Final Report
     6. Logout

2. **`DEPARTMENT_USER`**:
   * Bound to a specific department (e.g., Computer Science and Engineering).
   * Has access to the **Department Dashboard**.
   * Menu:
     1. Create/View My Report
     2. Edit Draft Report
     3. Submit Report
     4. View Feedback
     5. Logout

### Demo Login Credentials

| Username | Password | Role | Department |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | `ADMIN` | System-wide |
| `cse_head` | `cse123` | `DEPARTMENT_USER` | Computer Science & Engineering (`CSE`) |
| `it_head` | `it123` | `DEPARTMENT_USER` | Information Technology (`IT`) |

---

## Data Structure (`data/data.json`)

The primary data store organizes data into 5 top-level collections:
* `departments`: Academic departments (`id`, `name`, `code`, `createdAt`).
* `academicYears`: Reporting cycles (`id`, `yearLabel`, `isActive`, `createdAt`).
* `users`: User accounts (`id`, `username`, `passwordHash`, `fullName`, `role`, `departmentId`, `createdAt`).
* `reports`: Report submissions (`id`, `departmentId`, `academicYearId`, `status`, `feedback`, `submittedAt`, `createdBy`).
* `reportSections`: Modular report sections (`id`, `reportId`, `sectionName`, `sectionData`, `updatedAt`).

---

## Running the Application

### 1. Start Interactive CLI
```bash
npm start
```

### 2. Run Test Suites
```bash
# Run complete test suite (storage, auth, ui)
npm test

# Run individual test suites
npm run test:auth
npm run test:storage
npm run test:ui
```