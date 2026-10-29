# NPL Season 3 Office Tracker 🏏

A simple, fast, and attractive static website built with pure HTML, CSS, and vanilla JavaScript (no build step, no framework, no npm) for office teams to track the **Nepal Premier League (NPL) Season 3**. 

Each team member is assigned one NPL franchise. All standings, match results, and scores are read directly from a **published Google Sheet (CSV)** or bundled local sample data.

---

## ⚡ Core Principle: Display Only, No Computation
The website **does not calculate points, positions, NRR, form, or standings**. Every number and ranking comes straight from the Google Sheet exactly as entered. The code strictly parses CSV rows, joins team owner names from the `Teams` tab, groups matches by date, and formats the UI.

---

## 🌟 Key Features
- **Modern Sports Dashboard**: Dark theme by default with a quick Light theme toggle (persisted in `localStorage`, respects `prefers-color-scheme`).
- **Latest Match Day Results**: Automatically detects and displays the latest completed match day with scores, status badges (`Completed`, `Upcoming`, `Tie`, `No Result`), winner highlights, and result notes.
- **Match Day Navigator**: Easily browse past and upcoming match days using date dropdown or `<` / `>` buttons.
- **Points Table**: Sticky header, responsive layout, playoff qualification zone highlighting (top N teams), and visual form guide dots (`W`, `L`, `T`, `NR`).
- **Member / Owner Leaderboard**: Compact ranking grid featuring office members, their assigned team, points, and standings.
- **Zero Secrets & API Keys**: Connects directly to Google Sheets published to the web as CSV via `fetch()`.
- **Stale-While-Revalidate Caching**: Shows cached data from `localStorage` immediately on page load, fetches fresh data in the background, auto-refreshes every 5 minutes, and busts Google Sheets CDN cache.
- **Sample Mock Mode**: Works straight out of the box with realistic sample data before connecting a Google Sheet.

---

## 📁 Project Structure

```text
/
├── index.html              # Main HTML5 shell (accessible, semantic, mobile-first)
├── css/
│   └── styles.css          # CSS variables, dark/light themes, sports dashboard UI
├── js/
│   ├── config.js           # Sheet URLs, playoff spots, refresh interval, sample toggle
│   ├── data.js             # RFC 4180 CSV parser, fetch, localStorage cache, data joining
│   ├── ui.js               # Safe DOM rendering (zero raw innerHTML with sheet data)
│   └── app.js              # State management, auto-refresh, theme sync, bootstrap
├── sample-data/
│   ├── teams.csv           # 8 NPL teams, short codes, office owners, colors
│   ├── matches.csv         # 10 matches across 5 days (Completed, Tie, No Result, Scheduled)
│   ├── standings.csv       # Points table with pos, P, W, L, NR/T, Pts, NRR, Form
│   └── config.csv          # Optional season title, update timestamp, playoff spots
├── assets/
│   └── favicon.svg         # SVG cricket ball & trophy icon
└── README.md               # Complete documentation and setup guide
```

---

## 🚀 Quick Start (Running Locally)

Because ES modules (`import`/`export`) and `fetch()` require a web server:

1. Clone or download this repository.
2. Open a terminal in the project directory:
   ```bash
   cd c:\Users\Aayush\Desktop\OFFICE\NPL
   ```
3. Start a simple local server using Python (built into Windows, macOS, and Linux):
   ```bash
   python -m http.server 8000
   ```
   *(Or with Node: `npx serve .`)*
4. Open your browser at:
   ```text
   http://localhost:8000
   ```
The app will immediately load in **Sample Mode** using the bundled CSV files in `/sample-data/`.

---

## 📊 Google Sheets Setup Guide

To power the website from your own Google Sheet:

### Step 1: Create a Google Spreadsheet with 4 Tabs

Create a new Google Sheet and create tabs with the exact column headers below:

#### Tab 1: `Teams`
| team_name | short_code | owner_name | team_color | logo_url |
| :--- | :--- | :--- | :--- | :--- |
| Kathmandu Gurkhas | KG | Bishesh Shah | #DC2626 | https://... (optional) |
| Biratnagar Kings | BK | Prayatna Dhakal | #2563EB | |
| Janakpur Bolts | JB | Asmita Sedhai | #EA580C | |
| Pokhara Avengers | PA | Sunil Tandukar | #0284C7 | |
| Chitwan Rhinos | CR | Sudarshan Kapali | #16A34A | |
| Sudurpaschim Royals | SR | Aayush Maharjan | #7C3AED | |
| Karnali Yaks | KY | Sagar Koirala | #B45309 | |
| Lumbini Lions | LL | Chandan Baishbaniya | #E11D48 | |

