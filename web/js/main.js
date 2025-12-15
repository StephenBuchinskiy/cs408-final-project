// web/js/main.js
import {
  createQuest,
  listQuests,
  updateQuest,
  deleteQuest,
  getLeaderboard,
} from "./api.js";

// =============================
//        Helper utilities
// =============================

// querySelector
const $ = (sel, root = document) => root.querySelector(sel);

// querySelectorAll
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Get element by id
const byId = (id) => document.getElementById(id);

/**
 * Input sanitizer tha removes control characters, trims whitespace, and limits length to 180 characters
 * 
 * @param {string} s - String to sanitize
 * @returns {string} - sanitized string
 */
function sanitizeText(s) {
  return String(s ?? "").replace(/[\u0000-\u001F]/g, "").trim().slice(0, 180);
}

/**
 * Inline alert box that announces results to screen-readers
 * 
 * @param {HTMLElement} target - Container to receive alert markup
 * @param {string} msg - Message text
 * @param {type=[info]} type - type=info
 * @returns 
 */
function alertBox(target, msg, type = "info") {
  if (!target) return;
  target.innerHTML = `<div role="status" class="alert ${type}" tabindex="-1">${msg}</div>`;
  const el = target.firstElementChild; // NOTE: property, not a function
  if (el) el.focus();
}

/**
 * Escape text
 * 
 * @param {string} s - String with text to replace
 * @returns {string} - Replaced string
 */
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// =============================
//         Page Router
// =============================
document.addEventListener("DOMContentLoaded", () => {
  // Highlight the active nav link
  for (const a of $$("nav a")) {
    if (a.getAttribute("href").split("#")[0] === location.pathname.split("/").pop()) {
      a.classList.add("active");
    }
  }

  const page = document.body.dataset.page;
  if (page === "home") initHome();
  if (page === "leaderboard") initLeaderboard();
});

// =============================
//             Pages
// =============================
function initHome() {
  const form = byId("create-form");
  const out = byId("create-output");

  // inputs
  const serverIdInput = byId("serverId");
  const userIdInput = byId("userId");
  const usernameInput = byId("username");
  const titleInput = byId("title");

  // Intercept form submition
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const serverId = sanitizeText(serverIdInput.value);
      const userId = sanitizeText(userIdInput.value);
      const username = sanitizeText(usernameInput.value);
      const title = sanitizeText(titleInput.value);

      if (!serverId || !userId || !title) {
        alertBox(out, "serverId, userId and title are required.", "warn");
        return;
      }

      const created = await createQuest({ serverId, userId, username, title });
      alertBox(out, `✅ Created "${escapeHtml(created.title)}" (id: ${created.id})`, "success");

      // Reset form for next entry
      form.reset();
      serverIdInput.focus();
    } catch (error) {
      alertBox(out, `❌ ${String(error.message || error)}`, "error");
    }
  });
}

function initLeaderboard() {
  const lbForm = byId("lb-form");
  const lbOut = byId("lb-output");
  const lbBody = byId("lb-body");

  lbForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const serverId = sanitizeText(byId("lb-serverId").value);
    const limit = Number(byId("lb-limit").value || 10);
    if (!serverId) return alertBox(lbOut, "serverId is required.", "warn");
    try {
      const rows = await getLeaderboard({ serverId, limit });
      lbBody.innerHTML =
        rows.map((r, i) =>
          `<tr>
            <td>${i + 1}</td>
            <td>${r.username ? escapeHtml(r.username) : `<code>${r.userId}</code>`}</td>
            <td>${r.kudos ?? 0}</td>
            <td>${r.done ?? 0}</td>
          </tr>`
        ).join("") || `<tr><td colspan="4" class="muted">No data yet</td></tr>`;
      alertBox(lbOut, `Loaded ${rows.length} rows.`, "info");
    } catch (error) {
      alertBox(lbOut, `❌ ${String(error.message || error)}`, "error");
    }
  });

  // All quests
  const allqForm = byId("allq-form");
  const allqOut = byId("allq-output");
  const allqBody = byId("all-quests-body");

  allqForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const serverId = sanitizeText(byId("allq-serverId").value);
    const limit = Number(byId("allq-limit").value || 100);
    if (!serverId) return alertBox(allqOut, "serverId is required.", "warn");
    try {
      const data = await listQuests({ serverId, limit });
      renderQuestsTable(allqBody, data.items || []);
      alertBox(allqOut, `Loaded ${data.items?.length || 0} quests.`, "info");
    } catch (error) {
      alertBox(allqOut, `❌ ${String(error.message || error)}`, "error");
    }
  });

  // Listener for row actions
  byId("all-quests")?.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const serverId = sanitizeText(byId("allq-serverId").value);
    try {
      if (btn.dataset.action === "delete") {
        await deleteQuest(id);
      }
      if (btn.dataset.action === "done") {
        await updateQuest(id, { status: "done", kudos: 1 });
      }
      if (btn.dataset.action === "kudos") {
        const current = Number(btn.dataset.kudos || 0);
        await updateQuest(id, { kudos: current + 1 });
      }
      const data = await listQuests({
        serverId,
        limit: Number(byId("allq-limit").value || 100),
      });
      renderQuestsTable(allqBody, data.items || []);
    } catch (error) {
      alertBox(allqOut, `❌ ${String(error.message || error)}`, "error");
    }
  });

  // Conditional retrieval
  const qForm = byId("q-form");
  const qOut = byId("q-output");
  const qBody = byId("q-body");

  qForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const serverId = sanitizeText(byId("q-serverId").value);
    const status = sanitizeText(byId("q-status").value);
    const userId = sanitizeText(byId("q-userId").value);
    if (!serverId) return alertBox(qOut, "serverId is required.", "warn");
    try {
      const data = await listQuests({
        serverId,
        status: status || undefined,
        userId: userId || undefined,
        limit: 100,
      });
      qBody.innerHTML =
        (data.items || []).map((q) =>
          `<tr>
            <td><code>${q.id}</code></td>
            <td>${escapeHtml(q.title)}</td>
            <td>${q.status}</td>
            <td>${q.username || q.userId || ""}</td>
            <td>${q.kudos ?? 0}</td>
          </tr>`
        ).join("") || `<tr><td colspan="5" class="muted">No results</td></tr>`;
      alertBox(qOut, `Found ${data.items?.length || 0} quest(s).`, "info");
    } catch (error) {
      alertBox(qOut, `❌ ${String(error.message || error)}`, "error");
    }
  });
}

// =============================
//          Renderers
// =============================

/**
 * Render the server slice
 *
 * @param {HTMLElement} tbody - <tbody> element to fill.
 * @param {Array} items - Array of quest records.
 */
function renderQuestsTable(tbody, items) {
  if (!tbody) return;
  tbody.innerHTML =
    items.map((q) =>
      `<tr>
        <td><code>${q.id}</code></td>
        <td>${escapeHtml(q.title)}</td>
        <td><span class="badge ${q.status === "done" ? "badge-done" : "badge-open"}">${q.status}</span></td>
        <td>${q.username || q.userId || ""}</td>
        <td>${q.kudos ?? 0}</td>
        <td class="actions">
          <button class="btn btn-xs" data-action="done" data-id="${q.id}">Done</button>
          <button class="btn btn-xs" data-action="kudos" data-id="${q.id}" data-kudos="${q.kudos ?? 0}">+ Kudos</button>
          <button class="btn btn-xs btn-danger" data-action="delete" data-id="${q.id}">Delete</button>
        </td>
      </tr>`
    ).join("") || `<tr><td colspan="6" class="muted">No quests yet</td></tr>`;
}
