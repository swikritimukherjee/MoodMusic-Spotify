const axios = require("axios");

let spotifyToken = null;
let tokenExpiresAt = 0;

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_SEARCH_URL = "https://api.spotify.com/v1/search";

async function fetchSpotifyToken() {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials are missing in environment variables");
  }

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await axios.post(
    SPOTIFY_TOKEN_URL,
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  spotifyToken = response.data.access_token;
  tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

  return spotifyToken;
}

async function getValidSpotifyToken() {
  const needsRefresh = !spotifyToken || Date.now() > tokenExpiresAt - 60 * 1000;

  if (needsRefresh) {
    return fetchSpotifyToken();
  }

  return spotifyToken;
}

async function searchTracks(query, limit = 10) {
  const token = await getValidSpotifyToken();

  const response = await axios.get(SPOTIFY_SEARCH_URL, {
    params: {
      q: query,
      type: "track",
      limit,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data.tracks.items.map((track) => ({
    songId: track.id,
    title: track.name,
    artist: track.artists.map((artist) => artist.name).join(", "),
    image: track.album.images?.[0]?.url || "",
    spotifyUrl: track.external_urls.spotify,
  }));
}

module.exports = {
  searchTracks,
};
