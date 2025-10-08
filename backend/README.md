# Backend (Express + MongoDB)

This folder contains the backend API for the Crypto Portfolio app. It's a Node/Express application that exposes endpoints for authentication, wallets, transactions and notifications backed by MongoDB.

Prerequisites
- Node.js (>=14)
- MongoDB (local or remote Atlas)

Quick start (development)

1. Install dependencies:

```powershell
cd backend
npm install
```

2. Create a `.env` file in `backend/` with these variables:

```
MONGODB_URI=mongodb://localhost:27017/crypto-portfolio
JWT_SECRET=your_jwt_secret_here
EMAIL_USER=you@example.com
EMAIL_PASS=your-email-password
```

3. Run the server:

```powershell
npm start
# or for automatic reload during development
npm run dev
```

The server will run on the port defined inside `server.js` (commonly `process.env.PORT || 5000`).

API notes
- The backend exposes routes under `/api` (see `backend/routes/`).
- Protected endpoints require a Bearer token set in `Authorization` header.

Testing from a mobile device
- If you want to call this backend from a phone (while testing the frontend on mobile), make sure the backend listens on all interfaces and your PC firewall allows the port.
- Start with `HOST=0.0.0.0` if applicable or use a public tunnel like `ngrok`.

Deployment
- Use a process manager (pm2) or host on a platform such as Render, Heroku, Railway or a VM.
- Set the same environment variables on the host and connect to a managed MongoDB (Atlas).

Troubleshooting
- If you see CORS issues, check `server.js` and ensure CORS is configured to allow your frontend origin.
- For auth errors, verify your `JWT_SECRET` is the same between services (or regenerated intentionally).
