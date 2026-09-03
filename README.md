# Panorama - Annual Report Portal

A lightweight, terminal-based Annual Report Portal for academic departments built with **Node.js** and **JSON file storage**.

## Project Architecture (Phase 1)

* **Runtime:** Node.js (uses built-in `fs/promises` and `path` modules)
* **Storage Engine:** JSON File Storage (`data/data.json`)
* **Dependencies:** Zero external production dependencies
* **User Interface:** Terminal / CLI application

---

## Data Model Structure (`data/data.json`)

The primary data store organizes data into 5 top-level collections:

1. **`departments`**: Academic departments (`id`, `name`, `code`, `createdAt`).
2. **`academicYears`**: Reporting cycles (`id`, `yearLabel`, `isActive`, `createdAt`).
3. **`users`**: System user accounts (`id`, `username`, `passwordHash`, `fullName`, `role` (`ADMIN` | `DEPARTMENT_USER`), `departmentId`, `createdAt`).
4. **`reports`**: Annual report submissions (`id`, `departmentId`, `academicYearId`, `status` (`DRAFT` | `SUBMITTED` | `APPROVED` | `REJECTED`), `feedback`, `submittedAt`, `createdBy`, `createdAt`, `updatedAt`).
5. **`reportSections`**: Modular sections for each report (`id`, `reportId`, `sectionName`, `sectionData`, `updatedAt`).

---

## Getting Started

### 1. Installation

No database installation is required! Clone the repository and run:

```bash
npm install
```

### 2. Run the Application

```bash
npm start
```

### 3. Run Storage Persistence Tests

```bash
npm run test:storage
```

---

## Storage Module API (`src/storage.js`)

* `readData()`: Reads and returns the complete application state object from `data/data.json`. Automatically initializes the file with default seed data if it does not exist.
* `writeData(data)`: Serializes and writes the data object back to `data/data.json` with 2-space indentation for human readability.
* `resetData()`: Resets `data/data.json` back to default seed data.