> **Tips:**
> - `team_color` must be a hex code (e.g. `#DC2626`). If left blank, the app generates a deterministic color from the team name.
> - `logo_url` is optional. If left blank, an avatar circle with the team's `short_code` is displayed.

#### Tab 2: `Matches`
| match_no | date | team1 | team2 | team1_score | team2_score | winner | result_note | status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 2026-10-24 | Biratnagar Kings | Janakpur Bolts | 127/10 (19.4) | 131/2 (15.3) | Janakpur Bolts | Janakpur Bolts won by 8 wickets | Completed |
| 2 | 2026-10-24 | Chitwan Rhinos | Kathmandu Gurkhas | 165/7 (20.0) | 166/5 (19.2) | Kathmandu Gurkhas | Kathmandu Gurkhas won by 5 wickets | Completed |
| 3 | 2026-10-25 | Sudurpaschim Royals | Lumbini Lions | 174/6 (20.0) | 174/8 (20.0) | | Match tied (SR won 1-over eliminator) | Tie |
| 4 | 2026-10-25 | Pokhara Avengers | Karnali Yaks | 182/4 (20.0) | 158/9 (20.0) | Pokhara Avengers | Pokhara Avengers won by 24 runs | Completed |
| 5 | 2026-10-26 | Chitwan Rhinos | Janakpur Bolts | 45/2 (5.1) | - | | Match abandoned due to rain | No Result |
| 9 | 2026-10-28 | Janakpur Bolts | Kathmandu Gurkhas | | | | Scheduled for 09:15 NPT | Scheduled |

> **Notes on Matches:**
> - `date`: Format as `YYYY-MM-DD`.
> - `scores`: Free text, displayed as-is (e.g. `165/7 (20.0)`).
> - `status`: Choose from `Completed`, `Scheduled`, `Tie`, `No Result`.
> - `winner`: Team name matching the winner. Leave blank for `Tie`, `No Result`, or `Scheduled`.
> - `result_note`: Free text summary.

#### Tab 3: `Standings`
| pos | team | played | won | lost | nr_tie | points | nrr | form |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Lumbini Lions | 1 | 1 | 0 | 0 | 2 | +4.599 | W |
| 2 | Karnali Yaks | 1 | 1 | 0 | 0 | 2 | +0.950 | W |
| 3 | Chitwan Rhinos | 1 | 1 | 0 | 0 | 2 | +0.400 | W |
| 4 | Sudurpaschim Royals | 2 | 1 | 1 | 0 | 2 | -1.430 | LW |
| 5 | Biratnagar Kings | 1 | 0 | 1 | 0 | 0 | -0.400 | L |
| 6 | Janakpur Bolts | 1 | 0 | 1 | 0 | 0 | -0.950 | L |
| 7 | Pokhara Avengers | 1 | 0 | 1 | 0 | 0 | -1.544 | L |
| 8 | Kathmandu Gurkhas | - | - | - | - | 0 | - | |

> **Notes on Standings:**
> - All numbers and rankings are displayed exactly as typed.
> - `form`: String of match results (e.g. `WW`, `WWLNW`). `W` renders green, `L` red, `T` amber, `N` gray.

#### Tab 4 (Optional): `Config`
| key | value |
| :--- | :--- |
| season_name | NPL Season 3 - Office Edition |
| last_updated_text | Oct 28, 2026 • 18:30 NPT |
| playoff_spots | 4 |
| office_group_name | FinTech & Engineering Team |

---

### Step 2: Publish Each Tab as CSV

1. In your Google Sheet, click **File > Share > Publish to web**.
2. Under the **Link** tab:
   - Change **Entire Document** to **Teams**.
   - Change **Web page** to **Comma-separated values (.csv)**.
   - Click **Publish** and copy the generated URL.
3. Repeat the exact same step for **Matches**, **Standings**, and **Config** (select each tab and choose Comma-separated values).

---

### Step 3: Paste URLs into `js/config.js`

