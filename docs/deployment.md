# Deployment Guide

This guide gives high level deployment suggestions for the backend and frontend.

Frontend
- Build:

```powershell
cd my-app
npm run build
```

- Deploy the `my-app/build` folder to any static host: Netlify, Vercel, GitHub Pages, or an S3+CloudFront setup.

Backend
- Use a service like Render, Railway, Heroku, DigitalOcean App Platform, or a VM.
- Use environment variables for `MONGODB_URI`, `JWT_SECRET`, and email creds.
- Use PM2 or the platform's process manager to keep the server running.

Database
- Use MongoDB Atlas (managed) in production and configure IP access and user credentials.

Notes
- Always set secure environment variables and avoid committing secrets.
- Configure CORS on the backend to allow the deployed frontend origin.
