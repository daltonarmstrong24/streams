// Shared page setup for every Streams page.
// Step 1: draw icons, tab switching, composer character counter.
// Later steps add feed.js / api.js / auth.js.

document.addEventListener("DOMContentLoaded", () => {
  // Turn every <i data-lucide="..."> into an SVG icon
  if (window.lucide) lucide.createIcons();

  // Feed tabs: For you / Following / Your streams
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      // Step 7: reload the feed with ?tab=${tab.dataset.tab}
    });
  });

  // Composer: live 280-char counter + enable/disable Post button
  const text = document.getElementById("compose-text");
  const count = document.getElementById("char-count");
  const postBtn = document.getElementById("post-btn");
  if (text) {
    text.addEventListener("input", () => {
      const left = 280 - text.value.length;
      count.textContent = left;
      count.classList.toggle("warn", left <= 20 && left >= 0);
      count.classList.toggle("over", left < 0);
      postBtn.disabled = text.value.trim().length === 0;
      // auto-grow the textarea
      text.style.height = "auto";
      text.style.height = text.scrollHeight + "px";
    });
  }

  // Sidebar "Create a post" focuses the composer
  const createBtn = document.getElementById("sidebar-create");
  if (createBtn && text) createBtn.addEventListener("click", () => text.focus());
});
