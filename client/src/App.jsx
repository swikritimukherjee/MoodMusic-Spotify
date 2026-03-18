import { useEffect, useMemo, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import api from "./api";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const moodQueryMap = {
  happy: "happy songs",
  sad: "sad songs",
  focus: "lofi focus",
  party: "party hits",
  gym: "workout music",
};

const moodColors = {
  happy: "#34d399",
  sad: "#60a5fa",
  focus: "#22d3ee",
  party: "#f472b6",
  gym: "#f97316",
};

const quizQuestions = [
  {
    prompt: "Your energy right now?",
    options: [
      { label: "Bright and joyful", mood: "happy", points: 24 },
      { label: "Quiet and emotional", mood: "sad", points: 22 },
      { label: "Calm and concentrated", mood: "focus", points: 28 },
      { label: "Ready to celebrate", mood: "party", points: 30 },
      { label: "Need a performance boost", mood: "gym", points: 27 },
    ],
  },
  {
    prompt: "Pick a place to be now.",
    options: [
      { label: "Sunlit road trip", mood: "happy", points: 20 },
      { label: "Rainy window seat", mood: "sad", points: 21 },
      { label: "A clean desk and headphones", mood: "focus", points: 27 },
      { label: "Neon rooftop party", mood: "party", points: 29 },
      { label: "Night workout floor", mood: "gym", points: 30 },
    ],
  },
  {
    prompt: "What should music do for you today?",
    options: [
      { label: "Lift my mood", mood: "happy", points: 25 },
      { label: "Let me feel things", mood: "sad", points: 24 },
      { label: "Keep me locked in", mood: "focus", points: 31 },
      { label: "Charge the vibe", mood: "party", points: 33 },
      { label: "Push me harder", mood: "gym", points: 32 },
    ],
  },
  {
    prompt: "Choose your tempo.",
    options: [
      { label: "Light bounce", mood: "happy", points: 22 },
      { label: "Slow and cinematic", mood: "sad", points: 21 },
      { label: "Steady and minimal", mood: "focus", points: 29 },
      { label: "Fast and explosive", mood: "party", points: 31 },
      { label: "Aggressive and intense", mood: "gym", points: 30 },
    ],
  },
  {
    prompt: "Your social mode?",
    options: [
      { label: "Smiling and open", mood: "happy", points: 20 },
      { label: "Private and reflective", mood: "sad", points: 20 },
      { label: "Busy and focused", mood: "focus", points: 27 },
      { label: "All in with my people", mood: "party", points: 34 },
      { label: "Competing with myself", mood: "gym", points: 31 },
    ],
  },
];

const initialAnalytics = {
  mostSelectedMood: null,
  moodDistribution: [],
  mostLikedArtist: null,
  recentlyPlayed: [],
  likedSongs: [],
  badges: [],
};

const initialQuizScores = {
  happy: 0,
  sad: 0,
  focus: 0,
  party: 0,
  gym: 0,
};

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [userId, setUserId] = useState(() => localStorage.getItem("userId") || "");
  const [userName, setUserName] = useState(() => localStorage.getItem("userName") || "");

  const [activeTab, setActiveTab] = useState("home");
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizMoodScores, setQuizMoodScores] = useState(initialQuizScores);
  const [quizResult, setQuizResult] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [tracks, setTracks] = useState([]);
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicError, setMusicError] = useState("");

  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  const [playlists, setPlaylists] = useState([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState("");
  const [playlistDraft, setPlaylistDraft] = useState({ name: "", description: "", mood: "mixed" });
  const [playlistDraftSongs, setPlaylistDraftSongs] = useState([]);
  const [editingPlaylistId, setEditingPlaylistId] = useState("");

  const [likedEditState, setLikedEditState] = useState({});
  const [toasts, setToasts] = useState([]);
  const [xp, setXp] = useState(0);
  const [streakDays, setStreakDays] = useState(1);

  const lockedTabs = useMemo(() => ["discover", "library", "playlists", "badges"], []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const completed = localStorage.getItem(`quizCompleted_${userId}`) === "true";
    setQuizCompleted(completed);

    const storedXp = Number(localStorage.getItem(`xp_${userId}`) || "0");
    const storedStreak = Number(localStorage.getItem(`streak_${userId}`) || "1");
    setXp(storedXp);
    setStreakDays(storedStreak);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    fetchAnalytics(userId);
    fetchPlaylists(userId);
  }, [userId]);

  const likedSongsDeduped = useMemo(() => {
    const unique = new Map();
    analytics.likedSongs.forEach((song) => {
      if (!unique.has(song.songId)) {
        unique.set(song.songId, song);
      }
    });
    return Array.from(unique.values());
  }, [analytics.likedSongs]);

  const moodChartData = useMemo(() => {
    const labels = analytics.moodDistribution.map((entry) => entry._id);
    const values = analytics.moodDistribution.map((entry) => entry.count);
    const colors = labels.map((label) => moodColors[label] || "#7dd3fc");

    return {
      labels,
      datasets: [
        {
          label: "Mood Distribution",
          data: values,
          backgroundColor: colors,
          borderColor: "rgba(255,255,255,0.15)",
          borderWidth: 1,
        },
      ],
    };
  }, [analytics.moodDistribution]);

  const totalMoodSessions = useMemo(
    () => analytics.moodDistribution.reduce((sum, entry) => sum + entry.count, 0),
    [analytics.moodDistribution]
  );

  const moodBreakdown = useMemo(() => {
    if (!totalMoodSessions) {
      return [];
    }

    return analytics.moodDistribution.map((entry) => ({
      mood: entry._id,
      count: entry.count,
      percent: Math.round((entry.count / totalMoodSessions) * 100),
    }));
  }, [analytics.moodDistribution, totalMoodSessions]);

  const quizBadge = useMemo(() => {
    if (!quizResult) {
      return null;
    }

    if (quizResult.score >= 145) {
      return { key: "vibe-master", name: "Vibe Master", description: "You made high-confidence music choices." };
    }
    if (quizResult.score >= 120) {
      return { key: "vibe-scout", name: "Vibe Scout", description: "Your musical instincts are sharp today." };
    }
    return { key: "vibe-starter", name: "Vibe Starter", description: "Great start, keep exploring moods." };
  }, [quizResult]);

  const allBadges = useMemo(() => {
    if (!quizBadge) {
      return analytics.badges;
    }
    return [quizBadge, ...analytics.badges.filter((badge) => badge.key !== quizBadge.key)];
  }, [analytics.badges, quizBadge]);

  const level = useMemo(() => Math.floor(xp / 100) + 1, [xp]);
  const levelProgress = useMemo(() => xp % 100, [xp]);

  const missions = useMemo(
    () => [
      {
        key: "quiz-run",
        title: "Complete the quiz",
        done: quizCompleted,
      },
      {
        key: "collector",
        title: "Like 5 songs",
        done: likedSongsDeduped.length >= 5,
      },
      {
        key: "curator",
        title: "Create 2 playlists",
        done: playlists.length >= 2,
      },
    ],
    [likedSongsDeduped.length, playlists.length, quizCompleted]
  );

  function pushToast(message, type = "success") {
    const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2600);
  }

  function dismissToast(id) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }

  function grantXp(amount, reason) {
    if (!userId || amount <= 0) {
      return;
    }

    setXp((prev) => {
      const next = prev + amount;
      localStorage.setItem(`xp_${userId}`, String(next));
      return next;
    });

    pushToast(`+${amount} XP · ${reason}`, "success");
  }

  function updateAuthField(event) {
    const { name, value } = event.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submitAuth(event) {
    event.preventDefault();

    try {
      setAuthLoading(true);
      setAuthError("");

      const endpoint = authMode === "signup" ? "/auth/signup" : "/auth/login";
      const payload = authMode === "signup" ? authForm : { email: authForm.email, password: authForm.password };
      const response = await api.post(endpoint, payload);

      localStorage.setItem("userId", response.data.userId);
      localStorage.setItem("userName", response.data.name || "");

      setUserId(response.data.userId);
      setUserName(response.data.name || "");
      setActiveTab("home");
      setAuthForm({ name: "", email: "", password: "" });
      pushToast(authMode === "signup" ? "Account created successfully" : "Logged in successfully", "success");
    } catch (error) {
      setAuthError(error.response?.data?.message || "Authentication failed");
      pushToast(error.response?.data?.message || "Authentication failed", "error");
    } finally {
      setAuthLoading(false);
    }
  }

  async function fetchAnalytics(currentUserId) {
    if (!currentUserId) {
      return;
    }

    try {
      setAnalyticsLoading(true);
      setAnalyticsError("");
      const response = await api.get(`/analytics?userId=${currentUserId}`);
      setAnalytics(response.data);
    } catch (error) {
      setAnalyticsError(error.response?.data?.message || "Failed to fetch analytics");
      pushToast(error.response?.data?.message || "Failed to fetch analytics", "error");
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function fetchPlaylists(currentUserId) {
    if (!currentUserId) {
      return;
    }

    try {
      setPlaylistLoading(true);
      setPlaylistError("");
      const response = await api.get(`/playlists?userId=${currentUserId}`);
      setPlaylists(response.data.playlists || []);
    } catch (error) {
      setPlaylistError(error.response?.data?.message || "Failed to fetch playlists");
      pushToast(error.response?.data?.message || "Failed to fetch playlists", "error");
    } finally {
      setPlaylistLoading(false);
    }
  }

  async function fetchMusic(query) {
    try {
      setMusicLoading(true);
      setMusicError("");
      const response = await api.get(`/music?query=${encodeURIComponent(query)}`);
      setTracks(response.data.tracks || []);
    } catch (error) {
      setMusicError(error.response?.data?.message || "Unable to fetch music");
      pushToast(error.response?.data?.message || "Unable to fetch music", "error");
    } finally {
      setMusicLoading(false);
    }
  }

  async function saveMood(mood) {
    if (!userId) {
      return;
    }
    await api.post("/mood", { userId, mood });
  }

  async function saveSongInteraction(track, liked) {
    try {
      const response = await api.post("/song-interaction", {
        userId,
        songId: track.songId,
        title: track.title,
        artist: track.artist,
        image: track.image || "",
        spotifyUrl: track.spotifyUrl || "",
        mood: selectedMood || "search",
        liked,
      });
      return response.data?.interaction || null;
    } catch (_error) {
      setMusicError("Failed to save song interaction");
      pushToast("Failed to save song interaction", "error");
      return null;
    }
  }

  async function openTrack(track) {
    window.open(track.spotifyUrl, "_blank", "noopener,noreferrer");
    await saveSongInteraction(track, false);
    await fetchAnalytics(userId);
  }

  async function likeTrack(event, track) {
    event.stopPropagation();
    const interaction = await saveSongInteraction(track, true);

    if (interaction) {
      setAnalytics((prev) => ({
        ...prev,
        likedSongs: [interaction, ...prev.likedSongs],
      }));
      grantXp(8, "Song liked");
    }

    await fetchAnalytics(userId);
  }

  function startQuiz() {
    setQuizStarted(true);
    setQuizStep(0);
    setQuizScore(0);
    setQuizMoodScores(initialQuizScores);
    setQuizResult(null);
    pushToast("Quiz started. Choose your vibe carefully.", "info");
  }

  async function selectQuizOption(option) {
    const nextScores = { ...quizMoodScores, [option.mood]: quizMoodScores[option.mood] + 1 };
    const nextTotal = quizScore + option.points;

    setQuizMoodScores(nextScores);
    setQuizScore(nextTotal);

    const isLastQuestion = quizStep === quizQuestions.length - 1;
    if (!isLastQuestion) {
      setQuizStep((prev) => prev + 1);
      return;
    }

    const winnerMood = Object.entries(nextScores).sort((a, b) => b[1] - a[1])[0]?.[0] || "happy";
    const query = moodQueryMap[winnerMood];

    setQuizResult({ mood: winnerMood, query, score: nextTotal });
    setQuizCompleted(true);
    localStorage.setItem(`quizCompleted_${userId}`, "true");

    setSelectedMood(winnerMood);
    setSearchInput(query);

    await Promise.all([fetchMusic(query), saveMood(winnerMood)]);
    await fetchAnalytics(userId);

    setStreakDays((prev) => {
      const next = prev + 1;
      localStorage.setItem(`streak_${userId}`, String(next));
      return next;
    });
    grantXp(55, "Quiz completed");
    pushToast(`Mood profile unlocked: ${winnerMood}`, "success");

    setActiveTab("discover");
  }

  async function handleMoodClick(mood) {
    const query = moodQueryMap[mood];
    setSelectedMood(mood);
    setSearchInput(query);

    await Promise.all([fetchMusic(query), saveMood(mood)]);
    await fetchAnalytics(userId);
  }

  async function handleSearch(event) {
    event.preventDefault();
    if (!searchInput.trim()) {
      pushToast("Type a song or artist to search", "info");
      return;
    }
    await fetchMusic(searchInput.trim());
  }

  function addTrackToDraft(track) {
    setPlaylistDraftSongs((prev) => {
      if (prev.some((item) => item.songId === track.songId)) {
        pushToast("Song already in playlist queue", "info");
        return prev;
      }
      pushToast("Added to playlist queue", "success");
      return [...prev, track];
    });
  }

  function removeTrackFromDraft(songId) {
    setPlaylistDraftSongs((prev) => prev.filter((track) => track.songId !== songId));
    pushToast("Removed from playlist queue", "info");
  }

  async function createPlaylist(event) {
    event.preventDefault();

    try {
      setPlaylistError("");
      const response = await api.post("/playlists", {
        userId,
        name: playlistDraft.name,
        description: playlistDraft.description,
        mood: playlistDraft.mood,
        songs: playlistDraftSongs,
      });

      setPlaylists((prev) => [response.data.playlist, ...prev]);
      setPlaylistDraft({ name: "", description: "", mood: "mixed" });
      setPlaylistDraftSongs([]);
      grantXp(20, "Playlist created");
      pushToast("Playlist created", "success");
    } catch (error) {
      setPlaylistError(error.response?.data?.message || "Failed to create playlist");
      pushToast(error.response?.data?.message || "Failed to create playlist", "error");
    }
  }

  async function savePlaylistEdit(playlist) {
    try {
      const response = await api.put(`/playlists/${playlist._id}`, playlist);
      setPlaylists((prev) => prev.map((item) => (item._id === playlist._id ? response.data.playlist : item)));
      setEditingPlaylistId("");
      grantXp(10, "Playlist updated");
      pushToast("Playlist updated", "success");
    } catch (error) {
      setPlaylistError(error.response?.data?.message || "Failed to update playlist");
      pushToast(error.response?.data?.message || "Failed to update playlist", "error");
    }
  }

  async function deletePlaylist(playlistId) {
    try {
      await api.delete(`/playlists/${playlistId}`);
      setPlaylists((prev) => prev.filter((playlist) => playlist._id !== playlistId));
      pushToast("Playlist removed", "info");
    } catch (error) {
      setPlaylistError(error.response?.data?.message || "Failed to delete playlist");
      pushToast(error.response?.data?.message || "Failed to delete playlist", "error");
    }
  }

  function beginEditLiked(song) {
    setLikedEditState((prev) => ({
      ...prev,
      [song._id]: {
        mood: song.mood || "search",
        note: song.note || "",
      },
    }));
  }

  async function saveLikedEdit(song) {
    const draft = likedEditState[song._id];
    if (!draft) {
      return;
    }

    try {
      const response = await api.put(`/song-interaction/${song._id}`, {
        mood: draft.mood,
        note: draft.note,
      });

      setAnalytics((prev) => ({
        ...prev,
        likedSongs: prev.likedSongs.map((item) => (item._id === song._id ? response.data.interaction : item)),
      }));

      setLikedEditState((prev) => {
        const copy = { ...prev };
        delete copy[song._id];
        return copy;
      });
      grantXp(5, "Library tune-up");
      pushToast("Liked song updated", "success");
    } catch (error) {
      setAnalyticsError(error.response?.data?.message || "Failed to update liked song");
      pushToast(error.response?.data?.message || "Failed to update liked song", "error");
    }
  }

  async function removeLikedSong(song) {
    try {
      await api.delete(`/song-interaction/${song._id}`);
      setAnalytics((prev) => ({
        ...prev,
        likedSongs: prev.likedSongs.filter((item) => item._id !== song._id),
      }));
      pushToast("Removed from liked songs", "info");
    } catch (error) {
      setAnalyticsError(error.response?.data?.message || "Failed to remove liked song");
      pushToast(error.response?.data?.message || "Failed to remove liked song", "error");
    }
  }

  function openLikedOnSpotify(song) {
    const directUrl = song.spotifyUrl?.trim();
    const fallbackQuery = encodeURIComponent(`${song.title || ""} ${song.artist || ""}`.trim());
    const finalUrl = directUrl || `https://open.spotify.com/search/${fallbackQuery}`;
    window.open(finalUrl, "_blank", "noopener,noreferrer");
    pushToast("Opening in Spotify", "info");
  }

  function navigate(tab) {
    if (!quizCompleted && lockedTabs.includes(tab)) {
      setActiveTab("quiz");
      pushToast("Finish the quiz to unlock this section", "info");
      return;
    }
    setActiveTab(tab);
  }

  function logout() {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    setUserId("");
    setUserName("");
    setActiveTab("home");
    setQuizCompleted(false);
    setQuizStarted(false);
    setQuizStep(0);
    setQuizScore(0);
    setQuizResult(null);
    setTracks([]);
    setPlaylists([]);
    setAnalytics(initialAnalytics);
  }

  if (!userId) {
    return (
      <>
        <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10">
          <div className="glass-card w-full max-w-md rounded-3xl p-8 text-slate-100">
            <p className="mb-2 text-xs uppercase tracking-[0.28em] text-cyan-200/80">Mood Music Intelligence Dashboard</p>
            <h1 className="title-font mb-7 text-3xl font-semibold">{authMode === "signup" ? "Create your account" : "Welcome back"}</h1>

            <form className="space-y-4" onSubmit={submitAuth}>
              {authMode === "signup" ? (
                <input
                  className="w-full rounded-xl border border-cyan-100/15 bg-slate-900/45 px-4 py-3 outline-none transition focus:border-cyan-300/45"
                  placeholder="Name"
                  name="name"
                  value={authForm.name}
                  onChange={updateAuthField}
                  required
                />
              ) : null}

              <input
                className="w-full rounded-xl border border-cyan-100/15 bg-slate-900/45 px-4 py-3 outline-none transition focus:border-cyan-300/45"
                placeholder="Email"
                type="email"
                name="email"
                value={authForm.email}
                onChange={updateAuthField}
                required
              />

              <div className="flex items-center gap-2 rounded-xl border border-cyan-100/15 bg-slate-900/45 px-2 py-1 focus-within:border-cyan-300/45">
                <input
                  className="w-full border-none bg-transparent px-2 py-2 outline-none"
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={authForm.password}
                  onChange={updateAuthField}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="rounded-lg border border-cyan-200/30 px-2 py-1 text-xs text-cyan-200"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {authError ? <p className="text-sm text-rose-300">{authError}</p> : null}

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-3 font-medium text-slate-950 transition hover:brightness-110"
                disabled={authLoading}
              >
                {authLoading ? "Please wait..." : authMode === "signup" ? "Sign up" : "Log in"}
              </button>
            </form>

            <button
              className="mt-5 text-sm text-cyan-100/85 hover:text-cyan-50"
              type="button"
              onClick={() => {
                setAuthMode((prev) => (prev === "signup" ? "login" : "signup"));
                setAuthError("");
              }}
            >
              {authMode === "signup" ? "Already have an account? Login" : "New user? Create account"}
            </button>
          </div>
        </main>

        <div className="toast-stack" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast-item ${toast.type}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium tracking-[0.08em] text-cyan-100/80">Notification</p>
                  <p className="mt-1 text-sm">{toast.message}</p>
                </div>
                <button className="toast-close" type="button" onClick={() => dismissToast(toast.id)}>
                  x
                </button>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[min(1700px,98vw)] px-3 py-4 text-slate-100 md:px-6 md:py-8">
      <header className="glass-card section-enter rounded-3xl p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Mood Music Intelligence Dashboard</p>
            <h1 className="title-font mt-2 text-2xl font-semibold md:text-3xl">Hello {userName || "Listener"}</h1>
            <p className="mt-1 text-sm text-slate-300">A quiz-first personalized experience with playlists, editing controls, and mood analytics.</p>
          </div>

          <button className="rounded-xl border border-rose-300/40 px-4 py-2 text-sm text-rose-200" type="button" onClick={logout}>
            Logout
          </button>
        </div>

        <nav className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-6">
          {[
            { key: "home", label: "Home" },
            { key: "quiz", label: "Quiz" },
            { key: "discover", label: "Discover" },
            { key: "library", label: "Liked Library" },
            { key: "playlists", label: "Playlists" },
            { key: "badges", label: "Badges" },
          ].map((item) => {
            const isLocked = !quizCompleted && lockedTabs.includes(item.key);
            const isActive = activeTab === item.key;

            return (
              <button
                key={item.key}
                type="button"
                className={`rounded-xl px-3 py-2 text-sm transition ${isActive ? "bg-cyan-300/25 text-cyan-100" : "soft-card text-slate-300"} ${isLocked ? "opacity-50" : ""}`}
                onClick={() => navigate(item.key)}
              >
                {item.label}
                {isLocked ? " (Locked)" : ""}
              </button>
            );
          })}
        </nav>
      </header>

      <section className="mt-7">
        {activeTab === "home" ? (
          <div className="section-enter grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
            <div className="glass-card sparkle rounded-3xl p-6 md:p-7">
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-200/80">Start Here</p>
              <h2 className="title-font mt-2 text-3xl font-semibold">Personalized Music Journey</h2>
              <p className="mt-3 text-slate-300">
                This dashboard now begins with a gamified personality quiz. Finish it once, unlock discovery, playlists, mood controls, and editable library features.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="soft-card rounded-xl p-3">
                  <p className="text-sm font-medium text-cyan-100">Quiz-first flow</p>
                  <p className="mt-1 text-xs text-slate-300">Your recommendations start from your vibe profile.</p>
                </div>
                <div className="soft-card rounded-xl p-3">
                  <p className="text-sm font-medium text-cyan-100">Editable library</p>
                  <p className="mt-1 text-xs text-slate-300">Update notes and mood tags on liked songs.</p>
                </div>
                <div className="soft-card rounded-xl p-3">
                  <p className="text-sm font-medium text-cyan-100">Playlist studio</p>
                  <p className="mt-1 text-xs text-slate-300">Build and edit your custom collections.</p>
                </div>
              </div>

              {!quizCompleted ? (
                <button
                  type="button"
                  className="mt-6 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                  onClick={() => setActiveTab("quiz")}
                >
                  Start Personalized Quiz
                </button>
              ) : (
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-xl bg-cyan-300/90 px-5 py-3 text-sm font-semibold text-slate-950"
                    onClick={() => setActiveTab("discover")}
                  >
                    Continue to Discover
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-emerald-300/40 px-5 py-3 text-sm font-semibold text-emerald-200"
                    onClick={() => setActiveTab("quiz")}
                  >
                    Retake Quiz
                  </button>
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-cyan-200/20 bg-gradient-to-r from-cyan-950/40 via-slate-900/20 to-emerald-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">About This App</p>
                <h3 className="title-font mt-2 text-xl font-semibold">Built by Swikriti Mukherjee</h3>
                <p className="mt-2 text-sm text-slate-200">
                  I built this fun mini project during my BTech course to mix two things I love: music and data. What started as a simple mood picker turned into a quiz-first dashboard with playlists, badges, and a playful vibe engine.
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  The idea came from those days when I could not decide what to listen to, so I made an app that figures out the mood first and lets the music follow.
                </p>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 md:p-7">
              <h3 className="title-font text-xl font-semibold">Progress and Powerups</h3>
              <div className="mt-3 space-y-3 text-sm">
                <div className="soft-card rounded-xl p-3">
                  <p className="text-slate-300">Quiz status</p>
                  <p className="mt-1 text-cyan-100">{quizCompleted ? "Completed" : "Pending"}</p>
                </div>
                <div className="soft-card rounded-xl p-3">
                  <p className="text-slate-300">Liked songs</p>
                  <p className="mt-1 text-cyan-100">{likedSongsDeduped.length}</p>
                </div>
                <div className="soft-card rounded-xl p-3">
                  <p className="text-slate-300">Playlists</p>
                  <p className="mt-1 text-cyan-100">{playlists.length}</p>
                </div>
                <div className="soft-card rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-300">Level {level}</p>
                    <p className="text-xs text-emerald-200">XP {xp}</p>
                  </div>
                  <div className="xp-bar mt-2 h-2 overflow-hidden rounded-full">
                    <div className="xp-fill h-full rounded-full" style={{ width: `${levelProgress}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-300">Streak: {streakDays} sessions</p>
                </div>
                <div className="soft-card rounded-xl p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Daily Missions</p>
                  <div className="mt-2 space-y-2">
                    {missions.map((mission) => (
                      <div key={mission.key} className="flex items-center justify-between rounded-lg bg-slate-900/35 px-2 py-1">
                        <p className="text-xs text-slate-200">{mission.title}</p>
                        <span className={`text-[10px] uppercase ${mission.done ? "text-emerald-300" : "text-slate-400"}`}>
                          {mission.done ? "Done" : "Open"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Mini Story</p>
                <p className="mt-2 text-sm text-slate-200">
                  First version: random song cards. Final version: a small game where your choices shape your music path. Every like, playlist, and badge makes your profile feel more personal.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "quiz" ? (
          <div className="glass-card section-enter rounded-3xl p-6 md:p-7">
            <h2 className="title-font text-2xl font-semibold">Gamified Mood Quiz</h2>
            <p className="mt-1 text-sm text-slate-300">Answer quick prompts to unlock your personalized music path.</p>

            {!quizStarted ? (
              <div className="mt-5 soft-card rounded-2xl p-5 md:p-6">
                <p className="text-sm text-slate-200">Total questions: {quizQuestions.length}</p>
                <p className="mt-1 text-sm text-slate-300">Each answer contributes points and mood signals.</p>
                <button
                  type="button"
                  className="mt-4 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950"
                  onClick={startQuiz}
                >
                  Begin Quiz
                </button>
              </div>
            ) : null}

            {quizStarted && !quizResult ? (
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-cyan-200/80">
                  <span>Question {quizStep + 1} / {quizQuestions.length}</span>
                  <span>Score {quizScore}</span>
                </div>
                <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-700/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"
                    style={{ width: `${((quizStep + 1) / quizQuestions.length) * 100}%` }}
                  />
                </div>

                <div className="soft-card rounded-2xl p-5 md:p-6">
                  <h3 className="title-font text-lg font-semibold">{quizQuestions[quizStep].prompt}</h3>
                  <div className="mt-4 grid gap-3">
                    {quizQuestions[quizStep].options.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        className="rounded-xl border border-slate-300/20 bg-slate-900/40 px-4 py-3 text-left text-sm text-slate-100 transition hover:border-cyan-300/45"
                        onClick={() => selectQuizOption(option)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {quizResult ? (
              <div className="mt-5 soft-card rounded-2xl p-5 md:p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Quiz Completed</p>
                <h3 className="title-font mt-2 text-2xl font-semibold capitalize">Your dominant mood: {quizResult.mood}</h3>
                <p className="mt-2 text-sm text-slate-300">Vibe score: {quizResult.score}</p>
                <p className="mt-1 text-sm text-slate-300">Recommendation query: {quizResult.query}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-xl bg-cyan-300/90 px-4 py-2 text-sm font-semibold text-slate-950"
                    onClick={() => setActiveTab("discover")}
                  >
                    Go to Discover
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-emerald-300/40 px-4 py-2 text-sm font-semibold text-emerald-200"
                    onClick={startQuiz}
                  >
                    Retake Quiz
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === "discover" ? (
          <div className="section-enter grid gap-6 lg:min-h-[calc(100vh-230px)] lg:grid-cols-[1.28fr,0.72fr]">
            <div className="glass-card flex flex-col rounded-3xl p-6 md:p-7">
              {!quizCompleted ? <p className="mb-3 text-sm text-rose-300">Finish quiz first to unlock personalized discovery.</p> : null}

              <h2 className="title-font text-xl font-semibold">Discover Songs</h2>
              <p className="mt-1 text-sm text-slate-300">Search any song or artist, or jump by mood.</p>

              <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleSearch}>
                <input
                  className="w-full rounded-xl border border-slate-300/20 bg-slate-900/35 px-4 py-3 outline-none focus:border-cyan-300/45"
                  placeholder="Search song or artist"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
                <button className="rounded-xl bg-cyan-300/90 px-5 py-3 text-sm font-medium text-slate-950" type="submit" disabled={!quizCompleted || musicLoading}>
                  {musicLoading ? "Searching..." : "Search"}
                </button>
              </form>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {Object.keys(moodQueryMap).map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    className={`rounded-xl border px-3 py-2 text-xs capitalize transition ${selectedMood === mood ? "border-emerald-300 bg-emerald-400/20 text-emerald-100" : "border-slate-400/25 bg-slate-900/35 text-slate-200"}`}
                    disabled={!quizCompleted}
                    onClick={() => handleMoodClick(mood)}
                  >
                    {mood}
                  </button>
                ))}
              </div>

              {musicError ? <p className="mt-3 text-sm text-rose-300">{musicError}</p> : null}

              <div className="scroll-area mt-5 flex-1 min-h-[420px] space-y-3 overflow-y-auto pr-2 lg:min-h-[calc(100vh-420px)]">
                {tracks.map((track) => (
                  <article
                    key={track.songId}
                    role="button"
                    tabIndex={0}
                    className="soft-card flex cursor-pointer items-center gap-3 rounded-2xl p-3.5 transition hover:border-cyan-200/40"
                    onClick={() => openTrack(track)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        openTrack(track);
                      }
                    }}
                  >
                    <img
                      src={track.image || "https://via.placeholder.com/70x70?text=Song"}
                      alt={track.title}
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-medium text-slate-100">{track.title}</h3>
                      <p className="truncate text-xs text-slate-300">{track.artist}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rounded-lg border border-emerald-300/40 px-2 py-1 text-xs text-emerald-200"
                        type="button"
                        onClick={(event) => likeTrack(event, track)}
                      >
                        Like
                      </button>
                      <button
                        className="rounded-lg border border-cyan-300/40 px-2 py-1 text-xs text-cyan-200"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          addTrackToDraft(track);
                        }}
                      >
                        Queue
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-card rounded-3xl p-5 md:p-6">
                <h3 className="title-font text-lg font-semibold">Mood Analytics</h3>
                {analyticsLoading ? <p className="mt-2 text-sm text-slate-300">Loading analytics...</p> : null}
                {analyticsError ? <p className="mt-2 text-sm text-rose-300">{analyticsError}</p> : null}

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="soft-card rounded-xl p-3">
                    <p className="text-slate-400">Tracked mood sessions</p>
                    <p className="mt-1 text-cyan-100">{totalMoodSessions}</p>
                  </div>
                  <div className="soft-card rounded-xl p-3">
                    <p className="text-slate-400">Most selected mood</p>
                    <p className="mt-1 capitalize text-cyan-100">{analytics.mostSelectedMood || "-"}</p>
                  </div>
                  <div className="soft-card rounded-xl p-3">
                    <p className="text-slate-400">Most liked artist</p>
                    <p className="mt-1 text-cyan-100">{analytics.mostLikedArtist || "-"}</p>
                  </div>
                </div>

                {totalMoodSessions > 0 ? (
                  <div className="mt-4 space-y-3">
                    <div className="soft-card rounded-2xl p-3">
                      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-cyan-200/80">Mood split</p>
                      <div className="space-y-2">
                        {moodBreakdown.map((item) => (
                          <div key={item.mood} className="rounded-lg bg-slate-900/35 p-2">
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="capitalize text-slate-200">{item.mood}</span>
                              <span className="text-cyan-200">{item.count} sessions · {item.percent}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-700/60">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${item.percent}%`, background: moodColors[item.mood] || "#7dd3fc" }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <div className="soft-card rounded-2xl p-3">
                        <Doughnut data={moodChartData} options={{ plugins: { legend: { labels: { color: "#d1e8ff" } } } }} />
                      </div>
                      <div className="soft-card rounded-2xl p-3">
                        <Bar
                          data={moodChartData}
                          options={{
                            plugins: { legend: { display: false } },
                            scales: {
                              x: { ticks: { color: "#d1e8ff" }, grid: { color: "rgba(255,255,255,0.08)" } },
                              y: { ticks: { color: "#d1e8ff" }, grid: { color: "rgba(255,255,255,0.08)" } },
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 soft-card rounded-2xl p-4">
                    <p className="text-sm text-slate-300">No mood analytics yet.</p>
                    <p className="mt-1 text-xs text-slate-400">Use quiz or mood buttons to generate real data before charts appear.</p>
                  </div>
                )}
              </div>

              <div className="glass-card rounded-3xl p-5 md:p-6">
                <h3 className="title-font text-lg font-semibold">Recently Played</h3>
                <div className="mt-3 space-y-2">
                  {analytics.recentlyPlayed.slice(0, 6).map((song) => (
                    <div key={`${song.songId}-${song.timestamp}`} className="soft-card rounded-xl px-3 py-2">
                      <p className="truncate text-sm text-slate-100">{song.title}</p>
                      <p className="truncate text-xs text-slate-300">{song.artist}</p>
                    </div>
                  ))}
                  {analytics.recentlyPlayed.length === 0 ? <p className="text-sm text-slate-400">No recently played tracks yet.</p> : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "library" ? (
          <div className="glass-card section-enter rounded-3xl p-6 md:p-7">
            <h2 className="title-font text-xl font-semibold">Edit Liked Songs</h2>
            <p className="mt-1 text-sm text-slate-300">Update mood tags, add notes, or remove songs from your liked library.</p>

            <div className="scroll-area mt-5 grid max-h-[620px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
              {likedSongsDeduped.map((song) => {
                const draft = likedEditState[song._id];
                return (
                  <article key={song._id} className="soft-card rounded-2xl p-4">
                    <p className="truncate text-sm font-medium text-slate-100">{song.title}</p>
                    <p className="truncate text-xs text-slate-300">{song.artist}</p>

                    {draft ? (
                      <div className="mt-3 space-y-2">
                        <input
                          className="w-full rounded-lg border border-slate-300/20 bg-slate-900/35 px-3 py-2 text-xs"
                          value={draft.mood}
                          onChange={(event) => {
                            const value = event.target.value;
                            setLikedEditState((prev) => ({ ...prev, [song._id]: { ...prev[song._id], mood: value } }));
                          }}
                          placeholder="Mood"
                        />
                        <textarea
                          className="w-full rounded-lg border border-slate-300/20 bg-slate-900/35 px-3 py-2 text-xs"
                          value={draft.note}
                          onChange={(event) => {
                            const value = event.target.value;
                            setLikedEditState((prev) => ({ ...prev, [song._id]: { ...prev[song._id], note: value } }));
                          }}
                          placeholder="Quick note"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button className="rounded-lg bg-emerald-400/80 px-3 py-1 text-xs font-medium text-slate-950" type="button" onClick={() => saveLikedEdit(song)}>
                            Save
                          </button>
                          <button
                            className="rounded-lg border border-slate-300/30 px-3 py-1 text-xs"
                            type="button"
                            onClick={() => {
                              setLikedEditState((prev) => {
                                const copy = { ...prev };
                                delete copy[song._id];
                                return copy;
                              });
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-cyan-200 capitalize">Mood: {song.mood || "search"}</p>
                        {song.note ? <p className="text-xs text-slate-300">Note: {song.note}</p> : null}
                        <div className="flex gap-2">
                          <button
                            className="rounded-lg border border-emerald-300/40 px-3 py-1 text-xs text-emerald-200"
                            type="button"
                            onClick={() => openLikedOnSpotify(song)}
                          >
                            Open Spotify
                          </button>
                          <button className="rounded-lg border border-cyan-300/40 px-3 py-1 text-xs text-cyan-200" type="button" onClick={() => beginEditLiked(song)}>
                            Edit
                          </button>
                          <button className="rounded-lg border border-rose-300/40 px-3 py-1 text-xs text-rose-200" type="button" onClick={() => removeLikedSong(song)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
              {likedSongsDeduped.length === 0 ? <p className="text-sm text-slate-400">No liked songs yet.</p> : null}
            </div>
          </div>
        ) : null}

        {activeTab === "playlists" ? (
          <div className="section-enter grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
            <div className="glass-card rounded-3xl p-6 md:p-7">
              <h2 className="title-font text-xl font-semibold">Create Playlist</h2>
              <p className="mt-1 text-sm text-slate-300">Queue songs from Discover and build your own collections.</p>

              <form className="mt-4 space-y-3" onSubmit={createPlaylist}>
                <input
                  className="w-full rounded-xl border border-slate-300/20 bg-slate-900/35 px-4 py-3 text-sm"
                  placeholder="Playlist name"
                  value={playlistDraft.name}
                  onChange={(event) => setPlaylistDraft((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
                <input
                  className="w-full rounded-xl border border-slate-300/20 bg-slate-900/35 px-4 py-3 text-sm"
                  placeholder="Mood tag"
                  value={playlistDraft.mood}
                  onChange={(event) => setPlaylistDraft((prev) => ({ ...prev, mood: event.target.value }))}
                />
                <textarea
                  className="w-full rounded-xl border border-slate-300/20 bg-slate-900/35 px-4 py-3 text-sm"
                  placeholder="Description"
                  rows={3}
                  value={playlistDraft.description}
                  onChange={(event) => setPlaylistDraft((prev) => ({ ...prev, description: event.target.value }))}
                />
                <button className="rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950" type="submit">
                  Save Playlist ({playlistDraftSongs.length} songs)
                </button>
              </form>

              <div className="mt-4 soft-card rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">Queued Songs</p>
                <div className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
                  {playlistDraftSongs.map((song) => (
                    <div key={song.songId} className="flex items-center justify-between rounded-lg bg-slate-900/35 px-2 py-1">
                      <p className="truncate text-xs text-slate-100">{song.title} - {song.artist}</p>
                      <button className="text-xs text-rose-300" type="button" onClick={() => removeTrackFromDraft(song.songId)}>
                        Remove
                      </button>
                    </div>
                  ))}
                  {playlistDraftSongs.length === 0 ? <p className="text-xs text-slate-400">No queued songs yet. Use Queue in Discover.</p> : null}
                </div>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 md:p-7">
              <h2 className="title-font text-xl font-semibold">Edit Playlists</h2>
              {playlistLoading ? <p className="mt-2 text-sm text-slate-300">Loading playlists...</p> : null}
              {playlistError ? <p className="mt-2 text-sm text-rose-300">{playlistError}</p> : null}

              <div className="scroll-area mt-4 max-h-[620px] space-y-3 overflow-y-auto pr-1">
                {playlists.map((playlist) => {
                  const isEditing = editingPlaylistId === playlist._id;
                  return (
                    <article key={playlist._id} className="soft-card rounded-2xl p-4">
                      {isEditing ? (
                        <PlaylistEditor
                          playlist={playlist}
                          onCancel={() => setEditingPlaylistId("")}
                          onSave={savePlaylistEdit}
                        />
                      ) : (
                        <>
                          <p className="text-sm font-medium text-slate-100">{playlist.name}</p>
                          <p className="mt-1 text-xs text-cyan-200 capitalize">Mood: {playlist.mood}</p>
                          <p className="mt-1 text-xs text-slate-300">{playlist.description || "No description"}</p>
                          <p className="mt-1 text-xs text-slate-400">Songs: {playlist.songs?.length || 0}</p>
                          <div className="mt-3 flex gap-2">
                            <button className="rounded-lg border border-cyan-300/40 px-3 py-1 text-xs text-cyan-200" type="button" onClick={() => setEditingPlaylistId(playlist._id)}>
                              Edit
                            </button>
                            <button className="rounded-lg border border-rose-300/40 px-3 py-1 text-xs text-rose-200" type="button" onClick={() => deletePlaylist(playlist._id)}>
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </article>
                  );
                })}
                {playlists.length === 0 ? <p className="text-sm text-slate-400">No playlists yet.</p> : null}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "badges" ? (
          <div className="glass-card section-enter rounded-3xl p-6 md:p-7">
            <h2 className="title-font text-xl font-semibold">Badges and Achievements</h2>
            <p className="mt-1 text-sm text-slate-300">Earn badges from your quiz performance and real listening behavior.</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {allBadges.map((badge) => (
                <article key={badge.key} className="soft-card rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Unlocked</p>
                  <h3 className="title-font mt-2 text-lg font-semibold">{badge.name}</h3>
                  <p className="mt-2 text-sm text-slate-300">{badge.description}</p>
                </article>
              ))}
              {allBadges.length === 0 ? <p className="text-sm text-slate-400">Finish quiz and interact with songs to unlock badges.</p> : null}
            </div>
          </div>
        ) : null}
      </section>

      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item ${toast.type}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium tracking-[0.08em] text-cyan-100/80">Notification</p>
                <p className="mt-1 text-sm">{toast.message}</p>
              </div>
              <button className="toast-close" type="button" onClick={() => dismissToast(toast.id)}>
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function PlaylistEditor({ playlist, onSave, onCancel }) {
  const [form, setForm] = useState({
    _id: playlist._id,
    name: playlist.name,
    description: playlist.description || "",
    mood: playlist.mood || "mixed",
    songs: playlist.songs || [],
  });

  return (
    <div className="space-y-2">
      <input
        className="w-full rounded-lg border border-slate-300/20 bg-slate-900/35 px-3 py-2 text-xs"
        value={form.name}
        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
      />
      <input
        className="w-full rounded-lg border border-slate-300/20 bg-slate-900/35 px-3 py-2 text-xs"
        value={form.mood}
        onChange={(event) => setForm((prev) => ({ ...prev, mood: event.target.value }))}
      />
      <textarea
        className="w-full rounded-lg border border-slate-300/20 bg-slate-900/35 px-3 py-2 text-xs"
        rows={2}
        value={form.description}
        onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
      />
      <div className="flex gap-2">
        <button className="rounded-lg bg-emerald-400/80 px-3 py-1 text-xs font-medium text-slate-950" type="button" onClick={() => onSave(form)}>
          Save
        </button>
        <button className="rounded-lg border border-slate-300/30 px-3 py-1 text-xs" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default App;
