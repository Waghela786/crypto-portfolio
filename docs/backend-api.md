# Backend API Reference

Base URL (development): http://localhost:5000 (check `server.js` for configured port)

Authentication
- POST /api/auth/register — register a new user
  - body: { name, email, password }
- POST /api/auth/login — login
  - body: { email, password }
  - returns: { token, user }

Wallets
- GET /api/wallets — get current user's wallets (requires Authorization: Bearer <token>)

Transactions
- POST /api/transactions/send — send coins to another user
  - body: { coin, amount, toEmail }
  - requires Authorization header
- GET /api/transactions/received — list transactions where current user is recipient

Admin / Debug
- POST /api/transactions/verify-user — verify whether an email is a registered user (used by frontend before sending)

Error handling
- Standard JSON: { success: false, message: '...' } or error details under `message`.

Auth
- Use JWT tokens in `Authorization: Bearer <token>` header for protected routes.
