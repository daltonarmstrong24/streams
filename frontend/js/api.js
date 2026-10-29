// ============================================================
// api.js — the ONLY file that talks to the backend.
// While the Django API isn't ready, USE_MOCK = true returns fake data
// shaped exactly like the real JSON. Flip it to false in step 7.
// ============================================================

const USE_MOCK = true;
const API_BASE = "/api"; // nginx forwards /api/ to gunicorn (Django)

// ---------- Real API helper ----------
async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.status === 204 ? null : res.json();
}

// ---------- Mock data (matches Dalton's schema) ----------
const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();

const ME = { username: "alexmorgan", display_name: "Alex Morgan", avatar_url: "" };

let mockPosts = [
  {
    id: 3,
    user: { username: "mayachen", display_name: "Maya Chen", avatar_url: "" },
    content: "A slow morning by the water. Sometimes the best way to find a new perspective is to step away from the screen. 🌊",
    created_at: minutesAgo(18),
    like_count: 148, comment_count: 24, is_liked: true,
  },
  {
    id: 2,
    user: { username: "julianmakes", display_name: "Julian Park", avatar_url: "" },
    content: "The internet needs more little corners where people make things together. Less noise, more connection.",
    created_at: minutesAgo(42),
    like_count: 133, comment_count: 18, is_liked: false,
  },
  {
    id: 1,
    user: { username: "linarivera", display_name: "Lina Rivera", avatar_url: "" },
    content: "Taking a little creative reset this weekend. Where do you go to recharge?",
    created_at: minutesAgo(60),
    like_count: 79, comment_count: 32, is_liked: false,
  },
];

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

// ---------- Public functions the pages call ----------
const api = {
  // GET /api/feed/?tab=foryou|following
  async getFeed(tab = "foryou") {
    if (USE_MOCK) {
      await delay();
      return tab === "following" ? mockPosts.slice(0, 2) : [...mockPosts];
    }
    return request(`/feed/?tab=${encodeURIComponent(tab)}`);
  },

  // POST /api/posts/  {content}
  async createPost(content) {
    if (USE_MOCK) {
      await delay();
      const post = {
        id: Date.now(), user: ME, content,
        created_at: new Date().toISOString(),
        like_count: 0, comment_count: 0, is_liked: false,
      };
      mockPosts.unshift(post);
      return post;
    }
    return request("/posts/", { method: "POST", body: JSON.stringify({ content }) });
  },

  // POST /api/posts/{id}/like/   — like
  // DELETE /api/posts/{id}/like/ — unlike
  async setLike(postId, liked) {
    if (USE_MOCK) {
      await delay(100);
      const p = mockPosts.find((x) => x.id === postId);
      if (p && p.is_liked !== liked) {
        p.is_liked = liked;
        p.like_count += liked ? 1 : -1;
      }
      return p;
    }
    return request(`/posts/${postId}/like/`, { method: liked ? "POST" : "DELETE" });
  },
};
