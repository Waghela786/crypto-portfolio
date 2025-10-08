# Crypto Portfolio

A full-stack cryptocurrency portfolio management app built with React, Node.js, Express, and MongoDB. It allows users to register, log in, verify recipients, and manage crypto transactions securely — all in one place.

🔥 This README is ready to upload directly to your GitHub repository (`crypto-portfolio`). It includes a project overview, setup instructions for frontend and backend, tech stack, API examples, screenshot placeholders, and future enhancements.

## Table of Contents

- [Project Structure](#project-structure)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Example](#api-example)
- [Screenshots](#screenshots)
- [Future Enhancements](#future-enhancements)
- [Author](#author)
- [GitHub Metadata (Optional)](#github-metadata-optional)

## Project Structure

```
crypto-portfolio/
├── backend/        # Node.js + Express + MongoDB backend API
├── my-app/         # React frontend
├── README.md       # Project documentation (this file)
└── .gitignore
```

## Features

- 🔐 JWT Authentication (Register & Login)
- 📨 Verify recipient before sending funds
- 💰 Track and manage crypto transactions
- 📊 View total portfolio balance
- 💻 Modern and responsive UI built with React
- 🧾 Secure API endpoints using Express + MongoDB

## Tech Stack

- Frontend: React.js, Axios, Context API (or similar state management), Tailwind CSS (or plain CSS)
- Backend: Node.js, Express.js
- Database: MongoDB (Mongoose ORM)
- Authentication: JWT, bcrypt
- Version control: Git & GitHub

## Setup Instructions

Follow these steps to get the project running locally.

### 1) Backend Setup

1. Open a terminal and change to the backend folder:

```powershell
cd backend
npm install
```

2. Create a `.env` file inside the `/backend` folder with the following variables:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

3. Start the backend server:

```powershell
npm start
```

The server will run on http://localhost:5000 (by default).

### 2) Frontend Setup

Open a new terminal and run:

```powershell
cd my-app
npm install
npm start
```

The frontend dev server runs on http://localhost:3000 by default.

Tip: To test the app on your phone, run the React dev server with `HOST=0.0.0.0` (or set `PORT`) and access it via your machine's LAN IP: `http://<your-ip>:3000`.

## API Example

Here is a sample API endpoint used by the application.

Verify User Endpoint

```
POST /api/transactions/verify-user
Headers: Authorization: Bearer <your_token>
Body: { "email": "recipient@example.com" }

Response:
{
  "success": true,
  "message": "User exists"
}
```

Adjust the base URL (http://localhost:5000) if your backend runs on a different port or host.

## Screenshots

Add your screenshots to an `assets/` folder and update the image paths below.

- Dashboard
  ![Dashboard](docs/assets/dashboard.png)
- Login Page
  ![Login](docs/assets/login.png)

> Tip: Replace these placeholders with real images before publishing.

## Future Enhancements

- Add real-time crypto prices (CoinGecko API)
- Portfolio chart visualization (e.g., Chart.js or Recharts)
- User notifications and alerts
- Multi-user collaboration features
- Mobile-friendly progressive web app (PWA)

## Author

Ashwin Waghela

GitHub: https://github.com/Waghela786

## GitHub Metadata (Optional)

You can fill these in the “About” section of your repo on GitHub:

- Description: Full-stack Crypto Portfolio App built with React, Node.js, Express, and MongoDB.
- Topics: react, nodejs, express, mongodb, jwt, crypto-portfolio

---

If you'd like, I can also:

- Add example .env templates (`backend/.env.example`)
- Wire up a simple GitHub Actions workflow to run lint/tests on push
- Create a GitHub Pages site for the `docs/` folder

Let me know which of those you'd like next.
# Crypto Portfolio Project

This project has two parts:

- **Frontend:** [my-app/README.md](./my-app/README.md)
- **Backend:** [backend/README.md](./backend/README.md) 

Open the folder above for detailed setup instructions.