<p align="center">
  <h1 align="center">📊 Excel Starter Kit v2</h1>
  <p align="center">
    <strong>A full-stack React + SQLite toolkit for building data-heavy internal apps</strong><br>
    <em>Excel-like grid • Keyboard shortcuts • Smart Import • Audit Trail • Bilingual (EN/हिंदी)</em>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/React-18-61dafb?logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/SQLite-3-003b57?logo=sqlite" alt="SQLite" />
    <img src="https://img.shields.io/badge/Vite-5-646cff?logo=vite" alt="Vite" />
    <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
  </p>
</p>

---

## ✨ What is this?

**Excel Starter Kit v2** is a production-ready template for building data management apps. Think of it as a self-hosted, customizable alternative to Airtable or Google Sheets — but with full keyboard-driven Excel-like editing, offline SQLite storage, and zero subscription fees.

Built for Indian businesses and government offices that need robust data tools with Hindi language support.

---

## 🚀 Features

### 📊 GenericDataGrid (the star component)
| Feature | Description |
|---------|-------------|
| ⚡ Virtual Scrolling | Handles 100K+ rows smoothly via `@tanstack/react-virtual` |
| ⌨️ Excel Keyboard Nav | Arrow keys, Tab, Enter, F2, Home/End, Page Up/Down, Ctrl+Arrows |
| ✏️ Inline Cell Editing | Text, number, currency, date — with autocomplete from master data |
| 📋 Copy / Paste | Ctrl+C, Ctrl+V — clipboard integration |
| ⬇️ Fill Down | Ctrl+D — copies value from cell above |
| 📌 Frozen Columns | Pin 1-3 columns to stay visible while scrolling |
| 🔍 Find & Replace | Ctrl+F / Ctrl+H with match highlighting |
| ↩️ Undo / Redo | Ctrl+Z / Ctrl+Y with full history stack |
| 📏 Column Resize | Drag to resize, double-click to auto-fit |
| 🎨 Conditional Formatting | Negative numbers (red), large amounts (green), status keywords (color-coded) |
| 🔽 Sorting & Filtering | Click headers to sort, per-column filter inputs |
| ☑️ Row Selection | Checkbox + Space bar + Ctrl+A, with bulk delete |
| 📤 Export | Excel (.xlsx) and PDF with one click |
| 🖨️ Print Preview | Full print preview with title customization |

### 🏗️ Full-Stack Architecture
| Layer | Tech | Highlights |
|-------|------|------------|
| **Frontend** | React 18 + TypeScript + Vite | Shadcn/ui, Sonner toasts, cmdk palette |
| **Backend** | Express.js + TypeScript | RESTful API, auto-migration |
| **Database** | SQLite (better-sqlite3) | Zero config, file-based, portable |
| **State** | Zustand | Lightweight, no boilerplate |

### 📦 Built-in Modules
- **🔍 Global Search** — Search across all tables instantly
- **⌘ Command Palette** — VS Code-style Ctrl+K command launcher
- **📊 Dashboard** — Charts and summary statistics
- **📥 Smart Import** — Drag-and-drop CSV/Excel import with column mapping
- **📜 Audit Trail** — Who changed what, when (full change log)
- **📁 Documents Hub** — File attachments per record
- **📋 Mini Workbooks** — Saved filtered views (like Excel named ranges)
- **✅ Data Validator** — Automated data quality checks
- **🏥 Field Health** — Column completeness analysis
- **💾 Backup Manager** — One-click database backup/restore
- **⚙️ Settings** — Theme, language, app config
- **🧘 Wisdom Overlay** — Motivational quotes (EN + Hindi)
- **📊 Status Bar** — Record count, sum, last saved (Excel-style)
- **⌨️ Keyboard Shortcuts Page** — Full shortcut reference (F1)

### 🌐 Bilingual Support
Every label supports **English** and **Hindi (हिंदी)** — toggle anytime from Settings.

---

## 🗂️ Project Structure

