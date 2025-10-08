# Frontend Guide

Location: `my-app/`

Structure
- `src/pages` — page-level components (Dashboard, Wallet, Transactions, etc.)
- `src/components` — reusable UI components
- `src/services/api.js` — axios wrapper used for backend calls

Key files
- `src/pages/Transactions.js` — the transaction UI (send & received flows). Adjust styles and behavior here.
- `src/services/api.js` — set the API base URL (use your machine IP for mobile testing)

Running locally

```powershell
cd my-app
npm install
npm start
```

Mobile testing notes
- See `my-app/README.md` for instructions to view the frontend on a phone using the local network or a tunnel.

Tips for changing API base URL
- Set an environment variable REACT_APP_API_BASE when starting, e.g.

```powershell
set "REACT_APP_API_BASE=http://192.168.1.12:5000"; npm start
```

This value can be read in `src/services/api.js`:

```js
const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
```
