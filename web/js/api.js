// web/js/api.js

const BASE = window.QUESTRO_API_BASE;

/**
 * Handles JSON requests and responses
 * 
 * @param {string} path - API path 
 * @param {RequestInit} opts - Fetch options
 * @returns {Promise} - Parsed JSON response
 * @throws {Error} - HTTP error
 */
async function http(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "content-type": "application/json", ...(opts.headers || {}) },
  });

  // No body
  if (res.status === 204) return null;
  const text = await res.text();
  if (!res.ok) throw new Error(text || `${res.status}`);
  try { return JSON.parse(text); } catch { return text; }
}

/**
 * Create a quest in the global Questro database.
 * 
 * @param {string} args.serverId - Discord guild/server ID
 * @param {string} args.userId   - Discord user ID
 * @param {string} [args.username] - Optional username
 * @param {string} args.title    - Quest title
 * @param {string[]} [args.tags] - Optional array of short tags
 * @returns {Promise} - The created quest record
 */
export function createQuest({ serverId, userId, username, title, tags = [] }) {
  return http(`/quests`, {
    method: "POST",
    body: JSON.stringify({ serverId, userId, username, title, tags }),
  });
}

/**
 * Retrieve quests, optionally filtered. Requires a serverId to scope the query.
 *
 * @param {string} args.serverId - Discord guild/server ID
 * @param {("open"|"done")} [args.status] - Filter by status
 * @param {string} [args.userId] - Filter by Discord user ID
 * @param {string} [args.tag]    - Filter by tag (contains)
 * @param {number} [args.limit]  - Max items to return
 * @returns {Promise} - Envelope containing items
 */
export async function listQuests({ serverId, status, userId, tag, limit } = {}) {
  if (!serverId) throw new Error("serverId required");

  // Set url params
  const u = new URL(`${BASE}/quests`);
  u.searchParams.set("serverId", serverId);
  if (status) u.searchParams.set("status", status);
  if (userId) u.searchParams.set("userId", userId);
  if (tag) u.searchParams.set("tag", tag);
  if (limit) u.searchParams.set("limit", String(limit));

  // Fetch
  const r = await fetch(u, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/**
 * Update a quest
 * 
 * @param {string} id - Quest id
 * @param {Object} patch - Partial fields to update
 * @returns {Promise} - The updated record
 */
export function updateQuest(id, patch) {
  return http(`/quests/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

/**
 * Delete a quest permanently
 * 
 * @param {string} id - Quest id
 * @returns {Promise} - null
 */
export function deleteQuest(id) {
  return http(`/quests/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/**
 * Get the per-server leaderboard
 *
 * @param {string} args.serverId - Discord guild/server ID
 * @param {number} [args.limit=10] - Max rows to return
 * @returns {Promise} - Leaderboard array
 */
export async function getLeaderboard({ serverId, limit = 10 } = {}) {
  // Set URL params
  const u = new URL(`${BASE}/leaderboard`);
  u.searchParams.set("serverId", serverId);
  u.searchParams.set("limit", String(limit));

  const r = await fetch(u);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