Open [js/config.js](file:///c:/Users/Aayush/Desktop/OFFICE/NPL/js/config.js) in your editor:

```javascript
export const CONFIG = {
  // 1. Switch to live data mode:
  USE_SAMPLE_DATA: false,

  // 2. Paste your published CSV links:
  SHEET_URLS: {
    TEAMS: 'https://docs.google.com/spreadsheets/d/e/.../pub?gid=0&single=true&output=csv',
    MATCHES: 'https://docs.google.com/spreadsheets/d/e/.../pub?gid=123456&single=true&output=csv',
    STANDINGS: 'https://docs.google.com/spreadsheets/d/e/.../pub?gid=789012&single=true&output=csv',
    CONFIG: 'https://docs.google.com/spreadsheets/d/e/.../pub?gid=345678&single=true&output=csv'
  },
  ...
};
```

Save the file and refresh your browser. Your tracker is now live!

---

## 🌐 Deploying to GitHub Pages (Step by Step)

Because the project uses relative paths and pure static files, deploying to GitHub Pages takes under two minutes:

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Initialize NPL Season 3 Office Tracker"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** > **Pages** (under "Code and automation" in the left sidebar).
   - Under **Build and deployment**:
     - **Source**: Select `Deploy from a branch`.
     - **Branch**: Select `main` and folder `/ (root)`.
     - Click **Save**.
3. Within 1–2 minutes, GitHub Pages will deploy your site at:
   ```text
   https://<your-username>.github.io/<repo-name>/
   ```
4. Share the link in your office Slack / Teams / WhatsApp group!

---

## 🔄 Daily Workflow: Updating Results & Standings

After each match day:
1. Open your Google Sheet.
2. In the `Matches` tab:
   - Enter `team1_score`, `team2_score`, `winner`, and `result_note`.
   - Update `status` to `Completed` (or `Tie` / `No Result`).
3. In the `Standings` tab:
   - Update `played`, `won`, `lost`, `nr_tie`, `points`, `nrr`, and `form`.
   - Re-order rows if positions have changed (or update the `pos` column).
4. *(Optional)* In the `Config` tab, update `last_updated_text` (e.g. `Oct 29, 2026 • 21:00 NPT`).
5. **No need to touch code or push to Git!**
   - Google Sheets automatically reflects edits in published CSVs.
   - Any team member viewing the site will see the updates on their next refresh or automatic 5-minute cycle.

---

## 💡 Pro Tip: Auto-Filling Standings with Google Sheet Formulas

If you don't want to type numbers manually into the `Standings` tab, you can use built-in Google Sheets formulas referencing the `Matches` tab:

- **Played ($P$)**:
  ```excel
  =COUNTIFS(Matches!$C$2:$C$100, B2, Matches!$I$2:$I$100, "<>Scheduled") + COUNTIFS(Matches!$D$2:$D$100, B2, Matches!$I$2:$I$100, "<>Scheduled")
  ```
- **Won ($W$)**:
  ```excel
  =COUNTIF(Matches!$G$2:$G$100, B2)
  ```
- **NR / Tie ($NR/T$)**:
  ```excel
  =COUNTIFS(Matches!$C$2:$C$100, B2, Matches!$I$2:$I$100, "Tie") + COUNTIFS(Matches!$D$2:$D$100, B2, Matches!$I$2:$I$100, "Tie") + COUNTIFS(Matches!$C$2:$C$100, B2, Matches!$I$2:$I$100, "No Result") + COUNTIFS(Matches!$D$2:$D$100, B2, Matches!$I$2:$I$100, "No Result")
  ```
- **Points ($Pts$)**:
  ```excel
  =(Won * 2) + (NR_Tie * 1)
  ```
Because our website renders the Standings tab **as-is**, you get the best of both worlds: formulas manage the calculations in the sheet, and the website cleanly presents the results without complex client-side math.

---

## 🛠️ Alternative Architectures (For Reference)

This project intentionally implements the **Published CSV** approach for simplicity and zero repo secrets. Here is a brief look at the alternative approaches:

1. **Google Sheets API v4 with a Restricted API Key**:
   - *How it works*: Use Google Cloud Console to create an API key restricted to Google Sheets API and your GitHub Pages domain.
   - *Trade-off*: Works well, but exposes the API key in client code and requires Google Cloud project setup and quota management.
2. **Scheduled GitHub Action Pulling Sheet & Committing `data.json`**:
   - *How it works*: A GitHub Actions workflow runs every 10–15 minutes (or via repository dispatch webhook), downloads the sheet, and writes a static `data.json` into the repository.
   - *Trade-off*: Extremely robust, eliminates CORS and Google Sheets CDN latency, but updates are not instantaneous and consume GitHub Action minutes.

The data layer in this project is cleanly isolated in `js/data.js`, so you can easily swap the fetch mechanism in the future if your requirements evolve.

---

## 🛡️ Security & Performance
- **Zero XSS**: All values from CSVs are inserted into the DOM strictly via `textContent` and element creation helpers—never raw string `innerHTML`.
- **Zero Dependencies**: Lightweight RFC 4180 CSV parser built directly into JavaScript.
- **Mobile-First & Accessible**: Tested down to 360px viewport, semantic HTML, ARIA attributes, and accessible keyboard navigation.

