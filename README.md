# Non-Automatic Weighing Instrument (NAWI) Test Report Generator

An automated, browser-based **OIML R 76-1: 2006** Type-Evaluation Test Report Generator designed for Legal Metrology Laboratories and Verification Officers. Replaces manual spreadsheet-based test reporting with automated metrological calculations, real-time tolerance validation, instant PDF/Word export, and a searchable report repository.

---

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, Multer
- **Database**: SQLite (via Node's built-in `node:sqlite` — zero native C++ compilation required, runs seamlessly on Windows/macOS/Linux)
- **PDF Generation**: Client-side `jspdf` & `jspdf-autotable`
- **Word Export**: Client-side `docx` & `file-saver`
- **Authentication**: JWT-based role authentication with **Tester** and **Admin** access control
- **Zero Cloud / Zero Docker**: Runs out-of-the-box with `npm install && npm run dev`

---

## Quickstart Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database (Creates Admin, Tester, & Sample Completed Report)
```bash
npm run seed
```

### 3. Launch Development Server
```bash
npm run dev
```

Both backend (port 5001) and frontend (port 3000) will start concurrently.
Open your browser at: **`http://localhost:3000`**

---

## Default User Accounts

The database comes pre-seeded with two legal metrology roles:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Tester** | `tester@metrology.lab` | `tester123` | Create and edit own test reports, save drafts, export PDF/DOCX |
| **Admin** | `admin@metrology.lab` | `admin123` | Access and filter all laboratory reports, manage metrologist user accounts |

> **Tip:** The login screen and navigation bar include fast-click buttons to instantly switch between Tester and Admin profiles for evaluation convenience.

---

## OIML R 76 Metrological Logic Implemented

### 1. Verification Scale Intervals
- Scale verification interval: $n = \text{Max} / e$
- Permissible ranges enforced per Accuracy Class:
  - **Class I (Special)**: $n \ge 50\,000$
  - **Class II (High)**: $100 \le n \le 100\,000$
  - **Class III (Medium)**: $100 \le n \le 10\,000$
  - **Class IIII (Ordinary)**: $100 \le n \le 1\,000$

### 2. Maximum Permissible Error (mpe) — Table 6
Where $m = \text{Load} / e$ (load in multiples of $e$):
- **Class III (Medium)**:
  - $0 \le m \le 500e$: $\text{mpe} = \pm 0.5e$
  - $500e < m \le 2000e$: $\text{mpe} = \pm 1.0e$
  - $m > 2000e$: $\text{mpe} = \pm 1.5e$
- **Class II (High)**:
  - $0 \le m \le 5000e$: $\text{mpe} = \pm 0.5e$
  - $5000e < m \le 20000e$: $\text{mpe} = \pm 1.0e$
  - $m > 20000e$: $\text{mpe} = \pm 1.5e$
- **Class I & Class IIII**: Dynamically calculated using generic Table 6 thresholds.

### 3. Compliance Criteria
- **Indicated Error**: $E = I - L$ (Indicated Value − Applied Load). Row passes if $|E| \le \text{mpe}$.
- **Eccentricity Test (Positions 1 to 5)**: Evaluated at $1/3 \text{Max}$. Requires $|E| \le \text{mpe}$ AND Deviation from Center reading $|\Delta| \le \text{mpe}$.
- **Repeatability Test (5 Cycles)**: Range $(\text{Max reading} - \text{Min reading}) \le \text{mpe}$ for the applied test load.
- **Overall Verdict**: **PASS** if and only if every single test item satisfies the respective tolerances; otherwise **FAIL**.

---

## Features Walkthrough

1. **Multi-Step Wizard with Real-Time Draft Auto-Save**:
   - **LocalStorage Auto-Save**: Automatically persists all wizard form state in browser `localStorage` keyed by `reportId` (`nawi_draft_${reportId}` and direct key).
   - **Exact Field Restoration**: When re-opening a draft (either fresh evaluation or existing saved report), all fields across all 4 steps (instrument specs, environmental readings, zero/tare, eccentricity positions 1–5, increasing/decreasing weighing rows, repeatability runs, attachments, notes, and active step) are restored exactly.
   - **Step 1 (Instrument Details)**: Manufacturer, model, serial, capacity, verification interval $e$, accuracy class, type. Auto-calculates $n$.
   - **Step 2 (Environment)**: Laboratory name, date, temperature, humidity, tester name. Triggers real-time alerts if temperature is outside 15–35°C or humidity exceeds 80%.
   - **Step 3 (Observations)**: Dynamic rows for Zero-setting/Tare, Eccentricity (Positions 1–5), Weighing performance (Increasing and Decreasing), and Repeatability (5 runs). Auto-calculates error and mpe in real time.
   - **Step 4 (Attachments & Review)**: Upload photos of instrument and stamped data plates. Final validation checklist blocks submission if any required row is missing.
   - **Draft Reset / Clear**: Includes a trash/reset action to clear auto-saved drafts and reset fields to clean defaults when needed.
2. **One-Click Pre-Fill**:
   - "Pre-fill Demo Specs" and "Fill Compliant Test Readings" buttons allow instant creation of a realistic evaluation report in seconds.
3. **Official Printable Preview**:
   - Clean, formal layout formatted for A4 printing and auditing.
   - Distinct Pass/Fail badges, tables, and signature blocks for Testing Officer and Chief Metrologist.
4. **Export to PDF & Word**:
   - **Export PDF**: Generates vector PDF with formatted metrology tables, headers, and seals.
   - **Export Word (.docx)**: Creates editable Microsoft Word document with styled tables and color-coded verdicts.
5. **Dashboard & Repository**:
   - Dashboard with summary cards (Total, Completed, Draft, Failed) and report table.
   - Repository view with multi-parameter search (Model, Serial No, Class, Date Range) and direct download links.

---

## Project Structure

```
nawi-report-generator/
├── data/
│   └── nawi.db                  # Local SQLite database (auto-created)
├── uploads/                     # Stored instrument photos & plates
├── server/
│   ├── db.js                    # Database connection & sequence generator
│   ├── auth.js                  # JWT authentication & password hashing
│   ├── metrology.js             # OIML R 76 calculation & verification logic
│   ├── seed.js                  # Seed script with default users & sample report
│   └── index.js                 # Express REST API
├── src/
│   ├── components/
│   │   ├── ReportWizard/        # 4-step wizard components
│   │   ├── Dashboard.jsx        # Stats & reports table
│   │   ├── Repository.jsx       # Search & repository view
│   │   ├── ReportPreview.jsx    # Printable certificate layout
│   │   ├── AuthPage.jsx         # Sign in & registration
│   │   ├── Navbar.jsx           # Top navigation & role switcher
│   │   └── AdminUsersModal.jsx  # Admin user management
│   ├── context/
│   │   └── AuthContext.jsx      # Auth state provider
│   ├── utils/
│   │   ├── metrologyCalc.js     # Client-side OIML R 76 calculations
│   │   ├── pdfExport.js         # jsPDF certificate exporter
│   │   └── docxExport.js        # docx Word document exporter
│   ├── App.jsx                  # Main application router
│   ├── index.css                # Tailwind base & print rules
│   └── main.jsx                 # React root
├── package.json
├── vite.config.js
└── README.md
```

---

## License
MIT — Legal Metrology Testing Automation Suite.
