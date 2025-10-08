
# My App (Frontend)

React frontend for the Crypto Portfolio project. Built with Create React App.

Requirements
- Node.js (LTS recommended)
- npm

Setup & run (development)

```powershell
cd my-app
npm install
npm start
```

The app should open at http://localhost:3000 by default. If your setup uses a different port (e.g., 3001), your terminal will display the URL.

Expose the frontend to mobile on the same network

Option A — Local network (no extra tools)
1. Ensure your PC and phone are on the same Wi-Fi.
2. Start the dev server as above.
3. Find your PC local IP in PowerShell:

```powershell
ipconfig | Select-String 'IPv4' -Context 0,0
```

4. Open on your phone's browser:

```
http://<PC_IP>:3000
```

If CRA does not accept external connections, start with:

```powershell
set "HOST=0.0.0.0"; npm start
```

Option B — ngrok (tunnel)
```powershell
ngrok http 3000
```
Open the public https URL shown by ngrok on your phone.

API base URL
- The frontend calls your backend API via `src/services/api.js`. When testing from mobile, ensure that file points to your machine IP (or the public tunnel URL) instead of `localhost` so requests reach your backend.

Build for production

```powershell
npm run build
# deploy contents of my-app/build to your static host (Netlify, Vercel, GitHub Pages, etc.)
```

Troubleshooting
- If mobile cannot reach the dev server, check firewall rules and whether the phone is on the same subnet.
- If API requests fail from mobile, set the backend host in `src/services/api.js` to `http://<PC_IP>:<BACKEND_PORT>` and ensure backend is reachable.

Need help?
- If you want, I can:
	- Update `src/services/api.js` to automatically use your machine IP when on LAN.
	- Generate a one-line script in `package.json` to start with HOST bound to 0.0.0.0.

