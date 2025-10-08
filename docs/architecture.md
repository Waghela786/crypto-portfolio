# Architecture

High level components

- Frontend (`/my-app`) — React application. Routes and components are under `src/pages` and `src/components`.
- Backend (`/backend`) — Express server with routes in `backend/routes` and controllers in `backend/controllers`.
- Database — MongoDB (models in `backend/models`).

Data flow

1. User interacts with the React UI.
2. Frontend calls the backend API (HTTP). Protected endpoints include a JWT token in the Authorization header.
3. Backend validates requests, performs business logic (e.g., transfer coins), updates MongoDB, and returns responses.

Notes
- Keep API base URL configurable (`src/services/api.js`) so the frontend can point to localhost during development, and to a production URL when deployed.
- For mobile testing on LAN, run the frontend with `HOST=0.0.0.0` or use a tunnel (ngrok).
