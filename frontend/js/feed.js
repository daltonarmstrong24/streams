// ============================================================
// feed.js — renders posts, handles posting and liking.
// Uses api.js for all data. Builds DOM with textContent (never
// innerHTML with user text) so posts can't inject scripts (XSS).
// ============================================================

let currentTab = "foryou";

// ---------- Helpers ----------
function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function initials(name) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function icon(name) {
  const i = document.createElement("i");
  i.setAttribute("data-lucide", name);
  return i;
}

function actionButton(iconName, count, extraClass = "") {
  const btn = el("button", "action " + extraClass);
  btn.append(icon(iconName));
  if (count !== undefined) btn.append(el("span", "", formatCount(count)));
  return btn;
}

// ---------- Render one post ----------
function renderPost(post) {
  const article = el("article", "post");
  article.dataset.id = post.id;

  const avatar = el("span", "avatar avatar-md");
  avatar.dataset.initials = initials(post.user.display_name || post.user.username);
  if (post.user.avatar_url) avatar.style.backgroundImage = `url("${encodeURI(post.user.avatar_url)}")`;

  const body = el("div", "post-body");

  const head = el("header", "post-head");
  head.append(
    el("strong", "", post.user.display_name || post.user.username),
    el("span", "muted", `@${post.user.username} · ${timeAgo(post.created_at)}`)
  );
  const more = el("button", "icon-btn post-more");
  more.setAttribute("aria-label", "More");
  more.append(icon("more-horizontal"));
  head.append(more);

  const text = el("p", "post-text", post.content);

  const actions = el("footer", "post-actions");
  const commentBtn = actionButton("message-circle", post.comment_count);
  const likeBtn = actionButton("heart", post.like_count, post.is_liked ? "liked" : "");
  likeBtn.addEventListener("click", () => toggleLike(post, likeBtn));
  actions.append(
    commentBtn,
    likeBtn,
    el("span", "action-spacer"),
    actionButton("bookmark"),
    actionButton("share")
  );

  body.append(head, text, actions);
  article.append(avatar, body);
  return article;
}

// ---------- Like / unlike (optimistic: update UI first, undo on error) ----------
async function toggleLike(post, btn) {
  const nowLiked = !post.is_liked;
  post.is_liked = nowLiked;
  post.like_count += nowLiked ? 1 : -1;
  updateLikeButton(btn, post);
  try {
    await api.setLike(post.id, nowLiked);
  } catch (err) {
    post.is_liked = !nowLiked;
    post.like_count += nowLiked ? -1 : 1;
    updateLikeButton(btn, post);
    console.error("Like failed:", err);
  }
}

function updateLikeButton(btn, post) {
  btn.classList.toggle("liked", post.is_liked);
  btn.querySelector("span").textContent = formatCount(post.like_count);
}

// ---------- Load the feed ----------
async function loadFeed(tab = currentTab) {
  currentTab = tab;
  const feed = document.getElementById("feed");
  feed.replaceChildren(el("p", "feed-status", "Loading…"));
  try {
    const posts = await api.getFeed(tab);
    if (posts.length === 0) {
      feed.replaceChildren(el("p", "feed-status", "No posts yet. Say something!"));
      return;
    }
    feed.replaceChildren(...posts.map(renderPost));
    lucide.createIcons();
  } catch (err) {
    feed.replaceChildren(el("p", "feed-status error", "Couldn't load posts. Try again."));
    console.error(err);
  }
}

// ---------- Compose a post ----------
function setupComposer() {
  const form = document.getElementById("composer");
  const text = document.getElementById("compose-text");
  const postBtn = document.getElementById("post-btn");
  const count = document.getElementById("char-count");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = text.value.trim();
    if (!content || content.length > 280) return;

    postBtn.disabled = true;
    try {
      const post = await api.createPost(content);
      const feed = document.getElementById("feed");
      feed.querySelector(".feed-status")?.remove();
      feed.prepend(renderPost(post));
      lucide.createIcons();
      text.value = "";
      text.style.height = "auto";
      count.textContent = "280";
    } catch (err) {
      postBtn.disabled = false;
      alert("Couldn't post. Try again.");
      console.error(err);
    }
  });
}

// ---------- Start ----------
document.addEventListener("DOMContentLoaded", () => {
  setupComposer();
  document.querySelectorAll(".tab").forEach((tab) =>
    tab.addEventListener("click", () => loadFeed(tab.dataset.tab))
  );
  loadFeed();
});