```
excel-starter-kit-v2/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── GenericDataGrid.tsx   # ⭐ The data grid
│   │   │   ├── AutocompleteInput.tsx # Smart cell editor
│   │   │   ├── CommandPalette.tsx    # Ctrl+K launcher
│   │   │   ├── GlobalSearch.tsx      # Cross-table search
│   │   │   ├── PrintPreview.tsx      # Print with title
│   │   │   ├── StatusBar.tsx         # Excel-like status bar
│   │   │   ├── TopNav.tsx            # Navigation
│   │   │   └── WisdomOverlay.tsx     # Motivational overlay
│   │   ├── pages/           # Route pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── SmartImport.tsx
│   │   │   ├── AuditTrail.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── ... (15 pages)
│   │   ├── store/           # Zustand state
│   │   └── hooks/           # Export utilities
│   └── package.json
├── server/                  # Express backend
│   ├── src/
│   │   ├── db/
│   │   │   └── schema.sql   # Full schema + sample data
│   │   ├── routes/          # 13 API route modules
│   │   └── index.ts         # Server entry
│   └── package.json
├── Start_Generic_v2.bat     # One-click Windows launcher
├── package.json             # Root orchestrator
└── .gitignore
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js 18+** — [Download](https://nodejs.org)
- **npm** (comes with Node.js)

### Setup

```bash
# Clone the repo
git clone https://github.com/ccvarun/excel-starter-kit-v2.git
cd excel-starter-kit-v2

# Install all dependencies (root + client + server)
npm run install:all

# Start development server
npm run dev
```

The app will open at **http://localhost:5173** with the API on port **4000**.

### Windows Users
Just double-click **`Start_Generic_v2.bat`** — it handles everything automatically.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Arrow Keys` | Navigate between cells |
| `Enter` / `F2` | Start editing cell |
| `Tab` / `Shift+Tab` | Move to next/previous cell |
| `Ctrl+C` | Copy cell value |
| `Ctrl+V` | Paste into cell |
| `Ctrl+D` | Fill down (copy from above) |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+F` | Find & Replace |
| `Ctrl+A` | Select all rows |
| `Ctrl+K` | Command Palette |
| `Space` | Toggle row selection |
| `Delete` | Delete selected rows |
| `Home` / `End` | Jump to first/last column |
| `Ctrl+Home` / `Ctrl+End` | Jump to first/last cell |
| `F1` | Keyboard shortcuts page |

---

## 🗄️ Database Schema

The kit ships with 4 demo tables (easily customizable):

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `items` | Inventory/assets | name, category, status, amount, quantity |
| `transactions` | Financial records | ref_no, party_name, amount, payment_status |
| `tasks` | Task management | title, priority, status, assigned_to |
| `contacts` | People/vendors | name, company, email, phone, GST |

Plus supporting tables: `change_log` (audit), `masters` (dropdowns), `settings`, `mini_workbooks`, `documents`, `alerts`, `wisdom_points`.

---

## 🎨 Customization

### Adding a New Table

1. **Add schema** in `server/src/db/schema.sql`
2. **Add API route** in `server/src/routes/` (copy `genericTable.ts` as template)
3. **Add page** in `client/src/pages/` (use `DataTable.tsx` as template)
4. **Add route** in `client/src/App.tsx`

The `GenericDataGrid` component works with any data shape — just pass `columns` and `data`.

### Theming

Toggle dark/light mode from Settings. CSS variables in `index.css` control all colors.

---

## 📄 License

MIT — use it for anything. See [LICENSE](./LICENSE) for details.

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🙏 Acknowledgements

- [React](https://react.dev) — UI framework
- [Vite](https://vitejs.dev) — Build tool
- [Shadcn/ui](https://ui.shadcn.com) — Component primitives
- [TanStack Virtual](https://tanstack.com/virtual) — Virtual scrolling
- [Zustand](https://github.com/pmndrs/zustand) — State management
- [Sonner](https://sonner.emilkowal.dev) — Toast notifications
- [cmdk](https://cmdk.paco.me) — Command palette
- [Lucide](https://lucide.dev) — Icons
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — SQLite driver
- [ExcelJS](https://github.com/exceljs/exceljs) — Excel export
- [jsPDF](https://github.com/parallax/jsPDF) — PDF generation

---

<p align="center">
  <strong>Built with ❤️ for Indian businesses & developers</strong><br>
  <em>If this helps you, give it a ⭐!</em>
</p>
