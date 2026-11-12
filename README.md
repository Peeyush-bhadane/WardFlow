# WardFlow 🏥

> Clinical workflow and surveillance web application for a 74-bed virus quarantine centre.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](https://opensource.org/licenses/MIT)

---

## 📋 The Problem Solved

In high-pressure virus quarantine centres, temperatures are traditionally recorded on paper journals, creating severe coordination bottlenecks:
- **Double Measurements & Missed Patients**: Nobody knows who has already been measured today.
- **Premature Doctor Rounds**: Physicians visit patients before morning vitals are taken.
- **Delayed Discharges**: Difficulty tracking consecutive fever-free days accurately.
- **Delayed Mortality Tracking**: No live monitoring against the facility's **15% mortality benchmark**.

**WardFlow** replaces journals with a deterministic state machine: **"Today's Board"**. Each active patient holds exactly one status per calendar day:
$$\text{Temp pending (Grey)} \longrightarrow \text{Temp done (Blue)} \longrightarrow \text{Doctor visited (Green)}$$

---

## ✨ Key Features & Business Rules

### 1. "Today's Board" State Machine
- **Nurse View**: Real-time counter (e.g. `Temps done 12 / 25`), search filter, and mobile-first 48px tap targets.
- **Measured rows are visually muted** to keep pending patients prominent.
- **Duplicate Prevention**: If a reading is already recorded today, the system displays *"Already measured at 09:10 by Nurse Priya"* and blocks secondary measurements.

### 2. Clinical Temperature Validation
- Big numeric input with rapid bedside temperature presets (36.5 °C to 40.0 °C).
- **Valid Range**: $34.0\text{ }^\circ\text{C}$ to $43.0\text{ }^\circ\text{C}$ (outside values trigger *"Please check the value"*).
- **Critical Alert**: Readings $\ge 40.0\text{ }^\circ\text{C}$ display a high-priority red alert: *"Critical, inform doctor"*.

### 3. Doctor Consultation & Queue Prioritization
- **3 Dynamic Tabs**:
  - **Ready for me**: Patients with temperatures recorded today, sorted by **highest temperature first** (severity-ranked).
  - **Not measured yet**: Patients pending nurse vitals.
  - **Seen today**: Patients completed for the day.
- **Visit Gatekeeper**: *"Mark visited"* is strictly disabled with *"Temperature not taken yet"* if morning vitals have not been logged.
- **Temperature Trend Curve**: Recharts line graph showing 4-day temperature history with a dashed **$38.0\text{ }^\circ\text{C}$ Fever Threshold line**.

### 4. 3-Day Fever-Free Streak Rule
- Consecutive calendar days where the daily maximum reading is $< 38.0\text{ }^\circ\text{C}$.
- Any fever ($\ge 38.0\text{ }^\circ\text{C}$) or missing calendar reading **resets the streak to 0**.
- **Discharge Eligibility**: Unlocked strictly when the streak reaches **3 days**.

### 5. Facility Operations & Bed Management (74 Beds)
- Fixed capacity of **74 beds** (`A-01` to `A-37`, `B-01` to `B-37`).
- **Patient Intake**: Automatically finds and assigns the first unoccupied bed. Displays *"No beds free"* if at 74/74 capacity.
- **Discharge Queue**: Lists doctor-confirmed patients. Marking as discharged frees the bed code and archives the case as `Cured`.

### 6. Head Doctor Surveillance & 15% Mortality Benchmark
- **Mortality Gauge**:
  $$\text{Mortality Rate} = \frac{\text{Deceased}}{\text{Cured} + \text{Deceased}}$$
  - **Normal**: $< 12\%$ (Green)
  - **Amber Warning**: $12\% \text{ to } 15\%$
  - **Red Alert**: $> 15\%$ (exceeds benchmark line)
  - **Data Confidence**: Displays *"Not enough data"* if fewer than 20 cases have closed.
- **Capacity Utilization**: Occupancy $X / 74$ beds with visual bar.
- **Average Stay**: Computed across all completed patient records.
- **Missed Today Audit**: Real-time table of patients missing morning vitals or physician visits.

### 7. Simulation Control: "Advance to Next Day"
- Built-in demo button in the top bar to advance the simulation by $+1$ calendar day.
- Daily statuses reset back to `Temp pending` while preserving temperature histories, allowing instant verification of the 3-day streak rule.

---

## 👥 Staff Roles (Demo Personas)

Switch between profiles instantly via the top bar **"Switch role"** button (no passwords required):

| Persona | Role | Primary Scope |
| :--- | :--- | :--- |
| **Nurse Priya Sharma** | Nurse | Today's Board, rapid bedside temperature recording |
| **Dr. Rajesh Verma** | Doctor | Priority queue, patient charts, visit sign-off, discharge confirmation |
| **Amit Patel** | Administrator | Patient intake (74 beds), administrative discharge |
| **Dr. Sunita Rao** | Head Doctor | Facility surveillance, mortality gauge, protocol completion audits |

---

## 🎨 Clinical Design System

Designed specifically for calm clinical focus:
- **Background**: `#F7F6F2`
- **Cards**: `#FFFFFF`
- **Borders**: `#E3E1DA`
- **Primary Text**: `#1C2A33`
- **Secondary Text**: `#5B6B75`
- **Primary Teal**: `#0F6B6B`
- **Status Colors**: Grey `#8A949B`, Blue `#2F6FA8`, Green `#2E7D4F`, Amber `#C98A1B`, Red `#B3372E` (with light tints for chips)
- **Typography**: IBM Plex Sans with dense tabular presentation and 6px border radii.
- **Rules**: Zero gradients, zero glows, zero heavy shadows, no emojis (Lucide icons only).

---

## 📁 Project Architecture

```
├── app/
│   ├── globals.css            # Clinical CSS variables and dense table styling
│   ├── layout.tsx             # Root layout with IBM Plex Sans font setup
│   └── page.tsx               # Main container with role-based routing
├── components/
│   ├── AdminView.tsx          # Intake form (first free bed) & discharge list
│   ├── DashboardView.tsx      # Mortality gauge, occupancy, missed list
│   ├── DoctorQueue.tsx        # 3-tier queue (highest temp first)
│   ├── NurseBoard.tsx         # Today's board list, search, completion counter
│   ├── PatientDetailModal.tsx # Recharts curve, 38°C threshold, streak badge
│   ├── RecordTempModal.tsx    # Big °C input, validation, duplicate guard
│   ├── RoleSwitcherModal.tsx  # 4 Demo User selector
│   ├── StatusChip.tsx         # Daily state machine chips
│   └── TopBar.tsx             # Facility stats, date indicator, "Advance to next day"
├── lib/
│   ├── rules.ts               # Pure business functions (streaks, validation, mortality)
│   ├── store.ts               # Single localStorage store with 25 Indian patient seed data
│   ├── types.ts               # TypeScript domain interfaces
│   └── useWardStore.ts        # React hook for reactive client hydration
├── declarations.d.ts          # CSS module typing
├── next.config.mjs            # Next.js configuration
├── tailwind.config.ts         # Clinical palette & theme tokens
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or 20.x or 22.x
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/wardflow.git

# Navigate into the project folder
cd wardflow

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Building for Production

```bash
npm run build
npm run start
```

---

## 🌐 Deploy to Vercel

WardFlow is frontend-only and requires **no environment variables or external databases**:

1. Push your repository to **GitHub**.
2. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository.
4. Leave all default build settings (`Next.js`, build command: `npm run build`, output: `.next`).
5. Click **Deploy**.

---

## 📄 License

This project is licensed under the MIT License.
