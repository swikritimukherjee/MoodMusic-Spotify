# Mood Music Intelligence Dashboard

Full-stack MERN application with Spotify-powered mood-based music discovery and real analytics.

## Tech Stack

- Frontend: React (Vite), Tailwind CSS, Axios, Chart.js
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Auth: MongoDB signup/login with bcrypt (no JWT)

## Folder Structure

- client/
- server/

## Backend Setup

1. Go to `server`.
2. Create `.env` from `.env.example`.
3. Add your Spotify app credentials and MongoDB URI.
4. Run:

```bash
npm install
npm run dev
```

Backend runs on `http://localhost:5000` by default.

## Frontend Setup

1. Go to `client`.
2. Create `.env` from `.env.example`.
3. Run:

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## Required Environment Variables

### server/.env

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/mood-music-dashboard
CLIENT_ID=your_spotify_client_id
CLIENT_SECRET=your_spotify_client_secret
CLIENT_URL=http://localhost:5173
```

### client/.env

```env
VITE_API_URL=http://localhost:5000/api
```

## Implemented APIs

- POST /api/auth/signup
- POST /api/auth/login
- GET /api/music?query=
- POST /api/mood
- POST /api/song-interaction
- GET /api/analytics?userId=

## Features Implemented

- Signup/Login with bcrypt password hashing
- Local storage user session via `userId`
- Mood buttons and search bar
- Spotify API integration with backend token caching and refresh
- Song interactions: clicked and liked
- Analytics from MongoDB data only:
	- Most selected mood
	- Mood distribution
	- Most liked artist
	- Recently played songs
- Liked songs page
- Recently played section
- Chart.js analytics visualizations
- Loading and error states
- Responsive dark glassmorphism UI
