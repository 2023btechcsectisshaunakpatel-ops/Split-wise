# Splitwise Web Application

A premium, interactive Single-Page Application (SPA) for tracking, splitting, and settling expenses with friends and groups. 

Built using a state-of-the-art dark/light glassmorphic UI design, pure JavaScript, Vanilla CSS, and Chart.js.

## Key Features

- **Dashboard**: High-level financial standing (Owed vs. Owe), categorical spending chart, and direct friend balances.
- **Active User Simulator**: A top-bar selection tool that lets you toggle who you are viewing the dashboard as. Toggling changes the perspective of who owes whom and shifts all values instantly.
- **Groups**: Create groups (e.g. Travel, Apartment) and add custom members.
- **Friends**: Track personal one-on-one balances.
- **Advanced Splits**:
  - **Equally**: Split evenly among selected members.
  - **Unequally (Exact amounts)**: Specify precise values for each person.
  - **Percentages**: Input percentages that must sum to exactly 100%.
- **Debt Simplification**: Integrates a greedy matching engine (simplification algorithm) to minimize the number of transactions needed to pay off group debts. Can be toggled on/off in real-time.
- **LocalStorage**: Syncs state automatically to the browser.
- **Theme Toggler**: Smooth dark and light mode styling.

## How to Run

1. Open `index.html` directly in any web browser.
2. Alternatively, run a static server from this directory:
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` (or the served port) in your browser.
